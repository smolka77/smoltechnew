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

  function normUrl(h) {
    h = String(h || '').trim();
    if (!h || h === '#' || /^(mailto:|tel:|javascript:)/i.test(h)) return '';
    h = h.split('#')[0].split('?')[0];
    if (/^https?:/i.test(h)) {
      try {
        var u = new URL(h, window.location.origin);
        if (u.host !== window.location.host) return '';
        h = u.pathname;
      } catch (err) { return ''; }
    }
    if (!h || h.charAt(0) !== '/') return '';
    if (h.length > 1) h = h.replace(/\/+$/, '') + '/';
    return h;
  }

  function slugify(s) {
    var map = { а:'a', б:'b', в:'v', г:'h', ґ:'g', д:'d', е:'e', є:'ie', ж:'zh', з:'z', и:'y', і:'i', ї:'i', й:'i', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ь:'', ю:'iu', я:'ia', ы:'y', э:'e', ё:'e', ъ:'', 'ą':'a', 'ć':'c', 'ę':'e', 'ł':'l', 'ń':'n', 'ó':'o', 'ś':'s', 'ź':'z', 'ż':'z' };
    s = String(s || '').toLowerCase();
    var out = '';
    for (var i = 0; i < s.length; i++) out += map[s.charAt(i)] != null ? map[s.charAt(i)] : s.charAt(i);
    return out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  }

  function open(id, host, ctx) {
    ctx = ctx || {};
    var api = ctx.api;
    var flash = ctx.flash || function () {};
    var uploadFile = ctx.uploadFile || function () {};
    var doc = null;
    var frame = null;
    var mode = 'en';
    var page = null;
    var dirty = false;
    var formDirty = false;
    var chromeDirty = false;
    var metaDirty = false;
    var selected = null;
    var image = null;
    var field = null;
    var undoStack = [];
    var redoStack = [];
    var typing = false;
    var typeTimer = null;
    var drag = null;
    var skipClick = false;
    var slugTouched = false;
    var freshForm = false;

    var oldBlocks = document.getElementById('stb-blocks');
    if (oldBlocks) oldBlocks.remove();
    var oldPages = document.getElementById('stb-pages-dlg');
    if (oldPages) oldPages.remove();

    host.innerHTML = '' +
      '<div class="stb">' +
        '<div class="stb__bar">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="stb-back">← Back</button>' +
          '<strong class="stb__name" id="stb-name">Opening…</strong>' +
          '<div class="stb__lang" role="group" aria-label="Content language">' +
            '<button type="button" data-lang="uk">Українська</button>' +
            '<button type="button" data-lang="en" class="is-on">English</button>' +
          '</div>' +
          '<p class="stb__hint">English is the editing view. Ukrainian is what the public site shows. Save publishes immediately.</p>' +
          '<a class="btn btn-ghost btn-sm" id="stb-live" target="_blank" rel="noopener" hidden>View on site</a>' +
          '<button type="button" class="btn btn-sm" id="stb-save">Save to site</button>' +
        '</div>' +
        '<div class="stb__tools">' +
          '<button type="button" data-act="undo" id="stb-undo" disabled title="Undo (Ctrl+Z)">Undo</button>' +
          '<button type="button" data-act="redo" id="stb-redo" disabled title="Redo (Ctrl+Y)">Redo</button>' +
          '<button type="button" data-act="left" title="Align left">Left</button>' +
          '<button type="button" data-act="center" title="Align center">Center</button>' +
          '<button type="button" data-act="right" title="Align right">Right</button>' +
          '<button type="button" data-act="bold" title="Bold"><b>B</b></button>' +
          '<button type="button" data-act="italic" title="Italic"><i>I</i></button>' +
          '<button type="button" data-act="link">Link</button>' +
          '<label class="stb__mini">Color <input type="color" id="stb-color" value="#d10a11"></label>' +
          '<button type="button" data-act="list">List</button>' +
          '<button type="button" data-act="item" title="Turn the selected text into a bullet, or remove the bullet">+ Bullet</button>' +
          '<button type="button" data-act="up" title="Move up">↑</button>' +
          '<button type="button" data-act="down" title="Move down">↓</button>' +
          '<button type="button" data-act="dup">Duplicate</button>' +
          '<button type="button" data-act="del">Remove</button>' +
          '<button type="button" data-act="add">Add block</button>' +
          '<button type="button" data-act="img" disabled>Replace photo</button>' +
          '<button type="button" data-act="alt" disabled>Alt text</button>' +
          '<button type="button" data-act="noimg" disabled>Remove photo</button>' +
          '<label class="stb__mini" id="stb-ph-wrap" hidden>Field hint <input type="text" id="stb-ph"></label>' +
          '<button type="button" id="stb-pages">Add page</button>' +
          '<button type="button" id="stb-delpage" hidden>Delete page</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="stb-meta-btn">Google title</button>' +
        '</div>' +
        '<div class="stb__meta" id="stb-meta">' +
          '<label>Google title <input type="text" id="stb-title"></label>' +
          '<label>Description <textarea id="stb-desc" rows="2"></textarea></label>' +
          '<label>Share title <input type="text" id="stb-og"></label>' +
        '</div>' +
        '<p class="stb__note" id="stb-note">Click text to edit it. Drag a photo inside its frame to change the crop. Double-click a menu item to open that page.</p>' +
        '<iframe class="stb__frame" id="stb-frame" title="Page editor"></iframe>' +
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
      say('Unsaved changes.');
    }

    function syncHist() {
      host.querySelector('#stb-undo').disabled = undoStack.length === 0;
      host.querySelector('#stb-redo').disabled = redoStack.length === 0;
    }

    function capture() {
      var texts = [];
      var ph = [];
      if (!doc || !doc.body) return { html: '', texts: texts, ph: ph };
      walkText(doc, function (node) { texts.push(node.stbUk != null ? String(node.stbUk) : null); });
      doc.querySelectorAll('[placeholder]').forEach(function (el) {
        ph.push(el.stbUk != null ? String(el.stbUk) : null);
      });
      var clone = doc.body.cloneNode(true);
      clone.querySelectorAll('[contenteditable]').forEach(function (el) {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
      });
      clone.querySelectorAll('.stb-ink-light, .stb-ink-dark, .stb-on, .stb-dragging').forEach(function (el) {
        el.classList.remove('stb-ink-light', 'stb-ink-dark', 'stb-on', 'stb-dragging');
      });
      return { html: clone.innerHTML, texts: texts, ph: ph };
    }

    function restore(state) {
      if (!doc || !state) return;
      doc.body.innerHTML = state.html;
      var i = 0;
      walkText(doc, function (node) {
        if (state.texts[i] != null) node.stbUk = state.texts[i];
        i++;
      });
      var j = 0;
      doc.querySelectorAll('[placeholder]').forEach(function (el) {
        if (state.ph[j] != null) el.stbUk = state.ph[j];
        j++;
      });
      selected = null;
      image = null;
      field = null;
      syncImageTools();
      host.querySelector('#stb-ph-wrap').hidden = true;
    }

    function beforeChange() {
      if (!doc) return;
      var snap = capture();
      var last = undoStack[undoStack.length - 1];
      if (last && last.html === snap.html) {
        redoStack = [];
        syncHist();
        return;
      }
      undoStack.push(snap);
      if (undoStack.length > 80) undoStack.shift();
      redoStack = [];
      syncHist();
    }

    function resetHistory() {
      undoStack = [];
      redoStack = [];
      typing = false;
      syncHist();
    }

    function undo() {
      if (!doc || !undoStack.length) return;
      redoStack.push(capture());
      restore(undoStack.pop());
      markDirty('page');
      syncHist();
      say('Undone.');
    }

    function redo() {
      if (!doc || !redoStack.length) return;
      undoStack.push(capture());
      restore(redoStack.pop());
      markDirty('page');
      syncHist();
      say('Redone.');
    }

    function onKey(e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      var z = e.key === 'z' || e.key === 'Z';
      var y = e.key === 'y' || e.key === 'Y';
      if (z && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); undo(); }
      else if (y || (z && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); redo(); }
    }
    if (host._stbKey) document.removeEventListener('keydown', host._stbKey, true);
    host._stbKey = onKey;
    document.addEventListener('keydown', onKey, true);

    host.querySelector('#stb-back').addEventListener('click', function () {
      if (dirty && !window.confirm('There are unsaved changes. Leave without saving?')) return;
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
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-lang'));
        resetHistory();
      });
    });

    host.querySelector('#stb-color').addEventListener('input', function (e) {
      paint(e.target.value);
    });
    host.querySelector('#stb-ph').addEventListener('input', function (e) {
      if (!field) return;
      beforeChange();
      field.setAttribute('placeholder', e.target.value);
      if (mode === 'uk') field.stbUk = e.target.value;
      markDirty(field.closest('#zapyt') ? 'form' : (field.closest('#main') ? 'page' : 'chrome'));
    });

    host.querySelector('.stb__tools').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      var act = btn.getAttribute('data-act');
      if (act === 'undo') undo();
      else if (act === 'redo') redo();
      else if (act === 'left') align('left');
      else if (act === 'center') align('center');
      else if (act === 'right') align('right');
      else if (act === 'up') move(-1);
      else if (act === 'down') move(1);
      else if (act === 'dup') duplicate();
      else if (act === 'del') removeUnit();
      else if (act === 'add') openBlocks();
      else if (act === 'bold') fmt('bold');
      else if (act === 'italic') fmt('italic');
      else if (act === 'link') makeLink();
      else if (act === 'list') toggleBullet();
      else if (act === 'item') toggleBullet();
      else if (act === 'img') replaceImage();
      else if (act === 'alt') editAlt();
      else if (act === 'noimg') removeImage();
    });

    function load() {
      say('Loading the page…');
      api({ action: 'cms.page.builder', id: id }).then(function (res) {
        if (!res || !res.ok) {
          say((res && res.error) || 'Could not open the page.', 'err');
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
        host.querySelector('#stb-delpage').hidden = !res.canDelete;
        mode = 'en';
        dirty = false;
        formDirty = false;
        chromeDirty = false;
        metaDirty = false;
        frame.srcdoc = res.html;
      }).catch(function () { say('Connection error.', 'err'); });
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
      applyLang('en');
      resetHistory();
      var hello = ctx.hello || '';
      ctx.hello = '';
      say(hello || 'Click any text. Drag a photo to reposition it. Save publishes immediately.');
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
        'a{cursor:text}',
        'img{cursor:grab}',
        'img.stb-dragging{cursor:grabbing}'
      ].join('');
      d.head.appendChild(style);
    }

    function bindFrame(d) {
      d.addEventListener('click', onClick, true);
      d.addEventListener('dblclick', onDblClick, true);
      d.addEventListener('keydown', onKey, true);
      d.addEventListener('submit', function (e) { e.preventDefault(); }, true);
      d.addEventListener('beforeinput', function (e) {
        if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
          e.preventDefault();
          return;
        }
        if (!typing) beforeChange();
        typing = true;
        clearTimeout(typeTimer);
        typeTimer = setTimeout(function () { typing = false; }, 700);
      });
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
      d.addEventListener('pointerdown', onPointerDown, true);
      d.addEventListener('pointermove', onPointerMove, true);
      d.addEventListener('pointerup', onPointerUp, true);
      d.addEventListener('pointercancel', onPointerUp, true);
    }

    function whereOf(el) {
      if (!el) return 'page';
      if (el.closest && el.closest('#zapyt')) return 'form';
      if (el.closest && !el.closest('#main')) return 'chrome';
      return 'page';
    }

    function menuList(el) {
      return el && el.closest && el.closest('.nav__list, .mega, .drawer__list, .drawer__sub, nav.mbar, .ftr');
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
      if (el && el.closest && el.closest('#zapyt')) {
        note.textContent = 'This quote form is shared. A change shows on every page that includes it. Save publishes immediately.';
      } else if (image) {
        note.textContent = 'Photo. Drag it inside the frame to change the crop. You can also replace it or remove it.';
      } else {
        note.textContent = 'Click text to edit it. Left, center and right align the selection. Double-click a top-menu item to open that page.';
      }
    }

    function pageByUrl(href) {
      var n = normUrl(href);
      if (!n || !page || !page.pages) return '';
      for (var i = 0; i < page.pages.length; i++) {
        if (normUrl(page.pages[i].url) === n) return page.pages[i].id;
      }
      return '';
    }

    function onDblClick(e) {
      var t = e.target;
      if (!t || t.nodeType !== 1) t = t && t.parentElement;
      if (!t) return;
      var a = t.closest('a[href]');
      if (!a) return;
      if (!a.closest('[data-st-region="header"], [data-st-region="drawer"], [data-st-region="mbar"]')) return;
      var pid = pageByUrl(a.getAttribute('href'));
      if (!pid || pid === id) return;
      e.preventDefault();
      e.stopPropagation();
      if (dirty && !window.confirm('There are unsaved changes. Open the other page without saving?')) return;
      open(pid, host, ctx);
    }

    function onClick(e) {
      var t = e.target;
      if (!t || t.nodeType !== 1) t = t && t.parentElement;
      if (!t) return;
      if (skipClick) {
        skipClick = false;
        var imgOnly = t.closest('img');
        if (imgOnly) {
          image = imgOnly;
          syncImageTools();
          highlight(unitOf(imgOnly));
          setNote(imgOnly);
        }
        return;
      }
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
      var box = unitOf(t);
      highlight(box);
      var hostEl = textHost(t);
      if (hostEl && !hostEl.matches('img')) startEdit(hostEl);
      setNote(t);
    }

    function posOf(img) {
      var s = (img.style && img.style.objectPosition) || '';
      var m = String(s).match(/([\d.]+)%\s+([\d.]+)%/);
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      return [50, 50];
    }

    function onPointerDown(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var img = t.closest('img');
      if (!img || e.button !== 0) return;
      var pos = posOf(img);
      drag = { img: img, x: e.clientX, y: e.clientY, ox: pos[0], oy: pos[1], moved: false };
    }

    function onPointerMove(e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        beforeChange();
        drag.img.classList.add('stb-dragging');
        try { drag.img.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
      }
      e.preventDefault();
      var rect = drag.img.getBoundingClientRect();
      var nx = Math.max(0, Math.min(100, drag.ox - dx / Math.max(rect.width, 1) * 100));
      var ny = Math.max(0, Math.min(100, drag.oy - dy / Math.max(rect.height, 1) * 100));
      drag.img.style.objectPosition = nx.toFixed(1) + '% ' + ny.toFixed(1) + '%';
      if (drag.img.hasAttribute('data-st-crop')) drag.img.removeAttribute('data-st-crop');
    }

    function onPointerUp(e) {
      if (!drag) return;
      var img = drag.img;
      var moved = drag.moved;
      img.classList.remove('stb-dragging');
      drag = null;
      if (!moved) return;
      skipClick = true;
      e.preventDefault();
      e.stopPropagation();
      image = img;
      syncImageTools();
      highlight(unitOf(img));
      markDirty(whereOf(img));
      setNote(img);
      say('Crop updated. Save to publish it.');
    }

    function stampTree(root) {
      if (!root || !doc) return;
      var win = frame.contentWindow;
      var tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          var p = node.parentElement;
          if (!p || p.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !String(node.nodeValue).trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n;
      while ((n = tw.nextNode())) {
        if (n.stbUk == null) n.stbUk = n.nodeValue;
        if (mode === 'en' && win.ST && typeof win.ST.lookup === 'function') {
          var uk = String(n.stbUk).replace(/\s+/g, ' ').trim();
          var en = win.ST.lookup(uk, 'en');
          if (en && en !== uk) n.nodeValue = pad(n.stbUk, en);
        }
      }
    }

    function applyLang(lang) {
      if (!doc) return;
      var win = frame.contentWindow;
      if (lang === 'en') {
        if (!win.ST || typeof win.ST.lookup !== 'function') {
          mode = 'uk';
          say('Translations did not load. Showing the Ukrainian source.', 'err');
          host.querySelectorAll('.stb__lang button').forEach(function (btn) {
            btn.classList.toggle('is-on', btn.getAttribute('data-lang') === 'uk');
          });
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
      if (!selected) { say('Click the block you want to move.', 'err'); return; }
      var sib = dir < 0 ? selected.previousElementSibling : selected.nextElementSibling;
      if (!sib) return;
      beforeChange();
      if (dir < 0) sib.before(selected); else sib.after(selected);
      markDirty(whereOf(selected));
    }

    function duplicate() {
      if (!selected || !selected.parentElement) { say('Click the block you want to copy.', 'err'); return; }
      if (selected.id === 'zapyt' || selected.querySelector('#zapyt')) {
        say('A page can have only one quote form.', 'err');
        return;
      }
      beforeChange();
      var copy = selected.cloneNode(true);
      if (copy.id) copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
      copy.classList.remove('stb-on');
      selected.after(copy);
      stampTree(copy);
      highlight(copy);
      markDirty(whereOf(copy));
    }

    function removeUnit() {
      if (!selected) { say('Click the block you want to remove.', 'err'); return; }
      var form = selected.id === 'zapyt' || (selected.querySelector && selected.querySelector('#zapyt') && selected.querySelector('#zapyt').parentElement === selected);
      var msg = form
        ? 'Remove the quote form from this page only? Other pages keep it.'
        : 'Remove this block?';
      if (!window.confirm(msg)) return;
      beforeChange();
      var where = whereOf(selected);
      selected.remove();
      selected = null;
      markDirty(where);
    }

    function insertSection(html) {
      var main = doc.getElementById('main');
      if (!main) return null;
      var holder = doc.createElement('div');
      holder.innerHTML = html;
      var sec = holder.firstElementChild;
      if (!sec) return null;
      var anchor = selected && selected.closest('#main > *');
      var formEl = main.querySelector('#zapyt');
      if (anchor && anchor.parentElement === main && anchor.id !== 'zapyt') {
        if (formEl && anchor.nextElementSibling === formEl) formEl.before(sec);
        else anchor.after(sec);
      } else if (formEl) formEl.before(sec);
      else main.appendChild(sec);
      stampTree(sec);
      highlight(sec);
      var h = sec.querySelector('h1, h2, h3');
      if (h) startEdit(h);
      markDirty('page');
      return sec;
    }

    function blockTemplates() {
      var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      return [
        { id: 'text', name: 'Heading and text', blurb: 'Eyebrow, title and a paragraph', thumb: 'text', html:
          '<section class="sec"><div class="wrap"><p class="eyebrow">Розділ</p><h2 class="h-lg">Заголовок</h2><p class="lead">Короткий вступ, який можна змінити.</p><p>Текст, який можна змінити.</p></div></section>' },
        { id: 'split', name: 'Text and photo', blurb: 'Copy beside a photograph', thumb: 'split', html:
          '<section class="sec sec-paper"><div class="wrap"><div class="stud-stage"><div class="stud-stage__copy"><p class="eyebrow">Розділ</p><h2 class="h-lg">Заголовок поруч із фото</h2><p class="lead">Короткий опис, який можна змінити.</p></div><figure class="stud-stage__media"><img src="/assets/img/company-hall-1.jpg" alt="" width="1600" height="869" loading="lazy" decoding="async"><figcaption>Підпис до фото</figcaption></figure></div></div></section>' },
        { id: 'list', name: 'Bullet list', blurb: 'A heading and tick bullets', thumb: 'list', html:
          '<section class="sec"><div class="wrap"><p class="eyebrow">Перелік</p><h2 class="h-lg">Заголовок списку</h2><ul class="ticks"><li>Перший пункт</li><li>Другий пункт</li><li>Третій пункт</li></ul></div></section>' },
        { id: 'stats', name: 'Numbers', blurb: 'Four figures in a row', thumb: 'stats', html:
          '<section class="proof" aria-label="Цифри"><div class="wrap proof__in"><div class="proof__copy"><p class="eyebrow proof__eyebrow">Цифри</p><p class="proof__lead">Короткий підпис до цифр.</p></div><ul class="proof__stats"><li class="proof__i"><strong class="proof__n">10<span>+</span></strong><span class="proof__l">Підпис</span></li><li class="proof__i"><strong class="proof__n">100<span>%</span></strong><span class="proof__l">Підпис</span></li><li class="proof__i"><strong class="proof__n">24</strong><span class="proof__l">Підпис</span></li><li class="proof__i"><strong class="proof__n">1</strong><span class="proof__l">Підпис</span></li></ul></div></section>' },
        { id: 'faq', name: 'Questions', blurb: 'Expanding questions and answers', thumb: 'faq', html:
          '<section class="sec sec-paper-2"><div class="wrap wrap-tight"><div class="sec-head"><p class="eyebrow">Питання</p><h2 class="h-lg">Поширені питання</h2></div><div class="faq"><details><summary>Перше питання</summary><div class="faq__a"><p>Відповідь, яку можна змінити.</p></div></details><details><summary>Друге питання</summary><div class="faq__a"><p>Відповідь, яку можна змінити.</p></div></details></div></div></section>' },
        { id: 'cards', name: 'Cards', blurb: 'Three linked cards with photos', thumb: 'cards', html:
          '<section class="sec sec-paper"><div class="wrap"><div class="sec-head"><p class="eyebrow">Пропозиція</p><h2 class="h-lg">Три картки</h2></div><div class="grid g-3"><a class="tile" href="/kontakty/"><div class="tile__media"><span class="tile__no">01</span><img src="/assets/img/company-hall-1.jpg" alt="" width="400" height="300" loading="lazy"></div><div class="tile__body"><span class="tag">SMOLTECH</span><h3>Назва картки</h3><p>Короткий опис.</p><span class="arrow-link">Докладніше ' + arrow + '</span></div></a><a class="tile" href="/kontakty/"><div class="tile__media"><span class="tile__no">02</span><img src="/assets/img/prod-suspended-16-38.jpg" alt="" width="376" height="282" loading="lazy"></div><div class="tile__body"><span class="tag">SMOLTECH</span><h3>Назва картки</h3><p>Короткий опис.</p><span class="arrow-link">Докладніше ' + arrow + '</span></div></a><a class="tile" href="/kontakty/"><div class="tile__media"><span class="tile__no">03</span><img src="/assets/img/stud-cnc-1.jpg" alt="" width="709" height="1080" loading="lazy"></div><div class="tile__body"><span class="tag">SMOLTECH</span><h3>Назва картки</h3><p>Короткий опис.</p><span class="arrow-link">Докладніше ' + arrow + '</span></div></a></div></div></section>' },
        { id: 'video', name: 'Video', blurb: 'A YouTube card', thumb: 'video', html:
          '<section class="sec sec-dark-2"><div class="wrap"><div class="sec-head"><p class="eyebrow">Відео</p><h2 class="h-lg">Фільм</h2></div><div class="grid g-3"><article class="vcard" data-cat="spot"><button class="yt" type="button" data-vid="AFjrgjZMeXo" data-title="Відео SMOLTECH" aria-label="Дивитись відео"><img src="/assets/img/yt/AFjrgjZMeXo.jpg" alt="Відео SMOLTECH" width="640" height="360" loading="lazy"></button><div class="vcard__body"><span class="vcard__kind">Відео</span><h3>Назва відео</h3></div></article></div></div></section>' },
        { id: 'gallery', name: 'Photo row', blurb: 'Three photographs', thumb: 'split', html:
          '<section class="sec"><div class="wrap"><p class="eyebrow">Галерея</p><h2 class="h-lg">Фотографії</h2><div class="grid g-3"><figure><img src="/assets/img/company-hall-1.jpg" alt="" width="1600" height="869" loading="lazy"></figure><figure><img src="/assets/img/prod-suspended-16-38.jpg" alt="" width="376" height="282" loading="lazy"></figure><figure><img src="/assets/img/stud-cnc-1.jpg" alt="" width="709" height="1080" loading="lazy"></figure></div></div></section>' },
        { id: 'cta', name: 'Call to action', blurb: 'A short pitch and a button', thumb: 'text', html:
          '<section class="sec sec-dark"><div class="wrap"><p class="eyebrow">Наступний крок</p><h2 class="h-lg">Поговорімо про вашу деталь</h2><p class="lead">Короткий заклик, який можна змінити.</p><div class="hero__btns"><a class="btn" href="/kontakty/#zapyt">Отримати пропозицію</a></div></div></section>' },
        { id: 'form', name: 'Quote form', blurb: 'The shared inquiry form', thumb: 'faq', html: quoteForm() }
      ];
    }

    function quoteForm() {
      return "<section class=\"sec cta\" id=\"zapyt\" data-stb-newform=\"1\">\n  <div class=\"wrap cta__in\">\n    <div class=\"rv\">\n      <p class=\"eyebrow\">Запит на пропозицію</p>\n      <h2 class=\"h-lg\">Напишіть, що зварюєте — підберемо рішення під деталь</h2>\n      <p class=\"lead\">Шукаєте точкову машину, лінію для сіток чи партнера, який збере автоматичний комплекс під ваше виробництво? Залиште заявку — передзвонимо й скажемо, яка технологія, потужність і рівень автоматизації мають сенс.</p>\n      <div class=\"cta__actions\">\n        <a class=\"cta__phone\" href=\"tel:+48713215427\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z\"/></svg>\n          +48 71 321 54 27\n        </a>\n      </div>\n      <p class=\"cta__aside\">Або напишіть на <a href=\"mailto:biuro@smoltech.pl\">biuro@smoltech.pl</a> — відповідаємо українською, польською та англійською.</p>\n    </div>\n\n    <form class=\"form rv rv-d1\" action=\"/wyslij.php\" method=\"post\" data-ajax novalidate>\n      <input type=\"hidden\" name=\"src\" value=\"smoltech.com.ua\">\n      <input type=\"hidden\" name=\"ts\" value=\"\">\n      <input type=\"hidden\" name=\"page\" value=\"\">\n      <div class=\"hp\" aria-hidden=\"true\"><label>Не заповнюйте це поле<input type=\"text\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n\n      <div class=\"form__row\">\n        <label class=\"field\">\n          <span>Імʼя та прізвище *</span>\n          <input type=\"text\" name=\"name\" required autocomplete=\"name\" minlength=\"2\" maxlength=\"120\">\n        </label>\n        <label class=\"field\">\n          <span>Компанія</span>\n          <input type=\"text\" name=\"company\" autocomplete=\"organization\" maxlength=\"160\">\n        </label>\n      </div>\n\n      <div class=\"form__row\">\n        <label class=\"field\">\n          <span>E-mail *</span>\n          <input type=\"email\" name=\"email\" required autocomplete=\"email\" maxlength=\"160\">\n        </label>\n        <label class=\"field\">\n          <span>Телефон</span>\n          <input type=\"tel\" name=\"phone\" autocomplete=\"tel\" maxlength=\"40\">\n        </label>\n      </div>\n\n      <label class=\"field\">\n        <span>Тема запиту</span>\n        <input type=\"text\" name=\"topic\" list=\"topic-suggestions\" maxlength=\"120\" autocomplete=\"off\" placeholder=\"— оберіть або впишіть —\">\n        <datalist id=\"topic-suggestions\">\n          <option value=\"Машини точкового та рельєфного зварювання\"></option>\n          <option value=\"Автоматизований / роботизований комплекс\"></option>\n          <option value=\"Машини для зварювання сіток і панелей огорожі\"></option>\n          <option value=\"Приварювання шпильок\"></option>\n          <option value=\"Сервіс і запасні частини\"></option>\n          <option value=\"Інше\"></option>\n        </datalist>\n      </label>\n\n      <label class=\"field\">\n        <span>Що потрібно зварити *</span>\n        <textarea name=\"message\" required minlength=\"10\" maxlength=\"4000\" placeholder=\"Матеріал і товщина, тип зʼєднання, розміри деталі, який такт потрібен…\"></textarea>\n      </label>\n\n      <p class=\"form__note\">* — обовʼязкові поля.</p>\n      <div class=\"form__msg\" role=\"status\" aria-live=\"polite\"></div>\n      <div><button class=\"btn btn-lg\" type=\"submit\">Надіслати запит</button></div>\n      <div class=\"form-privacy\">\n        <button type=\"button\" class=\"form-privacy__i\" aria-haspopup=\"dialog\" aria-controls=\"form-privacy-dlg\" aria-label=\"Інформація про обробку персональних даних\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 8h.01\" stroke-linecap=\"round\"/></svg>\n        </button>\n        <p class=\"form-privacy__text\">Ваші персональні дані оброблятиме SMOLTECH Technika Zgrzewalnicza Sp. z o.o. з метою розгляду цього запиту. Докладніше — у нашій <a href=\"https://xtechart.com/polityka-konfidentsiynosti/\" target=\"_blank\" rel=\"noopener noreferrer\">Політиці конфіденційності</a>.</p>\n      </div>\n    </form>\n  </div>\n</section>\n";
    }

    function thumb(kind) {
      if (kind === 'split') return '<i class="bar"></i><i class="line a"></i><i class="line b"></i><i class="pic"></i>';
      if (kind === 'list') return '<i class="dot"></i><i class="dot dot2"></i><i class="dot dot3"></i><i class="line a" style="left:24px"></i><i class="line b" style="left:24px"></i><i class="line" style="left:24px;top:54px"></i>';
      if (kind === 'stats') return '<i class="bar"></i><i class="line a"></i><i class="line b"></i><i class="line" style="top:54px;width:30%"></i>';
      if (kind === 'cards') return '<i class="pic" style="left:8px;width:28%"></i><i class="pic" style="left:36%;width:28%;background:#3a3f4a"></i><i class="pic" style="right:8px;width:28%;background:#8d1018"></i>';
      if (kind === 'video') return '<i class="pic" style="left:8px;right:8px;width:auto"></i>';
      if (kind === 'faq') return '<i class="bar"></i><i class="line a"></i><i class="line b"></i><i class="line" style="top:54px"></i>';
      return '<i class="bar"></i><i class="line a"></i><i class="line b"></i>';
    }

    function openBlocks() {
      if (!doc) return;
      var old = document.getElementById('stb-blocks');
      if (old) old.remove();
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-blocks';
      var cards = blockTemplates().map(function (t) {
        return '<button type="button" class="stb-card" data-id="' + t.id + '"><span class="stb-thumb">' + thumb(t.thumb) + '</span><b>' + t.name + '</b><span>' + t.blurb + '</span></button>';
      }).join('');
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-blocks-title"><h2 id="stb-blocks-title">Add a block</h2><p class="lead">Choose a section that already exists on the site. It is inserted with placeholder text you can edit, using the same styles as the live page.</p><div class="stb-grid">' + cards + '</div><div class="stb-actions"><button type="button" class="btn btn-ghost" id="stb-blocks-close">Cancel</button></div></div>';
      document.body.appendChild(modal);
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });
      modal.querySelector('#stb-blocks-close').addEventListener('click', close);
      modal.querySelectorAll('.stb-card').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idT = btn.getAttribute('data-id');
          var tpl = null;
          blockTemplates().forEach(function (t) { if (t.id === idT) tpl = t; });
          if (!tpl) return;
          if (idT === 'form' && doc.getElementById('zapyt')) {
            say('This page already has the quote form.', 'err');
            close();
            return;
          }
          beforeChange();
          insertSection(tpl.html);
          close();
          say('Block added. Save to publish it.');
        });
      });
    }

    function align(dir) {
      if (!doc) return;
      beforeChange();
      try { frame.contentWindow.focus(); } catch (err) { /* optional */ }
      doc.execCommand('styleWithCSS', false, true);
      var cmd = dir === 'center' ? 'justifyCenter' : (dir === 'right' ? 'justifyRight' : 'justifyLeft');
      var sel = doc.getSelection();
      var hostEl = doc.querySelector('[contenteditable="true"]');
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        var target = hostEl || selected;
        if (!target) { say('Click the text you want to align.', 'err'); return; }
        target.style.textAlign = dir;
        markDirty(whereOf(target));
        return;
      }
      doc.execCommand(cmd, false, null);
      markDirty(whereOf((sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement)) || hostEl));
    }

    function fmt(cmd) {
      if (!doc) return;
      beforeChange();
      doc.execCommand('styleWithCSS', false, true);
      var ok = doc.execCommand(cmd, false, null);
      if (!ok) say('Select the text you want to format.', 'err');
      else markDirty(whereOf(doc.getSelection() && doc.getSelection().anchorNode && doc.getSelection().anchorNode.parentElement));
    }

    function paint(color) {
      if (!doc) return;
      beforeChange();
      doc.execCommand('styleWithCSS', false, true);
      doc.execCommand('foreColor', false, color);
      markDirty('page');
    }

    function makeLink() {
      if (!doc) return;
      var url = window.prompt('Link address (https://, /page/ or mailto:)', 'https://');
      if (!url) return;
      url = url.trim();
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) {
        say('Use an http, mailto or tel address, or a path that starts with /.', 'err');
        return;
      }
      beforeChange();
      doc.execCommand('createLink', false, url);
      markDirty('page');
    }

    function currentEl() {
      var sel = doc.getSelection();
      var node = sel && sel.rangeCount ? sel.anchorNode : null;
      var el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
      if (!el || !doc.body.contains(el)) el = doc.querySelector('[contenteditable="true"]') || selected;
      return el;
    }

    function unwrapLi(li) {
      var list = li.parentElement;
      if (!list) return;
      var p = doc.createElement('p');
      while (li.firstChild) p.appendChild(li.firstChild);
      var before = [];
      var after = [];
      var seen = false;
      Array.prototype.forEach.call(list.children, function (child) {
        if (child === li) { seen = true; return; }
        (seen ? after : before).push(child);
      });
      var frag = doc.createDocumentFragment();
      if (before.length) {
        var ul1 = list.cloneNode(false);
        before.forEach(function (c) { ul1.appendChild(c); });
        frag.appendChild(ul1);
      }
      frag.appendChild(p);
      if (after.length) {
        var ul2 = list.cloneNode(false);
        after.forEach(function (c) { ul2.appendChild(c); });
        frag.appendChild(ul2);
      }
      list.replaceWith(frag);
      startEdit(p);
      markDirty(whereOf(p));
    }

    function toggleBullet() {
      if (!doc) return;
      try { frame.contentWindow.focus(); } catch (err) { /* optional */ }
      var el = currentEl();
      if (menuList(el)) { say('The site menu is not a bullet list. Click a paragraph in the page.', 'err'); return; }
      var li = el && el.closest && el.closest('li');
      var list = li && li.closest('ul, ol');
      if (li && list) {
        beforeChange();
        unwrapLi(li);
        say('Bullet removed.');
        return;
      }
      var p = el && el.closest ? (el.matches && el.matches('p, h2, h3, div') ? el : el.closest('p')) : null;
      if (!p || (p.closest && p.closest('ul, ol'))) {
        say('Click a paragraph, then + Bullet.', 'err');
        return;
      }
      beforeChange();
      var made = doc.createElement('ul');
      made.className = 'ticks';
      var item = doc.createElement('li');
      while (p.firstChild) item.appendChild(p.firstChild);
      if (!item.textContent.trim()) item.textContent = 'Новий пункт';
      made.appendChild(item);
      p.replaceWith(made);
      stampTree(made);
      startEdit(item);
      markDirty(whereOf(made));
      say('Bullet added. Click + Bullet again to remove it.');
    }

    function replaceImage() {
      if (!image || !uploadFile) { say('Click a photo first.', 'err'); return; }
      var img = image;
      uploadFile(function (url) {
        beforeChange();
        var pic = img.closest('picture');
        if (pic) pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
        img.removeAttribute('srcset');
        img.setAttribute('src', url);
        markDirty(whereOf(img));
        say('Photo replaced. Save to publish it.');
      });
    }

    function editAlt() {
      if (!image) return;
      var next = window.prompt('Photo description (alt)', image.getAttribute('alt') || '');
      if (next == null) return;
      beforeChange();
      image.setAttribute('alt', next.trim());
      markDirty(whereOf(image));
    }

    function removeImage() {
      if (!image) return;
      if (!window.confirm('Remove this photo?')) return;
      beforeChange();
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
      var next = window.prompt('YouTube link or video ID', cur);
      if (!next) return;
      var m = String(next).match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([\w-]{11})/);
      var vid = m ? m[1] : (/^[\w-]{11}$/.test(next.trim()) ? next.trim() : '');
      if (!vid) { say('That does not look like a YouTube link.', 'err'); return; }
      beforeChange();
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
      doc.querySelectorAll('.stb-ink-light, .stb-ink-dark, .stb-on, .stb-dragging').forEach(function (el) {
        el.classList.remove('stb-ink-light', 'stb-ink-dark', 'stb-on', 'stb-dragging');
      });
      var ui = doc.getElementById('stb-ui');
      if (ui) ui.remove();
    }

    function save() {
      if (!doc) return;
      var btn = host.querySelector('#stb-save');
      btn.disabled = true;
      say('Saving to the site…');
      try {
        saveBody(btn);
      } catch (err) {
        btn.disabled = false;
        say('Not saved: ' + (err && err.message ? err.message : err), 'err');
      }
    }

    function saveBody(btn) {
      var pairs = collectPairs();
      var formEl = doc.getElementById('zapyt');
      freshForm = !!(formEl && formEl.getAttribute('data-stb-newform') === '1');
      cleanup();
      var main = doc.getElementById('main');
      if (!main) { btn.disabled = false; say('The page has no content.', 'err'); return; }
      formEl = main.querySelector('#zapyt');
      var dropForm = false;
      var formHtml = '';
      var keepForm = false;
      if (formEl) {
        if (formDirty) formHtml = formEl.outerHTML;
        else if (freshForm || !(page && page.hasForm)) keepForm = true;
        formEl.replaceWith(doc.createTextNode('\n{{FORMULARZ}}\n'));
      } else if (page && page.hasForm) dropForm = true;
      var payload = { action: 'cms.page.commit', id: id, main: main.innerHTML, i18nPairs: pairs };
      if (dropForm) payload.dropForm = true;
      if (formHtml) payload.form = formHtml;
      if (keepForm) payload.keepForm = true;
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
          say((res && res.error) || 'Not saved.', 'err');
          flash((res && res.error) || 'Not saved.');
          load();
          return;
        }
        dirty = false;
        say('Saved. This version is on the site.', 'ok');
        flash('Saved. This version is on the site.');
        load();
      }).catch(function () {
        btn.disabled = false;
        say('Connection error — nothing was saved.', 'err');
      });
    }

    function menuOptions(selectedId) {
      return [
        ['top', 'Top navigation bar'],
        ['machines', 'Machines dropdown'],
        ['spot', 'Spot welding submenu'],
        ['studs', 'Stud welding dropdown'],
        ['hidden', 'Hidden from the menu']
      ].map(function (row) {
        return '<option value="' + row[0] + '"' + (row[0] === selectedId ? ' selected' : '') + '>' + row[1] + '</option>';
      }).join('');
    }

    function openPages() {
      var old = document.getElementById('stb-pages-dlg');
      if (old) old.remove();
      slugTouched = false;
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-pages-dlg';
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-pages-title">' +
        '<h2 id="stb-pages-title">Add a page</h2>' +
        '<p class="lead">Set the title, the address, which category it belongs to, and exactly where the link appears. After you create it, this editor opens that page.</p>' +
        '<div class="stb-form">' +
          '<label>Page title<input type="text" id="stb-np-title" placeholder="For example: Service"></label>' +
          '<label>URL slug<input type="text" id="stb-np-slug" placeholder="service"></label>' +
          '<label>Category<label class="vh"></label><select id="stb-np-parent"><option value="">None — top-level page</option></select></label>' +
          '<label>Show in the menu<select id="stb-np-menu">' + menuOptions('hidden') + '</select></label>' +
          '<label>Position (1 = first)<input type="number" id="stb-np-pos" min="1" max="40" value="1"></label>' +
          '<p class="wide" id="stb-np-status"></p>' +
        '</div>' +
        '<div class="stb-actions"><button type="button" class="btn" id="stb-np-create">Create and edit</button><button type="button" class="btn btn-ghost" id="stb-np-close">Close</button></div>' +
        '<h2 style="margin-top:1.1rem">Pages already on the site</h2>' +
        '<p class="lead">Move a page in the menu, change which dropdown it uses, or hide it. The address of an existing page stays the same.</p>' +
        '<div class="stb-pages"><table><thead><tr><th>Page</th><th>Address</th><th>Menu</th><th>Position</th><th></th></tr></thead><tbody id="stb-np-rows"></tbody></table></div>' +
        '</div>';
      document.body.appendChild(modal);
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      modal.querySelector('#stb-np-close').addEventListener('click', close);
      var titleInput = modal.querySelector('#stb-np-title');
      var slugInput = modal.querySelector('#stb-np-slug');
      titleInput.addEventListener('input', function () {
        if (!slugTouched) slugInput.value = slugify(titleInput.value);
      });
      slugInput.addEventListener('input', function () { slugTouched = true; });
      function fill(cat) {
        var parent = modal.querySelector('#stb-np-parent');
        var cur = parent.value;
        parent.innerHTML = '<option value="">None — top-level page</option>' + (cat.parents || []).map(function (p) {
          return '<option value="' + p.id + '">' + p.name + '</option>';
        }).join('');
        parent.value = cur;
        var body = modal.querySelector('#stb-np-rows');
        body.innerHTML = (cat.pages || []).map(function (p) {
          return '<tr data-id="' + p.id + '"><td>' + (p.name || p.id) + (p.parentName ? '<br><small>' + p.parentName + '</small>' : '') + '</td><td><code>' + (p.url || '') + '</code></td><td><select data-menu>' + menuOptions(p.menu) + '</select></td><td><input data-pos type="number" min="1" max="40" value="' + (p.position || 1) + '" style="width:4.2rem"></td><td><button type="button" class="btn btn-sm" data-save>Save place</button> <button type="button" class="btn btn-ghost btn-sm" data-open>Open</button></td></tr>';
        }).join('');
        body.querySelectorAll('tr').forEach(function (tr) {
          var pid = tr.getAttribute('data-id');
          tr.querySelector('[data-save]').addEventListener('click', function () {
            var status = modal.querySelector('#stb-np-status');
            status.textContent = 'Saving the menu…';
            api({
              action: 'cms.page.place',
              id: pid,
              menu: tr.querySelector('[data-menu]').value,
              position: parseInt(tr.querySelector('[data-pos]').value, 10) || 1
            }).then(function (res) {
              if (!res || !res.ok) { status.textContent = (res && res.error) || 'Could not move the page.'; return; }
              status.textContent = res.where || 'Menu updated.';
              api({ action: 'cms.page.catalog' }).then(function (again) { if (again && again.ok) fill(again); });
            }).catch(function () { status.textContent = 'Connection error.'; });
          });
          tr.querySelector('[data-open]').addEventListener('click', function () {
            if (pid === id) { close(); return; }
            if (dirty && !window.confirm('There are unsaved changes. Open the other page without saving?')) return;
            var row = (cat.pages || []).filter(function (p) { return p.id === pid; })[0] || {};
            ctx.hello = 'Now editing this page. ' + (row.menuLabel || 'Menu') + ', position ' + (row.position || '') + '. Address: ' + (row.url || '') + '.';
            close();
            open(pid, host, ctx);
          });
        });
      }
      api({ action: 'cms.page.catalog' }).then(function (cat) {
        if (!cat || !cat.ok) { modal.querySelector('#stb-np-status').textContent = (cat && cat.error) || 'Could not load pages.'; return; }
        fill(cat);
      }).catch(function () { modal.querySelector('#stb-np-status').textContent = 'Connection error.'; });
      modal.querySelector('#stb-np-create').addEventListener('click', function () {
        var status = modal.querySelector('#stb-np-status');
        var title = titleInput.value.trim();
        if (!title) { status.textContent = 'Enter a page title.'; return; }
        status.textContent = 'Creating the page…';
        api({
          action: 'cms.page.place',
          title: title,
          slug: slugInput.value.trim(),
          parent: modal.querySelector('#stb-np-parent').value,
          menu: modal.querySelector('#stb-np-menu').value,
          position: parseInt(modal.querySelector('#stb-np-pos').value, 10) || 1
        }).then(function (res) {
          if (!res || !res.ok) { status.textContent = (res && res.error) || 'The page was not created.'; return; }
          ctx.hello = res.where || 'The new page is open.';
          close();
          open(res.id, host, ctx);
        }).catch(function () { status.textContent = 'Connection error.'; });
      });
    }

    host.querySelector('#stb-save').addEventListener('click', save);
    host.querySelector('#stb-pages').addEventListener('click', openPages);
    host.querySelector('#stb-delpage').addEventListener('click', function () {
      var label = (page && page.name) || id;
      if (!window.confirm('Delete the page “' + label + '”? It leaves the site immediately.')) return;
      api({ action: 'cms.page.delete', id: id }).then(function (res) {
        if (!res || !res.ok) { say((res && res.error) || 'Not deleted.', 'err'); return; }
        flash('Deleted. The page is no longer on the site.');
        if (typeof ctx.back === 'function') ctx.back();
      });
    });

    load();
  }

  window.STBuilder = { open: open };
})();
