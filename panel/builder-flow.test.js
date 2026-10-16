var assert = require('assert');
var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var { JSDOM } = jsdom;

var root = require('path').join(__dirname, '..');
var UK = 'Від серійних машин точкового та рельєфного зварювання — до складних автоматичних ліній.';
var EN = 'From serial spot and projection welders to complex automatic lines.';

var page = '<!DOCTYPE html><html data-st-i18n="off" data-st-builder="1"><head></head><body><main id="main"><p class="lead">' + UK + '</p></main>' +
  '<script>window.ST={lookup:function(uk,lang){if(lang==="en"&&String(uk).replace(/\\s+/g," ").trim()===' + JSON.stringify(UK) + ')return ' + JSON.stringify(EN) + ';return uk;}};</script></body></html>';

var saved = [];
var dom = new JSDOM('<!DOCTYPE html><html><body><div id="host"></div></body></html>', {
  url: 'http://127.0.0.1:8080/panel/panel.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true
});
var window = dom.window;
window.confirm = function () { return true; };
(function () {
  var proto = window.HTMLIFrameElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'srcdoc') || Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'srcdoc');
  Object.defineProperty(proto, 'srcdoc', {
    configurable: true,
    set: function (html) {
      if (desc && desc.set) { try { desc.set.call(this, html); } catch (err) { /* jsdom */ } }
      var self = this;
      setTimeout(function () {
        try {
          self.contentDocument.open();
          self.contentDocument.write(html);
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

function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
function hasCyr(s) { return /[\u0400-\u04FF]/.test(s); }

window.STBuilder.open('00-strona-glowna', window.document.getElementById('host'), {
  api: function (payload) {
    if (payload.action === 'cms.page.builder') {
      return Promise.resolve({
        ok: true, html: page, name: 'Home', id: '00-strona-glowna',
        title: 'T', desc: 'D', ogtitle: 'O', pages: [], canDelete: false, url: '/'
      });
    }
    if (payload.action === 'cms.page.commit') {
      saved.push(payload);
      return Promise.resolve({ ok: true, i18nNote: 'Saved.' });
    }
    return Promise.resolve({ ok: true });
  },
  flash: function () {},
  uploadFile: function () {},
  back: function () {},
  i18nSwept: '00-strona-glowna'
});

function frameDoc() {
  var frame = window.document.getElementById('stb-frame');
  return frame && frame.contentDocument;
}

function waitForLead() {
  return new Promise(function (resolve, reject) {
    var n = 0;
    var t = setInterval(function () {
      n++;
      var doc = frameDoc();
      var lead = doc && doc.querySelector('p.lead');
      if (lead && textOf(lead) === EN) {
        clearInterval(t);
        resolve(lead);
      } else if (n > 50) {
        clearInterval(t);
        reject(new Error('lead not english: ' + (lead ? textOf(lead) : 'missing')));
      }
    }, 20);
  });
}

function selectWord(doc, el, word) {
  var node = el.firstChild;
  var raw = node.nodeValue || '';
  var at = raw.indexOf(word);
  assert.ok(at >= 0, 'word in lead');
  var range = doc.createRange();
  range.setStart(node, at);
  range.setEnd(node, at + word.length);
  var sel = doc.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return range;
}

waitForLead().then(function (lead) {
  var doc = frameDoc();
  var host = window.document.getElementById('host');
  selectWord(doc, lead, 'projection');
  host.querySelector('[data-act="bold"]').click();
  lead = doc.querySelector('p.lead');
  assert.ok(lead.querySelector('strong'), 'bold wrapped the word');
  assert.strictEqual(textOf(lead), EN, 'bold kept the English sentence');
  assert.ok(!hasCyr(textOf(lead)), 'bold did not insert Ukrainian');

  var strong = lead.querySelector('strong');
  selectWord(doc, strong, 'projection');
  var ev = new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
  doc.dispatchEvent(ev);
  lead = doc.querySelector('p.lead');
  assert.ok(!lead.querySelector('strong'), 'Ctrl+Z removed the bold');
  assert.strictEqual(textOf(lead), EN, 'undo kept English');

  host.querySelector('#stb-redo').click();
  lead = doc.querySelector('p.lead');
  assert.ok(lead.querySelector('strong'), 'redo restored the bold');
  assert.ok(!hasCyr(textOf(lead)), 'redo+bold did not insert Ukrainian');

  selectWord(doc, lead.querySelector('strong'), 'projection');
  host.querySelector('[data-act="bold"]').click();
  lead = doc.querySelector('p.lead');
  assert.strictEqual(textOf(lead), EN);
  assert.ok(!hasCyr(lead.innerHTML) || lead.innerHTML.indexOf(UK) < 0, 'second bold after undo did not paste the Ukrainian sentence');
  assert.ok(!hasCyr(textOf(lead)));

  var dirty = host.querySelector('#stb-dirty');
  var wasHidden = dirty.hidden;
  host.querySelector('#stb-hex').focus();
  host.querySelector('#stb-hex').value = '255';
  assert.strictEqual(dirty.hidden, wasHidden, 'typing in the hex field does not mark unsaved by itself');
  host.querySelector('#stb-hex').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  assert.strictEqual(dirty.hidden, wasHidden, 'invalid hex does not mark unsaved');

  selectWord(doc, lead, 'projection');
  var sw = host.querySelector('.stb__swatch[data-color="#d10a11"]');
  sw.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  sw.click();
  lead = doc.querySelector('p.lead');
  assert.ok(/color:\s*#d10a11/i.test(lead.innerHTML), 'brand swatch applied in one click');
  assert.strictEqual(textOf(lead), EN);
  assert.equal(dirty.hidden, false, 'applying a colour marks unsaved');

  var colored = lead.querySelector('span[style*="d10a11"], span[style*="#d10a11"]') || lead.querySelector('[style*="color"]');
  assert.ok(colored, 'colour span exists');
  lead.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  var paste = new window.Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(paste, 'clipboardData', {
    value: {
      getData: function (type) {
        if (type === 'text/html') return '<span style="letter-spacing:2px;-webkit-text-fill-color:red;white-space:pre;background-color:yellow">XX</span>';
        if (type === 'text/plain') return 'XX';
        return '';
      }
    }
  });
  var node = colored.firstChild;
  var range = doc.createRange();
  range.setStart(node, node.nodeValue.length);
  range.collapse(true);
  doc.getSelection().removeAllRanges();
  doc.getSelection().addRange(range);
  doc.dispatchEvent(paste);
  colored = doc.querySelector('p.lead').querySelector('[style*="color"]') || doc.querySelector('p.lead');
  assert.ok(textOf(doc.querySelector('p.lead')).indexOf('XX') >= 0, 'plain text was inserted');
  assert.ok(!/letter-spacing|-webkit-text-fill-color|background-color/.test(doc.querySelector('p.lead').innerHTML), 'paste did not keep inline styles');

  var beforeSave = textOf(doc.querySelector('p.lead'));
  host.querySelector('#stb-save').click();
  assert.strictEqual(textOf(doc.querySelector('p.lead')), beforeSave, 'save did not flash another language');
  assert.ok(!hasCyr(textOf(doc.querySelector('p.lead'))), 'English save did not flash Ukrainian');

  return new Promise(function (r) { setTimeout(r, 80); }).then(function () {
    doc = frameDoc();
    lead = doc.querySelector('p.lead');
    assert.strictEqual(textOf(lead), EN, 'reload after English save stayed in English');
    host.querySelector('[data-lang="uk"]').click();
    assert.ok(hasCyr(textOf(doc.querySelector('p.lead'))), 'Ukrainian view is Ukrainian before the network returns');
    return new Promise(function (r) { setTimeout(r, 80); });
  }).then(function () {
    host.querySelector('#stb-save').click();
    return new Promise(function (r) { setTimeout(r, 80); }).then(function () {
    var on = host.querySelector('.stb__lang button.is-on');
    assert.strictEqual(on && on.getAttribute('data-lang'), 'uk', 'save stayed on Ukrainian');
    assert.ok(hasCyr(textOf(frameDoc().querySelector('p.lead'))), 'Ukrainian text stayed after save');
    var layout = host.querySelector('[data-grp="layout"]');
    var color = host.querySelector('#stb-color');
    assert.ok(layout.compareDocumentPosition(color) & window.Node.DOCUMENT_POSITION_PRECEDING, 'layout controls come after colour');
    assert.ok(layout.classList.contains('stb__grp--layout'));
    console.log('builder-flow.test.js ok');
    });
  });
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
