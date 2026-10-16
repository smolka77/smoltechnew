/* node panel/edytor-poprawki.test.js
   Partial recolour, Russian colour save/read, and one undo step per edit. */
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var { JSDOM } = jsdom;

var root = path.join(__dirname, '..');

function boot(html, lang, onCommit) {
  var dom = new JSDOM('<!DOCTYPE html><html><body><div id="host"></div></body></html>', {
    url: 'http://127.0.0.1:8080/panel/panel.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  var window = dom.window;
  window.confirm = function () { return true; };
  if (lang) window.localStorage.setItem('stb-last-lang', lang);
  (function () {
    var proto = window.HTMLIFrameElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'srcdoc') || Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'srcdoc');
    Object.defineProperty(proto, 'srcdoc', {
      configurable: true,
      set: function (value) {
        if (desc && desc.set) { try { desc.set.call(this, value); } catch (err) { /* jsdom */ } }
        var self = this;
        setTimeout(function () {
          try {
            self.contentDocument.open();
            self.contentDocument.write(value);
            self.contentDocument.close();
          } catch (err2) { /* ignore */ }
          self.dispatchEvent(new window.Event('load'));
        }, 0);
      },
      get: function () { return desc && desc.get ? desc.get.call(this) : ''; }
    });
  })();
  ['edytor-stan.js', 'kolor.js', 'builder.js'].forEach(function (name) {
    window.eval(fs.readFileSync(path.join(root, 'panel', name), 'utf8'));
  });
  var saved = [];
  var pages = { html: html };
  window.STBuilder.open('00-strona-glowna', window.document.getElementById('host'), {
    api: function (payload) {
      if (payload.action === 'cms.page.builder') {
        return Promise.resolve({
          ok: true, html: pages.html, name: 'Home', id: '00-strona-glowna',
          title: 'T', desc: 'D', ogtitle: 'O', pages: [], canDelete: false, url: '/'
        });
      }
      if (payload.action === 'cms.page.commit') {
        saved.push(payload);
        if (onCommit) {
          var next = onCommit(payload, pages.html);
          if (next) pages.html = next;
        }
        return Promise.resolve({ ok: true, i18nNote: 'Saved.' });
      }
      return Promise.resolve({ ok: true });
    },
    flash: function () {},
    uploadFile: function () {},
    back: function () {},
    i18nSwept: '00-strona-glowna'
  });
  return { window: window, saved: saved, pages: pages };
}

function frameDoc(window) {
  var frame = window.document.getElementById('stb-frame');
  return frame && frame.contentDocument;
}

function textOf(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

function waitFor(window, pred, label) {
  return new Promise(function (resolve, reject) {
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      var doc = frameDoc(window);
      var ok = false;
      try { ok = !!(doc && pred(doc)); } catch (err) { ok = false; }
      if (ok) { clearInterval(t); resolve(doc); }
      else if (n > 60) { clearInterval(t); reject(new Error(label || 'timed out')); }
    }, 20);
  });
}

function findText(el, word) {
  function walk(n) {
    if (!n) return null;
    if (n.nodeType === 3 && String(n.nodeValue || '').indexOf(word) >= 0) return n;
    var c;
    for (c = n.firstChild; c; c = c.nextSibling) {
      var hit = walk(c);
      if (hit) return hit;
    }
    return null;
  }
  return walk(el);
}

function selectWord(doc, el, word) {
  var node = findText(el, word);
  assert.ok(node, 'missing ' + word);
  var at = node.nodeValue.indexOf(word);
  var range = doc.createRange();
  range.setStart(node, at);
  range.setEnd(node, at + word.length);
  var sel = doc.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return node;
}

function paintSwatch(window, doc, el, word, color) {
  selectWord(doc, el, word);
  var sw = window.document.querySelector('.stb__swatch[data-color="' + color + '"]');
  sw.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  sw.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
}

function inputEvent(window, type, inputType) {
  var ev;
  try { ev = new window.InputEvent(type, { bubbles: true, cancelable: true, inputType: inputType }); }
  catch (err) {
    ev = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'inputType', { value: inputType });
  }
  if (!ev.inputType) Object.defineProperty(ev, 'inputType', { value: inputType });
  return ev;
}

var EN = 'We design and build spot welders.';
var UK = 'Від серійних машин точкового та рельєфного зварювання.';
var pageEn = '<!DOCTYPE html><html data-st-i18n="off" data-st-builder="1"><head></head><body><main id="main"><p class="lead">' + UK + '</p></main>' +
  '<script>window.ST={lookup:function(uk,lang){if(lang==="en"&&String(uk).replace(/\\s+/g," ").trim()===' + JSON.stringify(UK) + ')return ' + JSON.stringify(EN) + ';return uk;}};</script></body></html>';

