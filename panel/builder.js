/* Visual editor. Ukrainian HTML is what gets saved. English only updates the translation overlay. */
(function () {
  var HOSTS = 'h1,h2,h3,h4,h5,h6,p,li,a,button,span,dt,dd,strong,em,b,i,u,figcaption,summary,td,th,div';
  var SKIP_HOST = 'li.proof__i, li.stats__i, section, article.vcard, article.mach, [data-st-region], button.yt, button.lang__btn, button.chip, a.skip, label';

  function lum(color) {
    var m = String(color || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (!m) return 0;
    function ch(v) {
      v = Number(v) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * ch(m[1]) + 0.7152 * ch(m[2]) + 0.0722 * ch(m[3]);
  }

  function looksEn(s) {
    return /[A-Za-z]/.test(s) && !/[\u0400-\u04FF]/.test(s);
  }

  function pad(orig, text) {
    var lead = (String(orig).match(/^\s*/) || [''])[0];
    var trail = (String(orig).match(/\s*$/) || [''])[0];
    if (trail && lead + text === String(orig).trim()) return String(orig);
    return lead + text + (trail && text.slice(-trail.length) !== trail ? trail : '');
  }

  function walkText(doc, fn) {
    if (!doc.body) return;
    var tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p || p.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !String(node.nodeValue).trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = tw.nextNode())) fn(n);
  }

  function open(id, host, ctx) {
    ctx = ctx || {};
    var api = ctx.api;
    var flash = ctx.flash || function () {};
    var uploadFile = ctx.uploadFile || function () {};
    var doc = null;
    var frame = null;
    var mode = 'uk';
    var page = null;
    var dirty = false;
    var formDirty = false;
    var chromeDirty = false;
    var metaDirty = false;
    var selected = null;
    var image = null;
    var field = null;

    host.innerHTML = '' +
      '<div class="stb">' +
        '<div class="stb__bar">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="stb-back">← Wróć</button>' +
          '<strong class="stb__name" id="stb-name">Otwieram…</strong>' +
          '<div class="stb__lang" role="group" aria-label="Język treści">' +
            '<button type="button" data-lang="uk" class="is-on">Українська</button>' +
            '<button type="button" data-lang="en">English</button>' +
          '</div>' +
          '<p class="stb__hint">Ukraiński to tekst strony. English zmienia tylko tłumaczenie — układ jest wspólny. Zapis od razu wchodzi na witrynę.</p>' +
          '<a class="btn btn-ghost btn-sm" id="stb-live" target="_blank" rel="noopener" hidden>Zobacz na stronie</a>' +
          '<button type="button" class="btn btn-sm" id="stb-save">Zapisz na stronie</button>' +
        '</div>' +
        '<div class="stb__tools">' +
          '<button type="button" data-act="up" title="Wyżej">↑</button>' +
          '<button type="button" data-act="down" title="Niżej">↓</button>' +
          '<button type="button" data-act="dup">Duplikuj</button>' +
          '<button type="button" data-act="del">Usuń</button>' +
          '<button type="button" data-act="add">+ Blok</button>' +
          '<button type="button" data-act="bold"><b>B</b></button>' +
          '<button type="button" data-act="italic"><i>I</i></button>' +
          '<button type="button" data-act="link">Link</button>' +
          '<label class="stb__mini">Kolor <input type="color" id="stb-color" value="#d10a11"></label>' +
          '<button type="button" data-act="list">Lista</button>' +
          '<button type="button" data-act="item">+ Punkt</button>' +
          '<button type="button" data-act="img" disabled>Wymień zdjęcie</button>' +
          '<button type="button" data-act="alt" disabled>Alt</button>' +
          '<button type="button" data-act="noimg" disabled>Usuń zdjęcie</button>' +
          '<label class="stb__mini" id="stb-ph-wrap" hidden>Podpowiedź pola <input type="text" id="stb-ph"></label>' +
          '<button type="button" id="stb-child" hidden>+ Podstrona</button>' +
          '<button type="button" id="stb-delpage" hidden>Usuń podstronę</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="stb-meta-btn">Tytuł w Google</button>' +
        '</div>' +
        '<div class="stb__meta" id="stb-meta">' +
          '<label>Tytuł w Google <input type="text" id="stb-title"></label>' +
          '<label>Opis <textarea id="stb-desc" rows="2"></textarea></label>' +
          '<label>Tytuł przy udostępnianiu <input type="text" id="stb-og"></label>' +
        '</div>' +
        '<p class="stb__note" id="stb-note">Kliknij tekst, żeby go zmienić. Strzałki przesuwają element.</p>' +
        '<iframe class="stb__frame" id="stb-frame" title="Edycja strony"></iframe>' +
        '<p class="stb__status" id="stb-status"></p>' +
      '</div>';

    frame = host.querySelector('#stb-frame');
    var note = host.querySelector('#stb-note');
    var status = host.querySelector('#stb-status');
    var nameEl = host.querySelector('#stb-name');

    function say(msg, kind) {
      status.textContent = msg || '';
      status.className = 'stb__status' + (kind ? ' is-' + kind : '');
    }

    function markDirty(where) {
      dirty = true;
      if (where === 'form') formDirty = true;
      if (where === 'chrome') chromeDirty = true;
      say('Są niezapisane zmiany.');
    }

    host.querySelector('#stb-back').addEventListener('click', function () {
      if (dirty && !window.confirm('Są niezapisane zmiany. Wyjść bez zapisu?')) return;
      if (typeof ctx.back === 'function') ctx.back();
    });

    host.querySelector('#stb-meta-btn').addEventListener('click', function () {
      host.querySelector('#stb-meta').classList.toggle('is-on');
    });
    ['#stb-title', '#stb-desc', '#stb-og'].forEach(function (sel) {
      host.querySelector(sel).addEventListener('input', function () { metaDirty = true; markDirty('meta'); });
    });

    host.querySelector('.stb__tools').addEventListener('mousedown', function (e) {
      if (e.target.closest('input, textarea, select, a')) return;
      if (e.target.closest('button')) e.preventDefault();
    });

    host.querySelectorAll('.stb__lang button').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
    });

    host.querySelector('#stb-color').addEventListener('input', function (e) {
      paint(e.target.value);
    });
    host.querySelector('#stb-ph').addEventListener('input', function (e) {
      if (!field) return;
      field.setAttribute('placeholder', e.target.value);
      if (mode === 'uk') field.stbUk = e.target.value;
      markDirty(field.closest('#zapyt') ? 'form' : (field.closest('#main') ? 'page' : 'chrome'));
    });

    host.querySelector('.stb__tools').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      var act = btn.getAttribute('data-act');
      if (act === 'up') move(-1);
      else if (act === 'down') move(1);
      else if (act === 'dup') duplicate();
      else if (act === 'del') removeUnit();
      else if (act === 'add') addBlock();
      else if (act === 'bold') fmt('bold');
      else if (act === 'italic') fmt('italic');
      else if (act === 'link') makeLink();
      else if (act === 'list') makeList();
      else if (act === 'item') addItem();
      else if (act === 'img') replaceImage();
      else if (act === 'alt') editAlt();
      else if (act === 'noimg') removeImage();
    });

    function load() {
      say('Wczytuję stronę…');
      api({ action: 'cms.page.builder', id: id }).then(function (res) {
        if (!res || !res.ok) {
          say((res && res.error) || 'Nie udało się otworzyć strony.', 'err');
          return;
        }
        page = res;
        nameEl.textContent = res.name || id;
        host.querySelector('#stb-title').value = res.title || '';
        host.querySelector('#stb-desc').value = res.desc || '';
        host.querySelector('#stb-og').value = res.ogtitle || '';
        var live = host.querySelector('#stb-live');
        if (res.url) {
          live.hidden = false;
          live.href = res.url + (res.url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
        }
        host.querySelector('#stb-child').hidden = res.role !== 'group';
        host.querySelector('#stb-delpage').hidden = !res.canDelete;
        mode = 'uk';
        dirty = false;
        formDirty = false;
        chromeDirty = false;
        metaDirty = false;
        frame.srcdoc = res.html;
      }).catch(function () { say('Błąd połączenia.', 'err'); });
    }

    frame.addEventListener('load', function () {
      doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      injectChrome(doc);
      bindFrame(doc);
      selected = null;
      image = null;
      field = null;
      syncImageTools();
      say('Kliknij tekst na stronie. Zapis od razu wchodzi na witrynę.');
    });

    function injectChrome(d) {
      var prev = d.getElementById('stb-ui');
      if (prev) prev.remove();
      var style = d.createElement('style');
      style.id = 'stb-ui';
      style.setAttribute('data-stb-ui', '1');
      style.textContent = [
        '.stb-on{outline:2px solid #d10a11;outline-offset:3px}',
        '.stb-ink-light,.stb-ink-light *{background-color:#1a1a1a!important;color:#fff!important;-webkit-text-fill-color:#fff!important;caret-color:#fff!important}',
        '.stb-ink-dark,.stb-ink-dark *{background-color:#fff!important;color:#161616!important;-webkit-text-fill-color:#161616!important;caret-color:#161616!important}',
        '.stb-ink-light,.stb-ink-dark{border-radius:2px}',
        'a{cursor:text}'
      ].join('');
      d.head.appendChild(style);
    }

    function bindFrame(d) {
      d.addEventListener('click', onClick, true);
      d.addEventListener('submit', function (e) { e.preventDefault(); }, true);
      d.addEventListener('input', function (e) {
        var t = e.target;
        var where = 'page';
        if (t.closest && t.closest('#zapyt')) where = 'form';
        else if (t.closest && !t.closest('#main')) where = 'chrome';
        if (mode === 'en' && t.closest) {
          var box = t.closest('[contenteditable="true"]');
          if (box && box.stbUkLeaf && box.childNodes.length === 1 && box.firstChild && box.firstChild.nodeType === 3 && box.firstChild.stbUk == null) {
            box.firstChild.stbUk = box.stbUkLeaf;
          }
        }
        markDirty(where);
      });
      d.addEventListener('focusout', function (e) {
        var t = e.target;
        if (!t || !t.classList) return;
        t.classList.remove('stb-ink-light', 'stb-ink-dark');
        if (t.matches && t.matches('.stats__v')) {
          var n = String(t.textContent || '').replace(/[^\d]/g, '');
          if (n) t.setAttribute('data-count', n);
        }
      });
    }

    function whereOf(el) {
      if (!el) return 'page';
      if (el.closest('#zapyt')) return 'form';
      if (!el.closest('#main')) return 'chrome';
      return 'page';
    }

    function textHost(el) {
      var n = el;
      while (n && n !== doc.body) {
        if (n.matches && n.matches(SKIP_HOST)) { n = n.parentElement; continue; }
        if (n.matches && n.matches(HOSTS)) {
          if (n.tagName === 'DIV' && n.querySelector('div,p,ul,ol,li,h1,h2,h3,h4,h5,h6,section,article,table,figure,blockquote')) {
            n = n.parentElement;
            continue;
          }
          if (n.matches('label')) {
            var span = n.querySelector(':scope > span, span');
            if (span) return span;
            n = n.parentElement;
            continue;
          }
          return n;
        }
        n = n.parentElement;
      }
      return null;
    }

    function unitOf(el) {
      var main = doc.getElementById('main');
      var card = el.closest('li, article, details');
      if (card && card !== main && !(card.matches && card.matches('[data-st-region]'))) return card;
      var n = el;
      while (n.parentElement && n.parentElement !== main && n.parentElement !== doc.body) n = n.parentElement;
      if (main && n.parentElement === main) return n;
      return null;
    }

    function clearEdit() {
      doc.querySelectorAll('[contenteditable="true"]').forEach(function (el) {
        el.removeAttribute('contenteditable');
        el.classList.remove('stb-ink-light', 'stb-ink-dark');
      });
    }

    function startEdit(el) {
      if (!el) return;
      clearEdit();
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      var color = '#161616';
      try { color = frame.contentWindow.getComputedStyle(el).color; } catch (err) { /* keep default */ }
      el.classList.add(lum(color) > 0.7 ? 'stb-ink-light' : 'stb-ink-dark');
      el.focus();
    }

    function highlight(el) {
      doc.querySelectorAll('.stb-on').forEach(function (n) { n.classList.remove('stb-on'); });
      if (el) el.classList.add('stb-on');
      selected = el;
    }

    function syncImageTools() {
      var on = !!image;
      ['img', 'alt', 'noimg'].forEach(function (act) {
        var b = host.querySelector('[data-act="' + act + '"]');
        if (b) b.disabled = !on;
      });
    }

    function setNote(el) {
      if (el && el.closest('#zapyt')) {
        note.textContent = 'To jest wspólny formularz. Zmiana pojawi się na każdej stronie, która go pokazuje. Zapis wchodzi od razu.';
      } else if (image) {
        note.textContent = 'Zdjęcie. Możesz je wymienić albo usunąć. Po usunięciu tekst zajmuje całą szerokość.';
      } else {
        note.textContent = 'Kliknij tekst, żeby go zmienić. Strzałki przesuwają element. Zapis od razu wchodzi na witrynę.';
      }
    }

    function onClick(e) {
      var t = e.target;
      if (!t || t.nodeType !== 1) t = t && t.parentElement;
      if (!t) return;
      var link = t.closest('a');
      if (link) e.preventDefault();
      if (t.closest('.yt')) {
        e.preventDefault();
        editVideo(t.closest('.yt'));
        return;
      }
      var control = t.closest('input, textarea, select');
      if (control && control.closest('form')) {
        e.preventDefault();
        field = control;
        var wrap = host.querySelector('#stb-ph-wrap');
        wrap.hidden = false;
        host.querySelector('#stb-ph').value = control.getAttribute('placeholder') || '';
        if (control.stbUk == null) control.stbUk = control.getAttribute('placeholder') || '';
        var lab = control.closest('label');
        var span = lab && lab.querySelector('span');
        var unit = unitOf(control);
        highlight(unit);
        if (span) startEdit(span);
        setNote(control);
        return;
      }
      host.querySelector('#stb-ph-wrap').hidden = true;
      field = null;
      var img = t.closest('img');
      image = img || null;
      syncImageTools();
      var unit = unitOf(t);
      highlight(unit);
      var hostEl = textHost(t);
      if (hostEl && !hostEl.matches('img')) startEdit(hostEl);
      setNote(t);
    }

    function applyLang(lang) {
      if (!doc) return;
      var win = frame.contentWindow;
      if (lang === 'en') {
        if (!win.ST || typeof win.ST.lookup !== 'function') {
          say('Nie udało się wczytać tłumaczeń. Zostań przy ukraińskim albo odśwież edytor.', 'err');
          flash('Nie udało się wczytać tłumaczeń.');
          return;
        }
        walkText(doc, function (node) {
          if (node.stbUk == null) node.stbUk = node.nodeValue;
          var parent = node.parentElement;
          if (parent && parent.childNodes.length === 1) parent.stbUkLeaf = node.stbUk;
          var uk = String(node.stbUk).replace(/\s+/g, ' ').trim();
          var en = win.ST.lookup(uk, 'en');
          if (en && en !== uk) node.nodeValue = pad(node.stbUk, en);
        });
        doc.querySelectorAll('[placeholder]').forEach(function (el) {
          if (el.stbUk == null) el.stbUk = el.getAttribute('placeholder') || '';
          var uk = String(el.stbUk).trim();
          var en = win.ST.lookup(uk, 'en');
          if (en && en !== uk) el.setAttribute('placeholder', en);
        });
        mode = 'en';
      } else {
        walkText(doc, function (node) {
          if (node.stbUk != null) node.nodeValue = node.stbUk;
        });
        doc.querySelectorAll('[placeholder]').forEach(function (el) {
          if (el.stbUk != null) el.setAttribute('placeholder', el.stbUk);
        });
        mode = 'uk';
      }
      host.querySelectorAll('.stb__lang button').forEach(function (btn) {
        btn.classList.toggle('is-on', btn.getAttribute('data-lang') === mode);
      });
      if (field) host.querySelector('#stb-ph').value = field.getAttribute('placeholder') || '';
    }

    function move(dir) {
      if (!selected) { say('Kliknij element, który chcesz przesunąć.', 'err'); return; }
      var sib = dir < 0 ? selected.previousElementSibling : selected.nextElementSibling;
      if (!sib) return;
      if (dir < 0) sib.before(selected); else sib.after(selected);
      markDirty(whereOf(selected));
    }

    function duplicate() {
      if (!selected || !selected.parentElement) { say('Kliknij element, który chcesz skopiować.', 'err'); return; }
      if (selected.id === 'zapyt' || selected.querySelector('#zapyt')) {
        say('Formularz jest jeden na stronę.', 'err');
        return;
      }
      var copy = selected.cloneNode(true);
      if (copy.id) copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
      copy.classList.remove('stb-on');
      selected.after(copy);
      highlight(copy);
      markDirty(whereOf(copy));
    }

    function removeUnit() {
      if (!selected) { say('Kliknij element, który chcesz usunąć.', 'err'); return; }
      var form = selected.id === 'zapyt' || (selected.querySelector && selected.querySelector('#zapyt') && selected.querySelector('#zapyt').parentElement === selected);
      var msg = form
        ? 'Usunąć formularz tylko z tej strony? Na innych stronach zostanie.'
        : 'Usunąć ten element?';
      if (!window.confirm(msg)) return;
      var where = whereOf(selected);
      selected.remove();
      selected = null;
      markDirty(where);
    }

    function addBlock() {
      var main = doc.getElementById('main');
      if (!main) return;
      var sec = doc.createElement('section');
      sec.className = 'sec';
      sec.innerHTML = '<div class="wrap"><p class="eyebrow">Новий блок</p><h2>Заголовок</h2><p>Текст, який можна змінити.</p></div>';
      var anchor = selected && selected.closest('#main > *');
      var formEl = main.querySelector('#zapyt');
      if (anchor && anchor.parentElement === main) {
        if (formEl && anchor.nextElementSibling === formEl) formEl.before(sec);
        else anchor.after(sec);
      } else if (formEl) formEl.before(sec);
      else main.appendChild(sec);
      highlight(sec);
      var h = sec.querySelector('h2');
      if (h) startEdit(h);
      markDirty('page');
    }

    function fmt(cmd) {
      if (!doc) return;
      doc.execCommand('styleWithCSS', false, true);
      var ok = doc.execCommand(cmd, false, null);
      if (!ok) say('Zaznacz tekst, który chcesz wyróżnić.', 'err');
      else markDirty(whereOf(doc.getSelection() && doc.getSelection().anchorNode && doc.getSelection().anchorNode.parentElement));
    }

    function paint(color) {
      if (!doc) return;
      doc.execCommand('styleWithCSS', false, true);
      doc.execCommand('foreColor', false, color);
      markDirty('page');
    }

    function makeLink() {
      if (!doc) return;
      var url = window.prompt('Adres linku (https://, /strona/ albo mailto:)', 'https://');
      if (!url) return;
      url = url.trim();
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) {
        say('Dozwolony jest adres http, mailto, tel albo ścieżka zaczynająca się od /.', 'err');
        return;
      }
      doc.execCommand('createLink', false, url);
      markDirty('page');
    }

    function makeList() {
      if (!doc) return;
      try { frame.contentWindow.focus(); } catch (err) { /* iframe focus is optional */ }
      var sel = doc.getSelection();
      var node = sel && sel.rangeCount ? sel.anchorNode : null;
      var el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
      if (!el || !doc.body.contains(el)) el = doc.querySelector('[contenteditable="true"]');
      if (el && el.closest && el.closest('ul')) {
        var existing = el.closest('ul');
        existing.classList.add('ticks');
        markDirty(whereOf(existing));
        return;
      }
      if (sel && !sel.isCollapsed && el) {
        doc.execCommand('insertUnorderedList', false, null);
        var made = (sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement));
        var ul = made && made.closest && made.closest('ul');
        if (ul) {
          ul.classList.add('ticks');
          markDirty(whereOf(ul));
          return;
        }
      }
      var p = el && el.closest ? (el.matches('p') ? el : el.closest('p')) : null;
      if (!p || p.closest('ul, ol')) {
        say('Kliknij akapit, a potem Lista.', 'err');
        return;
      }
      var list = doc.createElement('ul');
      list.className = 'ticks';
      var item = doc.createElement('li');
      item.innerHTML = p.innerHTML;
      list.appendChild(item);
      p.replaceWith(list);
      startEdit(item);
      markDirty(whereOf(list));
    }

    function addItem() {
      if (!doc) return;
      var sel = doc.getSelection();
      var node = sel && sel.anchorNode;
      var el = (node && (node.nodeType === 1 ? node : node.parentElement)) || selected;
      var li = el && el.closest && el.closest('li');
      var list = el && el.closest && el.closest('ul, ol');
      if (!list) { makeList(); return; }
      var item = doc.createElement('li');
      item.textContent = 'Новий пункт';
      if (li && li.parentElement === list) li.after(item);
      else list.appendChild(item);
      if (list.tagName === 'UL') list.classList.add('ticks');
      startEdit(item);
      markDirty(whereOf(list));
    }

    function replaceImage() {
      if (!image || !uploadFile) { say('Kliknij zdjęcie.', 'err'); return; }
      var img = image;
      uploadFile(function (url) {
        var pic = img.closest('picture');
        if (pic) pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
        img.removeAttribute('srcset');
        img.setAttribute('src', url);
        markDirty(whereOf(img));
        say('Zdjęcie podmienione. Zapisz, żeby weszło na stronę.');
      });
    }

    function editAlt() {
      if (!image) return;
      var next = window.prompt('Opis zdjęcia (alt)', image.getAttribute('alt') || '');
      if (next == null) return;
      image.setAttribute('alt', next.trim());
      markDirty(whereOf(image));
    }

    function removeImage() {
      if (!image) return;
      if (!window.confirm('Usunąć to zdjęcie?')) return;
      var img = image;
      var where = whereOf(img);
      var fig = img.closest('figure');
      if (fig && fig.querySelectorAll('img').length === 1) fig.remove();
      else img.remove();
      image = null;
      syncImageTools();
      markDirty(where);
      setNote(null);
    }

    function editVideo(btn) {
      var cur = btn.getAttribute('data-vid') || '';
      var next = window.prompt('Link YouTube albo ID filmu', cur);
      if (!next) return;
      var m = String(next).match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([\w-]{11})/);
      var vid = m ? m[1] : (/^[\w-]{11}$/.test(next.trim()) ? next.trim() : '');
      if (!vid) { say('Nie rozpoznaję tego linku YouTube.', 'err'); return; }
      btn.setAttribute('data-vid', vid);
      var img = btn.querySelector('img');
      if (img) img.setAttribute('src', 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg');
      markDirty(whereOf(btn));
    }

    function collectPairs() {
      var pairs = [];
      var win = frame.contentWindow;
      if (mode !== 'en' || !win.ST || typeof win.ST.lookup !== 'function') return pairs;
      walkText(doc, function (node) {
        if (node.stbUk == null) return;
        var uk = String(node.stbUk).replace(/\s+/g, ' ').trim();
        var cur = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        var known = String(win.ST.lookup(uk, 'en') || '').trim();
        if (cur && cur !== uk && looksEn(cur) && cur !== known) pairs.push({ uk: uk, en: cur });
        node.nodeValue = node.stbUk;
      });
      doc.querySelectorAll('[placeholder]').forEach(function (el) {
        if (el.stbUk == null) return;
        var uk = String(el.stbUk).trim();
        var cur = String(el.getAttribute('placeholder') || '').trim();
        var known = String(win.ST.lookup(uk, 'en') || '').trim();
        if (cur && cur !== uk && looksEn(cur) && cur !== known) pairs.push({ uk: uk, en: cur });
        el.setAttribute('placeholder', el.stbUk);
      });
      return pairs;
    }

    function cleanup() {
      doc.querySelectorAll('[contenteditable]').forEach(function (el) {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
      });
      doc.querySelectorAll('.stb-ink-light, .stb-ink-dark, .stb-on').forEach(function (el) {
        el.classList.remove('stb-ink-light', 'stb-ink-dark', 'stb-on');
      });
      var ui = doc.getElementById('stb-ui');
      if (ui) ui.remove();
    }

    function save() {
      if (!doc) return;
      var btn = host.querySelector('#stb-save');
      btn.disabled = true;
      say('Zapisuję na stronie…');
      try {
      saveBody(btn);
      } catch (err) {
        btn.disabled = false;
        say('Nie zapisano: ' + (err && err.message ? err.message : err), 'err');
      }
    }

    function saveBody(btn) {
      var pairs = collectPairs();
      cleanup();
      var main = doc.getElementById('main');
      if (!main) { btn.disabled = false; say('Brak treści strony.', 'err'); return; }
      var formEl = main.querySelector('#zapyt');
      var dropForm = false;
      var formHtml = '';
      if (page && page.hasForm) {
        if (!formEl) dropForm = true;
        else if (formDirty) formHtml = formEl.outerHTML;
        if (formEl) formEl.replaceWith(doc.createTextNode('\n{{FORMULARZ}}\n'));
      }
      var payload = { action: 'cms.page.commit', id: id, main: main.innerHTML, i18nPairs: pairs };
      if (dropForm) payload.dropForm = true;
      if (formHtml) payload.form = formHtml;
      if (chromeDirty) {
        payload.chrome = {};
        ['topbar', 'header', 'drawer', 'footer', 'mbar'].forEach(function (key) {
          var el = doc.querySelector('[data-st-region="' + key + '"]');
          if (el) payload.chrome[key] = el.outerHTML;
        });
      }
      if (metaDirty) {
        payload.meta = {
          title: host.querySelector('#stb-title').value,
          desc: host.querySelector('#stb-desc').value,
          ogtitle: host.querySelector('#stb-og').value
        };
      }
      api(payload).then(function (res) {
        btn.disabled = false;
        if (!res || !res.ok) {
          say((res && res.error) || 'Nie zapisano.', 'err');
          flash((res && res.error) || 'Nie zapisano.');
          load();
          return;
        }
        dirty = false;
        say('Zapisane. Ta wersja jest już na stronie.', 'ok');
        flash('Zapisane. Ta wersja jest już na stronie.');
        load();
      }).catch(function () {
        btn.disabled = false;
        say('Błąd połączenia — nie zapisano.', 'err');
      });
    }

    host.querySelector('#stb-save').addEventListener('click', save);
    host.querySelector('#stb-child').addEventListener('click', function () {
      var title = window.prompt('Nazwa nowej podstrony — tak, jak ma być widoczna na stronie');
      if (!title || !title.trim()) return;
      say('Tworzę podstronę…');
      api({ action: 'cms.page.add-child', parent: id, title: title.trim() }).then(function (res) {
        if (!res || !res.ok) { say((res && res.error) || 'Nie utworzono podstrony.', 'err'); return; }
        flash('Nowa podstrona jest już na witrynie.');
        open(res.id, host, ctx);
      }).catch(function () { say('Błąd połączenia.', 'err'); });
    });
    host.querySelector('#stb-delpage').addEventListener('click', function () {
      var label = (page && page.name) || id;
      if (!window.confirm('Usunąć stronę „' + label + '”? Zniknie z witryny od razu.')) return;
      api({ action: 'cms.page.delete', id: id }).then(function (res) {
        if (!res || !res.ok) { say((res && res.error) || 'Nie usunięto.', 'err'); return; }
        flash('Usunięto. Strony już nie ma na witrynie.');
        if (typeof ctx.back === 'function') ctx.back();
      });
    });

    load();
  }

  window.STBuilder = { open: open };
})();