var H1 = 'Машини контактного зварювання';
var H1RU = 'Машины контактной сварки';
var UK2 = 'Проєктуємо й виробляємо машини точкового зварювання.';
var RU2 = 'Проектируем и производим машины точечной сварки.';
var EN2 = 'We design and build spot welding machines.';
var pageRu = '<!DOCTYPE html><html data-st-i18n="off" data-st-builder="1"><head></head><body><main id="main"><h1>' + H1 + '</h1><p class="hero__sub">' + UK2 + '</p></main>' +
  '<script>window.ST_RU={};window.ST={lookup:function(uk,lang){var key=String(uk).replace(/\\s+/g," ").trim();' +
  'if(lang==="en"&&key===' + JSON.stringify(UK2) + ')return ' + JSON.stringify(EN2) + ';' +
  'if(lang==="ru"&&key===' + JSON.stringify(UK2) + ')return ' + JSON.stringify(RU2) + ';' +
  'if(lang==="ru"&&key===' + JSON.stringify(H1) + ')return ' + JSON.stringify(H1RU) + ';' +
  'return uk;}};</script></body></html>';

var session = boot(pageEn);
var window = session.window;

waitFor(window, function (doc) {
  return textOf(doc.querySelector('p.lead')) === EN;
}, 'english lead').then(function () {
  var doc = frameDoc(window);
  var lead = doc.querySelector('p.lead');
  paintSwatch(window, doc, lead, 'build', '#d10a11');
  lead = doc.querySelector('p.lead');
  assert.strictEqual(lead.querySelector('span').textContent, 'build');
  assert.ok(/color:\s*#d10a11/i.test(lead.querySelector('span').getAttribute('style') || ''));

  var calls = 0;
  var node = lead.querySelector('span').firstChild;
  doc.caretPositionFromPoint = function () {
    calls += 1;
    return { offsetNode: node, offset: calls === 1 ? 1 : 4 };
  };
  lead.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 8, clientY: 8 }));
  var wide = doc.createRange();
  wide.selectNodeContents(lead.querySelector('span'));
  doc.getSelection().removeAllRanges();
  doc.getSelection().addRange(wide);
  lead.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: 20, clientY: 8 }));
  assert.strictEqual(doc.getSelection().toString(), 'uil', 'drag inside a coloured word is not the whole span');

  paintSwatch(window, doc, lead, 'uil', '#1d4ed8');
  lead = doc.querySelector('p.lead');
  assert.strictEqual(textOf(lead), EN);
  assert.strictEqual(
    lead.innerHTML,
    UK.split('').length ? lead.innerHTML : lead.innerHTML
  );
  assert.ok(lead.innerHTML.indexOf('color:#d10a11">b<') >= 0 || lead.innerHTML.indexOf('color:#d10a11">b</span>') >= 0, lead.innerHTML);
  assert.strictEqual(
    lead.innerHTML.replace(/^[\s\S]*?(<span style="color:#d10a11">b<\/span><span style="color:#1d4ed8">uil<\/span><span style="color:#d10a11">d<\/span>)[\s\S]*$/, '$1'),
    '<span style="color:#d10a11">b</span><span style="color:#1d4ed8">uil</span><span style="color:#d10a11">d</span>'
  );

  doc.getSelection().removeAllRanges();
  var hex = window.document.querySelector('#stb-hex');
  hex.value = '#d10a11';
  window.document.querySelector('[data-act="clearcolor"]').click();
  assert.strictEqual(hex.value, '', 'Default colour clears the hex field');

  var typed = boot(pageEn);
  return waitFor(typed.window, function (doc2) {
    return textOf(doc2.querySelector('p.lead')) === EN;
  }, 'fresh english lead').then(function () {
    return typed;
  });
}).then(function (typed) {
  var doc = frameDoc(typed.window);
  var lead = doc.querySelector('p.lead');
  lead.setAttribute('contenteditable', 'true');
  var text = lead.firstChild.nodeType === 3 ? lead.firstChild : findText(lead, 'We');
  lead.dispatchEvent(inputEvent(typed.window, 'beforeinput', 'insertText'));
  text.nodeValue = 'Q' + text.nodeValue;
  selectWord(doc, lead, 'build');
  paintSwatch(typed.window, doc, lead, 'build', '#d10a11');
  lead = doc.querySelector('p.lead');
  assert.ok(/color:\s*#d10a11/i.test(lead.innerHTML), 'colour before paste');
  lead.setAttribute('contenteditable', 'true');
  var colored = findText(lead, 'build');
  var range = doc.createRange();
  range.setStart(colored, colored.nodeValue.length);
  range.collapse(true);
  doc.getSelection().removeAllRanges();
  doc.getSelection().addRange(range);
  lead.dispatchEvent(inputEvent(typed.window, 'beforeinput', 'insertFromPaste'));
  var paste = new window.Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(paste, 'clipboardData', {
    value: { getData: function () { return 'ZZ'; } }
  });
  lead.dispatchEvent(paste);
  assert.ok(textOf(doc.querySelector('p.lead')).indexOf('ZZ') >= 0, 'paste landed');
  typed.window.document.querySelector('#stb-undo').click();
  lead = doc.querySelector('p.lead');
  assert.ok(textOf(lead).indexOf('ZZ') < 0, 'undo drops only the paste');
  assert.ok(textOf(lead).indexOf('Q') === 0, 'undo keeps the earlier typed letter');
  assert.ok(/color:\s*#d10a11/i.test(lead.innerHTML), 'undo keeps the earlier colour: ' + lead.innerHTML);

  function bakeRu(payload, html) {
    var pair = (payload.i18nPairs || []).filter(function (row) { return row && row.role === 'ru' && row.ruHtml; })[0];
    if (!pair) return html;
    var attr = String(pair.ruHtml).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return html.replace(
      '<p class="hero__sub">' + UK2 + '</p>',
      '<p class="hero__sub" data-st-ruhtml="' + attr + '">' + UK2 + '</p>'
    );
  }
  var ru = boot(pageRu, '', bakeRu);
  return waitFor(ru.window, function (doc2) {
    return textOf(doc2.querySelector('p.hero__sub')) === EN2;
  }, 'russian page opened in english').then(function () {
    ru.window.document.querySelector('[data-lang="ru"]').click();
    return waitFor(ru.window, function (doc2) {
      return textOf(doc2.querySelector('p.hero__sub')) === RU2 && textOf(doc2.querySelector('h1')) === H1RU;
    }, 'russian view');
  }).then(function () {
    var doc2 = frameDoc(ru.window);
    var sub = doc2.querySelector('p.hero__sub');
    paintSwatch(ru.window, doc2, sub, 'точечной', '#d10a11');
    sub = doc2.querySelector('p.hero__sub');
    assert.strictEqual(textOf(sub), RU2, 'colour kept the russian sentence');
    assert.ok(/color:\s*#d10a11/i.test(sub.innerHTML), sub.innerHTML);
    ru.window.document.querySelector('#stb-save').click();
    return new Promise(function (r) { setTimeout(r, 40); }).then(function () {
      assert.ok(ru.saved.length, 'russian save sent');
      var payload = ru.saved[0];
      var pair = (payload.i18nPairs || []).filter(function (row) { return row && row.role === 'ru'; })[0];
      assert.ok(pair, 'russian pair: ' + JSON.stringify(payload.i18nPairs));
      assert.strictEqual(pair.paintOnly, 1);
      assert.ok(String(pair.ruHtml || '').indexOf('color:#d10a11') >= 0, pair.ruHtml);
      assert.ok(String(pair.ruHtml || '').indexOf('точечной') >= 0, pair.ruHtml);
      assert.ok(String(pair.uk || '').indexOf('Проєктуємо') >= 0, pair.uk);
      assert.ok(payload.main.indexOf(UK2) >= 0, 'saved body stays ukrainian');
      assert.ok(payload.main.indexOf('Проектируем и производим') < 0, 'saved body is not the russian sentence');
      ru.window.document.querySelector('[data-lang="uk"]').click();
      ru.window.document.querySelector('[data-lang="ru"]').click();
      return waitFor(ru.window, function (doc3) {
        var again = doc3.querySelector('p.hero__sub');
        return again && textOf(again) === RU2 && /color:\s*#d10a11/i.test(again.innerHTML) && textOf(doc3.querySelector('h1')) === H1RU;
      }, 'russian colour survived a language round-trip');
    });
  });
}).then(function () {
  var remembered = boot(pageRu, 'ru');
  return waitFor(remembered.window, function (doc) {
    var on = remembered.window.document.querySelector('.stb__lang button.is-on');
    return textOf(doc.querySelector('p.hero__sub')) === RU2 && on && on.getAttribute('data-lang') === 'ru';
  }, 'last edit language is russian').then(function () {
    console.log('edytor-poprawki.test.js ok');
  });
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
