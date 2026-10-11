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
    var moveMode = false;
    var photoTap = null;
    var lastOpen = 0;
    var skipClick = false;
    var slugTouched = false;
    var freshForm = false;
    var level = 'text';
    var currentSection = null;
    var currentItem = null;
    var linkRange = null;
    var pickedEl = null;

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
          '<p class="stb__hint">Click once to edit words. Double-click a menu link to open that page.</p>' +
        '</div>' +
        '<div class="stb__tools" role="toolbar" aria-label="Editor tools">' +
          '<div class="stb__grp" data-grp="text">' +
            '<span class="stb__grp-h">Text</span>' +
            '<button type="button" data-act="bold" title="Bold"><b>B</b></button>' +
            '<button type="button" data-act="italic" title="Italic"><i>I</i></button>' +
            '<button type="button" data-act="under" title="Underline"><u>U</u></button>' +
            '<label class="stb__mini" title="Text size">Size <select id="stb-size" title="Text size"><option value="">Size</option><option value="0.85rem">Small</option><option value="1rem">Normal</option><option value="1.25rem">Large</option><option value="1.6rem">Larger</option></select></label>' +
            '<label class="stb__mini" title="Text color">Color <input type="color" id="stb-color" value="#d10a11" title="Text color"></label>' +
            '<button type="button" data-act="left" title="Align left">Left</button>' +
            '<button type="button" data-act="center" title="Align center">Center</button>' +
            '<button type="button" data-act="right" title="Align right">Right</button>' +
            '<button type="button" data-act="item" title="Turn the selected text into a bullet, or remove the bullet">Bullets</button>' +
            '<button type="button" data-act="link" title="Link the selected words">Link</button>' +
          '</div>' +
          '<div class="stb__grp" data-grp="layout">' +
            '<span class="stb__grp-h">Layout</span>' +
            '<button type="button" data-act="add" title="Insert a ready-made section">Add block</button>' +
            '<button type="button" data-act="up" title="Move the selected card or section up">Up</button>' +
            '<button type="button" data-act="down" title="Move the selected card or section down">Down</button>' +
            '<button type="button" data-act="dup" title="Duplicate the selected card or section">Duplicate</button>' +
            '<button type="button" data-act="del" title="Delete the selected card. Delete a whole section only after choosing it in the bar">Delete</button>' +
          '</div>' +
          '<div class="stb__grp" data-grp="media">' +
            '<span class="stb__grp-h">Media</span>' +
            '<button type="button" data-act="move" id="stb-move" title="Turn this on, then drag a photo inside its frame" aria-pressed="false">Move photo</button>' +
            '<button type="button" data-act="img" title="Replace the selected photo" disabled>Replace</button>' +
            '<button type="button" data-act="resetpos" title="Put the photo back in the middle of its frame" disabled>Reset</button>' +
            '<button type="button" data-act="alt" title="Edit the photo description" disabled>Alt text</button>' +
            '<button type="button" data-act="noimg" title="Remove the selected photo" disabled>Remove</button>' +
          '</div>' +
          '<div class="stb__grp" data-grp="page">' +
            '<span class="stb__grp-h">Page</span>' +
            '<button type="button" data-act="undo" id="stb-undo" disabled title="Undo (Ctrl+Z)">Undo</button>' +
            '<button type="button" data-act="redo" id="stb-redo" disabled title="Redo (Ctrl+Y or Ctrl+Shift+Z)">Redo</button>' +
            '<button type="button" id="stb-add-type" hidden title="Add a machine type: a card on this page and a new subpage">Add machine type</button>' +
            '<button type="button" id="stb-add-mach" hidden title="Add a product card on this page">Add product</button>' +
            '<button type="button" id="stb-add-var" hidden title="Add a variant column to the specification table">Add variant</button>' +
            '<button type="button" id="stb-pages" title="Add a page or change where a page sits in the menu">Add page</button>' +
            '<button type="button" id="stb-delpage" hidden title="Delete this page">Delete page</button>' +
            '<button type="button" id="stb-meta-btn" title="Google title and description">Page settings</button>' +
            '<a class="btn btn-ghost btn-sm" id="stb-live" target="_blank" rel="noopener" hidden title="Open the public page">Preview</a>' +
            '<button type="button" class="btn btn-sm" id="stb-save" title="Publish this page to the site">Save</button>' +
          '</div>' +
          '<label class="stb__mini" id="stb-ph-wrap" hidden>Field hint <input type="text" id="stb-ph" title="Placeholder shown in the empty field"></label>' +
        '</div>' +
        '<div class="stb__meta" id="stb-meta">' +
          '<label>Google title <input type="text" id="stb-title"></label>' +
          '<label>Description <textarea id="stb-desc" rows="2"></textarea></label>' +
          '<label>Share title <input type="text" id="stb-og"></label>' +
        '</div>' +
        '<p class="stb__note" id="stb-note">Click text to edit it. Double-click a menu or card link to open that page. To crop a photo, click Move photo, then drag.</p>' +
        '<div class="stb__pick" id="stb-pick" hidden></div>' +
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
      level = 'text';
      currentSection = null;
      currentItem = null;
      renderPick();
      syncImageTools();
      syncPageTools();
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
    host.querySelector('#stb-size').addEventListener('change', function (e) {
      applySize(e.target.value);
      e.target.value = '';
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
      else if (act === 'under') fmt('underline');
      else if (act === 'link') makeLink();
      else if (act === 'list') toggleBullet();
      else if (act === 'item') toggleBullet();
      else if (act === 'move') setMoveMode(!moveMode);
      else if (act === 'img') replaceImage();
      else if (act === 'resetpos') resetPhoto();
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
        pickedEl = null;
        linkRange = null;
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
      syncPageTools();
      applyLang('en');
      resetHistory();
      var hello = ctx.hello || '';
      ctx.hello = '';
      say(hello || 'Click text to edit it. Double-click a menu link to open that page. Save publishes immediately.');
    });

    function injectChrome(d) {
      var prev = d.getElementById('stb-ui');
      if (prev) prev.remove();
      var style = d.createElement('style');
      style.id = 'stb-ui';
      style.setAttribute('data-stb-ui', '1');
      style.textContent = [
        '.stb-on{outline:2px solid #d10a11;outline-offset:3px}',
        'html{scroll-behavior:auto!important}',
        '.stb-ink-light,.stb-ink-light *{background-color:#1a1a1a!important;color:#fff!important;-webkit-text-fill-color:#fff!important;caret-color:#fff!important}',
        '.stb-ink-dark,.stb-ink-dark *{background-color:#fff!important;color:#161616!important;-webkit-text-fill-color:#161616!important;caret-color:#161616!important}',
        'a.st-link,a[data-st-link]{color:#d10a11!important;-webkit-text-fill-color:#d10a11!important;font-weight:700!important;text-decoration:underline!important;text-underline-offset:3px}',
        '.stb-ink-light,.stb-ink-dark{border-radius:2px}',
        'a{cursor:text}',
        '[data-st-region="header"] a[href^="/"],[data-st-region="drawer"] a[href^="/"],[data-st-region="mbar"] a[href^="/"],[data-st-region="footer"] a[href^="/"],a.tile{cursor:pointer}',
        'img{cursor:grab;-webkit-user-drag:none;user-select:none;touch-action:none}',
        'img.stb-dragging{cursor:grabbing}',
        '[data-st-builder] .hdr{overflow:visible!important}',
        '@media (max-width:1279px) and (min-width:820px){[data-st-builder] .nav{display:flex}[data-st-builder] .burger{display:none}[data-st-builder] .hdr__cta .btn{display:none}[data-st-builder] .nav__link{font-size:.64rem;padding:.45rem .22rem;letter-spacing:.01em;white-space:nowrap}}',
        '[data-st-builder] .nav__item.is-open>.mega,[data-st-builder] .mega__fly.is-open>.mega--flyout{opacity:1;visibility:visible;transform:none;pointer-events:auto}',
        '[data-st-builder] .drawer.is-open{transform:none}',
        '[data-st-builder] .drawer__sub.is-open{max-height:80rem}',
        'html.stb-move .hero__in,html.stb-move .hero::before,html.stb-move .hero__emerge::after,html.stb-move .hero__bg::after,html.stb-move .grid-lines,html.stb-move .spark{pointer-events:none!important}',
        'html.stb-move .hero__bg,html.stb-move .hero__emerge,html.stb-move .hero__shot,html.stb-move figure,html.stb-move .tile__media,html.stb-move .card__media,html.stb-move .hero__bg img,html.stb-move .hero__emerge img,html.stb-move .hero__shot img,html.stb-move figure img,html.stb-move .tile__media img,html.stb-move .card__media img{pointer-events:auto!important;cursor:grab!important}',
        'html.stb-move .hero,html.stb-move figure,html.stb-move a.tile,html.stb-move a.card{cursor:grab}',
        'html.stb-move body{user-select:none}'
      ].join('');
      d.head.appendChild(style);
    }

    function bindFrame(d) {
      d.addEventListener('keydown', function (e) {
        if (mode !== 'en' || !(e.ctrlKey || e.metaKey)) return;
        var k = String(e.key || '').toLowerCase();
        if (k === 'b' || k === 'i' || k === 'u' || k === 'k') {
          e.preventDefault();
          e.stopPropagation();
          requireUk();
        }
      }, true);
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
        var nameNode = t.closest && (t.closest('.model-strip__name') || t.closest('.param-matrix__head[data-col]'));
        if (!nameNode && t.closest) nameNode = t.closest('button.model-strip__btn');
        if (nameNode) syncVariantName(nameNode);
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
        var nameNode = t.closest && (t.closest('.model-strip__name') || t.closest('.param-matrix__head[data-col]') || t.closest('button.model-strip__btn'));
        if (nameNode) {
          syncVariantName(nameNode);
          var held = nameNode.matches && nameNode.matches('.model-strip__name, .param-matrix__head[data-col]') ? nameNode : nameNode.querySelector('.model-strip__name');
          if (held) {
            var clean = plainLabel(held.textContent);
            if (clean && held.textContent !== clean) held.textContent = clean;
            syncVariantName(held);
          }
        }
      });
      d.addEventListener('pointerdown', onPointerDown, true);
      d.addEventListener('pointermove', onPointerMove, true);
      d.addEventListener('pointerup', onPointerUp, true);
      d.addEventListener('pointercancel', onPointerUp, true);
      d.addEventListener('dragstart', function (e) {
        var img = e.target && e.target.closest && e.target.closest('img');
        if (img) { e.preventDefault(); e.stopPropagation(); }
      }, true);
      d.addEventListener('selectstart', function (e) {
        if (moveMode || (drag && drag.moved)) e.preventDefault();
      }, true);
      d.querySelectorAll('img').forEach(function (img) { img.setAttribute('draggable', 'false'); });
      d.querySelectorAll('[data-st-region="header"] a[href], [data-st-region="drawer"] a[href], [data-st-region="footer"] a[href], a.tile').forEach(function (a) {
        if (!pageByUrl(a.getAttribute('href'))) return;
        if (!a.getAttribute('title')) a.setAttribute('title', 'Double-click to open this page. Click once to edit the words.');
      });
      if (moveMode) d.documentElement.classList.add('stb-move');
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
      if (el && el.closest) {
        var variantName = el.closest('.model-strip__name');
        if (variantName) return variantName;
        var variantBtn = el.closest('button.model-strip__btn');
        if (variantBtn) {
          var innerName = variantBtn.querySelector('.model-strip__name');
          if (innerName) return innerName;
        }
        var head = el.closest('.param-matrix__head[data-col]');
        if (head && !head.classList.contains('param-matrix__label')) return head;
      }
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

    var ITEM_SEL = 'a.tile, a.card, a.choice__card, a.area, article.area, article.vcard, article.mach, article.film-rail__i, li.proof__i, li.stats__i, ul.model-strip > li, .faq > details, ul.ticks > li, .grid > figure, .grid > article, .grid > a, .choice > a, .choice > .choice__card, .mach-list > article, .film-rail > article';

    function itemOf(el) {
      if (!el || !el.closest) return null;
      var main = doc.getElementById('main');
      var item = el.closest(ITEM_SEL);
      if (!item || !main || !main.contains(item)) return null;
      if (item.matches && item.matches('[data-st-region]')) return null;
      return item;
    }

    function sectionOf(el) {
      var main = doc.getElementById('main');
      if (!el || !main) return null;
      var n = el.nodeType === 1 ? el : el.parentElement;
      if (!n || !main.contains(n) || n === main) return null;
      while (n.parentElement && n.parentElement !== main) n = n.parentElement;
      return n.parentElement === main ? n : null;
    }

    function unitOf(el) {
      return itemOf(el) || sectionOf(el);
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function labelOf(el) {
      if (!el) return '';
      var h = el.matches && el.matches('.faq > details') ? el.querySelector('summary') : el.querySelector('h1, h2, h3, .model-strip__name');
      var t = (h ? h.textContent : el.textContent) || '';
      t = t.replace(/\s+/g, ' ').trim();
      if (t.length > 72) t = t.slice(0, 72) + '…';
      return t;
    }

    function setSelection(fromEl, force) {
      var item = fromEl ? itemOf(fromEl) : null;
      var section = fromEl ? sectionOf(fromEl) : currentSection;
      if (force === 'section' && section) {
        level = 'section';
        currentSection = section;
        currentItem = null;
        highlight(section);
      } else if (force === 'item' && currentItem) {
        level = 'item';
        highlight(currentItem);
      } else if (item && force !== 'section') {
        level = 'item';
        currentItem = item;
        currentSection = sectionOf(item);
        highlight(item);
      } else if (section) {
        level = 'text';
        currentSection = section;
        currentItem = null;
        highlight(section);
      } else {
        level = 'text';
        currentSection = null;
        currentItem = null;
        highlight(null);
      }
      renderPick();
    }

    function renderPick() {
      var bar = host.querySelector('#stb-pick');
      if (!bar) return;
      if (!currentSection) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      var sName = labelOf(currentSection) || 'This section';
      var html = '<button type="button" data-pick="section"' + (level === 'section' ? ' class="is-on"' : '') + '>Section: ' + esc(sName) + '</button>';
      if (currentItem) {
        var kind = pickKind(currentItem);
        html += '<span class="stb__pick-sep">/</span><button type="button" data-pick="item"' + (level === 'item' ? ' class="is-on"' : '') + '>' + kind + ': ' + esc(labelOf(currentItem) || kind) + '</button>';
      }
      if (level === 'text') html += '<span class="stb__pick-note">Click a card to select just that card. Choose the section name to delete the whole block.</span>';
      else if (level === 'item') html += '<span class="stb__pick-note">Delete removes only this. Up and Down move it.</span>';
      else html += '<span class="stb__pick-note">The whole section is selected.</span>';
      bar.innerHTML = html;
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
      syncImageTools();
    }

    function syncImageTools() {
      var on = !!(image && image.tagName === 'IMG');
      ['img', 'alt', 'noimg', 'resetpos'].forEach(function (act) {
        var b = host.querySelector('[data-act="' + act + '"]');
        if (b) b.disabled = !on;
      });
      ['up', 'down', 'dup', 'del'].forEach(function (act) {
        var b = host.querySelector('[data-act="' + act + '"]');
        if (b) b.disabled = !selected;
      });
    }

    function setNote(el) {
      if (el && el.closest && el.closest('#zapyt')) {
        note.textContent = 'This quote form is shared. A change shows on every page that includes it. Save publishes immediately.';
      } else if (moveMode) {
        note.textContent = 'Move photo is on. Drag a picture inside its frame. Click Move photo again to go back to editing text.';
      } else if (image) {
        note.textContent = 'Photo selected. Click Move photo, then drag it inside the frame. Replace, reset or remove it from Media.';
      } else {
        note.textContent = 'Click text to edit it. Double-click a menu link or a card to open that page. Click a menu category to open its dropdown.';
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

    function openFromAnchor(a) {
      if (!a) return;
      var inNav = a.closest('[data-st-region="header"], [data-st-region="drawer"], [data-st-region="mbar"], [data-st-region="footer"], .mega, .drawer__sub, .nav');
      var tile = a.matches && a.matches('a.tile, a.card, a.mach');
      if (!inNav && !tile) return;
      var pid = pageByUrl(a.getAttribute('href'));
      if (!pid) return;
      if (Date.now() - lastOpen < 700) return;
      lastOpen = Date.now();
      if (pid === id) {
        say('This link is the page you already have open.');
        return;
      }
      if (dirty && !window.confirm('There are unsaved changes. Open the other page without saving?')) return;
      open(pid, host, ctx);
    }

    function onDblClick(e) {
      var t = e.target;
      if (!t || t.nodeType !== 1) t = t && t.parentElement;
      if (!t) return;
      var a = t.closest('a[href]');
      if (!a) return;
      var inNav = a.closest('[data-st-region="header"], [data-st-region="drawer"], [data-st-region="mbar"], [data-st-region="footer"], .mega, .drawer__sub, .nav');
      var tile = a.matches('a.tile, a.card, a.mach');
      if (!inNav && !tile) return;
      e.preventDefault();
      e.stopPropagation();
      openFromAnchor(a);
    }

    function toggleNav(e) {
      var t = e.target;
      if (!t || !t.closest) return false;
      var burger = t.closest('#burger');
      if (burger) {
        e.preventDefault();
        e.stopPropagation();
        var drawer = doc.getElementById('drawer');
        if (!drawer) return true;
        var open = !drawer.classList.contains('is-open');
        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        return true;
      }
      if (t.closest('#drawer-close')) {
        e.preventDefault();
        e.stopPropagation();
        var box = doc.getElementById('drawer');
        if (box) {
          box.classList.remove('is-open');
          box.setAttribute('aria-hidden', 'true');
        }
        return true;
      }
      var drawerBtn = t.closest('.drawer__toggle');
      if (drawerBtn) {
        e.preventDefault();
        e.stopPropagation();
        var panel = doc.getElementById(drawerBtn.getAttribute('aria-controls') || '');
        var on = drawerBtn.getAttribute('aria-expanded') === 'true';
        drawerBtn.setAttribute('aria-expanded', on ? 'false' : 'true');
        if (panel) panel.classList.toggle('is-open', !on);
        return true;
      }
      var megaToggle = t.closest('[data-mega-toggle]');
      if (megaToggle) {
        e.preventDefault();
        e.stopPropagation();
        var flyPanel = doc.getElementById(megaToggle.getAttribute('aria-controls') || '');
        var fly = megaToggle.closest('.mega__fly');
        var flyOn = megaToggle.getAttribute('aria-expanded') === 'true';
        megaToggle.setAttribute('aria-expanded', flyOn ? 'false' : 'true');
        if (flyPanel) flyPanel.classList.toggle('is-open', !flyOn);
        if (fly) fly.classList.toggle('is-open', !flyOn);
        return true;
      }
      var cat = t.closest('.nav__item--has-menu > .nav__link');
      if (cat) {
        var item = cat.parentElement;
        if (item) {
          doc.querySelectorAll('.nav__item.is-open').forEach(function (n) { if (n !== item) n.classList.remove('is-open'); });
          item.classList.add('is-open');
        }
        var href = cat.getAttribute('href') || '';
        if (href === '' || href === '#') {
          e.preventDefault();
          e.stopPropagation();
          return true;
        }
      }
      return false;
    }

    function onClick(e) {
      var t = e.target;
      if (!t || t.nodeType !== 1) t = t && t.parentElement;
      if (!t) return;
      if (skipClick) {
        skipClick = false;
        e.preventDefault();
        e.stopPropagation();
        var imgOnly = t.closest('img');
        if (imgOnly && !skipPhoto(imgOnly)) {
          image = imgOnly;
          syncImageTools();
          setSelection(imgOnly);
          setNote(imgOnly);
        }
        return;
      }
      if (toggleNav(e)) return;
      if (!t.closest('.nav__item--has-menu, .drawer')) {
        doc.querySelectorAll('.nav__item.is-open').forEach(function (n) { n.classList.remove('is-open'); });
        doc.querySelectorAll('.mega__fly.is-open').forEach(function (n) { n.classList.remove('is-open'); });
      }
      if (moveMode) {
        var moving = photoFromEvent(e);
        if (moving && moving.kind === 'img') {
          e.preventDefault();
          image = moving.el;
          syncImageTools();
          setSelection(moving.el);
          setNote(moving.el);
          say('Drag the photo inside its frame. Click Move photo again to edit text.');
          return;
        }
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
        setSelection(control);
        if (span) startEdit(span);
        setNote(control);
        return;
      }
      host.querySelector('#stb-ph-wrap').hidden = true;
      field = null;
      var img = t.closest('img');
      image = img || null;
      syncImageTools();
      setSelection(t);
      pickedEl = t;
      var hostEl = textHost(t);
      if (hostEl && hostEl.matches && hostEl.matches('a.tile, a.card, a.choice__card, a.btn, a.nav__link, a.area')) {
        hostEl = hostEl.querySelector('h3, h2, p');
      }
      if (hostEl && !hostEl.matches('img')) startEdit(hostEl);
      var clickedLink = textLinkFrom(t);
      if (clickedLink) selectInside(clickedLink);
      setNote(t);
    }

    function selectInside(el) {
      try {
        var sel = doc.getSelection();
        var range = doc.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) { /* the click still records pickedEl */ }
    }

    function requireUk() {
      if (mode !== 'en') return true;
      say('Switch to Українська first. English only changes the translation — links, formatting and new blocks are saved into the Ukrainian page.', 'err');
      return false;
    }

    function posOf(el, prop) {
      var s = (el.style && el.style[prop]) || '';
      var m = String(s).match(/([\d.]+)%\s+([\d.]+)%/);
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      return [50, 50];
    }

    function skipPhoto(img) {
      if (!img || !img.closest) return true;
      if (img.closest('.brand, .lang, .mega__ico, .ftr__social, .topbar, svg')) return true;
      var r = img.getBoundingClientRect();
      return r.width < 64 || r.height < 64;
    }

    function photoFromEvent(e) {
      var t = e.target;
      if (!t || !t.closest) return null;
      var direct = t.closest('img');
      if (direct && !skipPhoto(direct)) return { kind: 'img', el: direct };
      if (!moveMode) return null;
      var frame = t.closest('.hero, figure, a.tile, .mach, .vcard, .area, .proof, .about-intro, .stud-stage, .showcase');
      if (!frame) {
        var bg = backgroundHost(t);
        return bg ? { kind: 'bg', el: bg } : null;
      }
      var inner = frame.querySelector('.hero__bg img, .hero__emerge img, .hero__shot img, .hero__poster img, img');
      if (inner && !skipPhoto(inner)) return { kind: 'img', el: inner };
      var hostBg = backgroundHost(frame);
      return hostBg ? { kind: 'bg', el: hostBg } : null;
    }

    function backgroundHost(el) {
      var node = el;
      var view = doc.defaultView;
      if (!view || !node) return null;
      while (node && node !== doc.body) {
        if (node.nodeType === 1) {
          var bg = '';
          try { bg = view.getComputedStyle(node).backgroundImage || ''; } catch (err) { bg = ''; }
          if (bg && bg !== 'none' && /url\(/i.test(bg)) return node;
        }
        node = node.parentElement;
      }
      return null;
    }

    function setMoveMode(on) {
      moveMode = !!on;
      if (doc && doc.documentElement) doc.documentElement.classList.toggle('stb-move', moveMode);
      var b = host.querySelector('#stb-move');
      if (b) {
        b.classList.toggle('is-on', moveMode);
        b.setAttribute('aria-pressed', moveMode ? 'true' : 'false');
      }
      var media = host.querySelector('[data-grp="media"]');
      if (media) media.classList.toggle('is-hot', moveMode);
      var textGrp = host.querySelector('[data-grp="text"]');
      if (textGrp) textGrp.classList.toggle('is-dim', moveMode);
      say(moveMode
        ? 'Move photo is on. Drag a picture inside its frame. The hand cursor shows where it will move. Click Move photo again to edit text.'
        : 'Move photo is off. Click text to edit it.');
    }

    function clampNum(n, a, b) { return Math.max(a, Math.min(b, n)); }

    function readPhoto(el, kind) {
      if (kind !== 'bg' && el.getAttribute) {
        var raw = el.getAttribute('data-st-crop') || '';
        var m = raw.match(/([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
        if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]), z: parseFloat(m[3]) };
      }
      var pos = posOf(el, kind === 'bg' ? 'backgroundPosition' : 'objectPosition');
      return { x: pos[0], y: pos[1], z: 1 };
    }

    function cropSlack(img) {
      if (!img || !img.naturalWidth || !img.naturalHeight) return 0;
      var r = img.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return 0;
      var scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      return Math.max(img.naturalWidth * scale - r.width, img.naturalHeight * scale - r.height);
    }

    function writePhoto(el, kind, x, y, z) {
      x = clampNum(x, 0, 100);
      y = clampNum(y, 0, 100);
      z = clampNum(z || 1, 1, 2.5);
      var value = x.toFixed(1) + '% ' + y.toFixed(1) + '%';
      if (kind === 'bg') {
        el.style.backgroundPosition = value;
        return;
      }
      el.style.setProperty('--st-x', x.toFixed(1) + '%');
      el.style.setProperty('--st-y', y.toFixed(1) + '%');
      el.style.setProperty('--st-z', z.toFixed(3));
      el.style.objectPosition = value;
      el.setAttribute('data-st-crop', x.toFixed(1) + ',' + y.toFixed(1) + ',' + z.toFixed(3));
    }

    function onPointerDown(e) {
      if (!e || e.button !== 0) return;
      var hit = photoFromEvent(e);
      if (!hit) return;
      if (!moveMode && hit.kind !== 'img') return;
      if (!moveMode && e.target && e.target.closest && !e.target.closest('img')) return;
      var crop = readPhoto(hit.el, hit.kind);
      drag = { kind: hit.kind, el: hit.el, x: e.clientX, y: e.clientY, ox: crop.x, oy: crop.y, oz: crop.z, moved: false };
      var direct = e.target && e.target.closest && e.target.closest('img');
      if (moveMode || (direct && hit.kind === 'img')) {
        e.preventDefault();
        try { hit.el.setPointerCapture(e.pointerId); } catch (err) { /* the picture can sit under the text */ }
      }
    }

    function onPointerMove(e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        beforeChange();
        clearEdit();
        drag.el.classList.add('stb-dragging');
        if (drag.kind === 'img' && drag.oz < 1.05 && cropSlack(drag.el) < 12) drag.oz = 1.2;
        try { drag.el.setPointerCapture(e.pointerId); } catch (err2) { /* keep listening on the document */ }
      }
      e.preventDefault();
      var rect = drag.el.getBoundingClientRect();
      var nx = clampNum(drag.ox - dx / Math.max(rect.width, 1) * 100, 0, 100);
      var ny = clampNum(drag.oy - dy / Math.max(rect.height, 1) * 100, 0, 100);
      writePhoto(drag.el, drag.kind, nx, ny, drag.oz);
    }

    function onPointerUp(e) {
      if (!drag) return;
      var el = drag.el;
      var moved = drag.moved;
      el.classList.remove('stb-dragging');
      drag = null;
      if (!moved) {
        if (el.tagName === 'IMG') {
          var now = Date.now();
          var link = el.closest('a[href]');
          if (photoTap && photoTap.el === el && now - photoTap.t < 500) {
            photoTap = null;
            if (link) openFromAnchor(link);
          } else {
            photoTap = { el: el, t: now };
          }
          image = el;
          syncImageTools();
          setSelection(el);
          setNote(el);
        }
        return;
      }
      skipClick = true;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (el.tagName === 'IMG') image = el;
      syncImageTools();
      setSelection(el);
      markDirty(whereOf(el));
      setNote(el);
      say('Photo position updated. Save to publish it.');
    }

    function resetPhoto() {
      var el = image;
      if (!el) { say('Click a photo first, or turn on Move photo and click the picture.', 'err'); return; }
      beforeChange();
      el.style.objectPosition = '';
      el.style.removeProperty('--st-x');
      el.style.removeProperty('--st-y');
      el.style.removeProperty('--st-z');
      if (el.hasAttribute('data-st-crop')) el.removeAttribute('data-st-crop');
      if (!el.getAttribute('style')) el.removeAttribute('style');
      markDirty(whereOf(el));
      say('Photo position reset. Save to publish it.');
    }

    function textNodes(root) {
      var bag = [];
      if (!root || !doc) return bag;
      var tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          var p = node.parentElement;
          if (!p || p.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !String(node.nodeValue).trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n;
      while ((n = tw.nextNode())) bag.push(n);
      return bag;
    }

    function copyUkFrom(source, copy) {
      var src = textNodes(source);
      var dst = textNodes(copy);
      var i;
      for (i = 0; i < dst.length && i < src.length; i++) {
        var uk = src[i].stbUk != null ? src[i].stbUk : src[i].nodeValue;
        dst[i].stbUk = uk;
        dst[i].nodeValue = uk;
        var parent = dst[i].parentElement;
        if (parent && parent.childNodes.length === 1) parent.stbUkLeaf = uk;
      }
    }

    function writeUk(el, value) {
      el.textContent = value;
      if (el.firstChild && el.firstChild.nodeType === 3) {
        el.firstChild.stbUk = value;
        el.stbUkLeaf = value;
      }
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
      var node = level === 'item' ? currentItem : (level === 'section' ? currentSection : selected);
      if (!node) { say('Click the block you want to move.', 'err'); return; }
      if (node.matches && node.matches('ul.model-strip > li')) {
        moveVariant(node, dir);
        return;
      }
      var sib = dir < 0 ? node.previousElementSibling : node.nextElementSibling;
      while (sib && sib.matches && sib.matches('script, style')) sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
      if (!sib) return;
      beforeChange();
      if (dir < 0) sib.before(node); else sib.after(node);
      if (node.matches && node.matches('a.tile') && node.parentElement) reflowTiles(node.parentElement);
      if (node.matches && node.matches('article.mach') && node.parentElement) renumberMach(node.parentElement);
      markDirty(whereOf(node));
      setSelection(node);
    }

    function duplicate() {
      if (!requireUk()) return;
      var node = level === 'item' ? currentItem : selected;
      if (!node || !node.parentElement) { say('Click the block you want to copy.', 'err'); return; }
      if (node.id === 'zapyt' || node.querySelector('#zapyt')) {
        say('A page can have only one quote form.', 'err');
        return;
      }
      if (node.matches && node.matches('a.tile') && childPage(node.getAttribute('href'))) {
        say('This card opens its own page. Use Add machine type so the new card gets its own page.', 'err');
        return;
      }
      beforeChange();
      var copy = node.cloneNode(true);
      if (copy.id) copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
      copy.classList.remove('stb-on');
      node.after(copy);
      stampTree(copy);
      if (copy.matches && copy.matches('a.tile') && copy.parentElement) reflowTiles(copy.parentElement);
      if (copy.matches && copy.matches('article.mach') && copy.parentElement) renumberMach(copy.parentElement);
      setSelection(copy);
      markDirty(whereOf(copy));
    }

    function removeUnit() {
      if (level === 'item' && currentItem) {
        if (currentItem.matches('ul.model-strip > li')) { deleteVariant(currentItem); return; }
        confirmRemoveItem(currentItem);
        return;
      }
      if (level !== 'section' || !currentSection) {
        say('Click a card to delete only that card. To delete a whole section, click its name in the bar above, then Delete.', 'err');
        return;
      }
      var form = currentSection.id === 'zapyt' || (currentSection.querySelector && currentSection.querySelector('#zapyt') && currentSection.querySelector('#zapyt').parentElement === currentSection);
      var name = labelOf(currentSection) || 'this section';
      var msg = form
        ? 'Remove the quote form from this page only? Other pages keep it.'
        : 'Delete the whole section “' + name + '”? Everything inside it goes. The rest of the page stays.';
      if (!window.confirm(msg)) return;
      beforeChange();
      var where = whereOf(currentSection);
      currentSection.remove();
      currentSection = null;
      currentItem = null;
      level = 'text';
      selected = null;
      renderPick();
      markDirty(where);
      say('Section removed. Save to publish.');
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
      setSelection(sec, 'section');
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
      if (!requireUk()) return;
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

    function applySize(size) {
      if (!requireUk()) return;
      if (!doc || !size) return;
      if (!/^(?:inherit|[\d.]+(?:px|rem|em|%))$/.test(size)) return;
      beforeChange();
      var hostEl = doc.querySelector('[contenteditable="true"]') || selected;
      var sel = doc.getSelection();
      if (!hostEl && (!sel || sel.isCollapsed)) { say('Click the text first.', 'err'); return; }
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        if (size === 'inherit') hostEl.style.fontSize = '';
        else hostEl.style.fontSize = size;
        markDirty(whereOf(hostEl));
        return;
      }
      doc.execCommand('styleWithCSS', false, true);
      var range = sel.getRangeAt(0);
      var span = doc.createElement('span');
      if (size !== 'inherit') span.style.fontSize = size;
      try { range.surroundContents(span); }
      catch (err) {
        if (hostEl) hostEl.style.fontSize = size === 'inherit' ? '' : size;
      }
      markDirty(whereOf(hostEl || span));
    }

    function fmt(cmd) {
      if (!requireUk()) return;
      if (!doc) return;
      beforeChange();
      doc.execCommand('styleWithCSS', false, true);
      var ok = doc.execCommand(cmd, false, null);
      if (!ok) say('Select the text you want to format.', 'err');
      else markDirty(whereOf(doc.getSelection() && doc.getSelection().anchorNode && doc.getSelection().anchorNode.parentElement));
    }

    function paint(color) {
      if (!requireUk()) return;
      if (!doc) return;
      beforeChange();
      doc.execCommand('styleWithCSS', false, true);
      doc.execCommand('foreColor', false, color);
      markDirty('page');
    }

    function structuralLink(a) {
      if (!a || !a.matches) return false;
      if (a.matches('a.tile, a.card, a.choice__card, a.btn, a.nav__link, a.drawer__link, a.brand, a.skip, a.arrow-link, a.cta__phone, a.area')) return true;
      if (a.closest('.nav, .mega, .drawer, .ftr, .mbar, .crumbs, .hdr, .topbar')) return true;
      return false;
    }

    function textLinkFrom(node) {
      var el = node && node.nodeType === 1 ? node : (node && node.parentElement);
      var a = el && el.closest ? el.closest('a[href]') : null;
      if (!a || structuralLink(a)) return null;
      if (a.closest('[data-st-region="header"], [data-st-region="drawer"], [data-st-region="footer"], [data-st-region="mbar"]')) return null;
      return a;
    }

    function savedRange() {
      var sel = doc.getSelection();
      if (!sel || !sel.rangeCount) return null;
      try { return sel.getRangeAt(0).cloneRange(); } catch (err) { return null; }
    }

    function normalizeHref(v) {
      v = String(v || '').trim();
      if (!v) return '';
      if (/^(mailto:|tel:|#)/i.test(v)) return v;
      if (/^https?:\/\//i.test(v)) return v;
      if (/^[^\s@\/]+@[^\s@\/]+\.[a-z]{2,}$/i.test(v)) return 'mailto:' + v;
      if (/^\+?[\d\s().-]{7,}$/.test(v)) return 'tel:' + v.replace(/[^\d+]/g, '');
      if (/^(www\.)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) return 'https://' + v;
      var path = '';
      if (v.charAt(0) === '/') path = v;
      else if (/^[a-z0-9][a-z0-9\-./]*\/?$/i.test(v)) path = '/' + v.replace(/^\/+/, '');
      else return '';
      return slashInternal(path);
    }

    function slashInternal(v) {
      var hash = '';
      var query = '';
      var path = v;
      var hi = path.indexOf('#');
      if (hi >= 0) { hash = path.slice(hi); path = path.slice(0, hi); }
      var qi = path.indexOf('?');
      if (qi >= 0) { query = path.slice(qi); path = path.slice(0, qi); }
      if (!/^\/[^\s]*\.[a-z0-9]{1,8}$/i.test(path) && path.length > 1 && path.charAt(path.length - 1) !== '/') path += '/';
      return path + query + hash;
    }

    function styleLink(a, url, blank) {
      a.setAttribute('href', url);
      a.classList.add('st-link');
      a.setAttribute('data-st-link', '');
      ['color', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', '-webkit-text-fill-color'].forEach(function (prop) {
        a.style.removeProperty(prop);
      });
      if (!String(a.getAttribute('style') || '').trim()) a.removeAttribute('style');
      var external = /^https?:/i.test(url);
      var openBlank = blank == null ? external : !!blank;
      if (openBlank) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      } else {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    }

    function unwrapLink(a) {
      var parent = a.parentNode;
      if (!parent) return;
      while (a.firstChild) parent.insertBefore(a.firstChild, a);
      parent.removeChild(a);
    }

    function wrapRange(range, a) {
      try {
        range.surroundContents(a);
        return true;
      } catch (err) {
        try {
          var frag = range.extractContents();
          if (!frag || !String(frag.textContent || '').trim()) return false;
          a.appendChild(frag);
          range.insertNode(a);
          return true;
        } catch (err2) { return false; }
      }
    }

    function makeLink() {
      if (!requireUk()) return;
      if (!doc) return;
      var clickLink = textLinkFrom(pickedEl);
      if (clickLink && !clickLink.isConnected) clickLink = null;
      var sel = doc.getSelection();
      var selLink = null;
      if (sel && sel.rangeCount) selLink = textLinkFrom(sel.anchorNode) || textLinkFrom(sel.focusNode);
      if (selLink && !selLink.isConnected) selLink = null;
      var existing = selLink;
      if (clickLink && clickLink !== selLink) existing = clickLink;
      var hostEl = doc.querySelector('[contenteditable="true"]');
      if (hostEl && structuralLink(hostEl) && !existing) {
        say('That card is already a link. Select ordinary text to add a link inside a paragraph.', 'err');
        return;
      }
      linkRange = savedRange();
      if (existing) {
        try {
          linkRange = doc.createRange();
          linkRange.selectNodeContents(existing);
        } catch (err) { linkRange = savedRange(); }
      } else if (linkRange && hostEl && !hostEl.contains(linkRange.commonAncestorContainer)) linkRange = null;
      var chosen = linkRange && !linkRange.collapsed && String(linkRange.toString() || '').trim();
      if (!existing && !chosen) { say('Select the words you want to link.', 'err'); return; }
      openLinkDialog(existing, chosen);
    }

    function openLinkDialog(existing, chosen) {
      var old = document.getElementById('stb-link-dlg');
      if (old) old.remove();
      var external = existing && /^https?:/i.test(existing.getAttribute('href') || '');
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-link-dlg';
      var pages = (page && page.pages) || [];
      var opts = '<option value="">Type an address, or pick a page</option>' + pages.filter(function (p) {
        return p.url && p.id !== '90-404';
      }).map(function (p) {
        return '<option value="' + esc(p.url) + '">' + esc(p.name || p.url) + '</option>';
      }).join('');
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-link-title">' +
        '<h2 id="stb-link-title">' + (existing ? 'Edit link' : 'Add a link') + '</h2>' +
        '<p class="lead">The linked words are shown bold, red and underlined. An external address opens in a new tab unless you untick the box. A page on this site stays in the same tab.</p>' +
        '<div class="stb-form">' +
          '<label class="wide">Address<input type="text" id="stb-link-url" placeholder="https://…, /kontakty/ or email" autocomplete="off"></label>' +
          '<label class="wide">Page on this site<select id="stb-link-page">' + opts + '</select></label>' +
          '<label class="wide stb-check"><input type="checkbox" id="stb-link-blank"> Open in a new tab</label>' +
          '<p class="wide" id="stb-link-status"></p>' +
        '</div>' +
        '<div class="stb-actions"><button type="button" class="btn" id="stb-link-ok">Apply</button>' +
          '<button type="button" class="btn btn-ghost" id="stb-link-rm"' + (existing ? '' : ' hidden') + '>Remove link</button>' +
          '<button type="button" class="btn btn-ghost" id="stb-link-x">Cancel</button></div></div>';
      document.body.appendChild(modal);
      var urlInput = modal.querySelector('#stb-link-url');
      var pageSel = modal.querySelector('#stb-link-page');
      var blank = modal.querySelector('#stb-link-blank');
      urlInput.value = existing ? (existing.getAttribute('href') || '') : '';
      var blankTouched = false;
      function syncBlank() {
        if (blankTouched) return;
        blank.checked = /^https?:/i.test(normalizeHref(urlInput.value));
      }
      syncBlank();
      urlInput.addEventListener('input', syncBlank);
      blank.addEventListener('change', function () { blankTouched = true; });
      pageSel.addEventListener('change', function () {
        if (!pageSel.value) return;
        urlInput.value = pageSel.value;
        blankTouched = false;
        syncBlank();
      });
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      modal.querySelector('#stb-link-x').addEventListener('click', close);
      modal.querySelector('#stb-link-rm').addEventListener('click', function () {
        if (!existing || !existing.isConnected) { close(); return; }
        beforeChange();
        var parent = existing.parentNode;
        unwrapLink(existing);
        markDirty(whereOf(parent));
        close();
        say('Link removed. Save to publish.');
      });
      modal.querySelector('#stb-link-ok').addEventListener('click', function () {
        var href = normalizeHref(urlInput.value);
        if (!href) {
          modal.querySelector('#stb-link-status').textContent = 'Use https://, a path that starts with /, mailto: or tel:.';
          return;
        }
        beforeChange();
        var made = null;
        if (existing && existing.isConnected) {
          styleLink(existing, href, blank.checked);
          made = existing;
        } else if (linkRange) {
          var a = doc.createElement('a');
          styleLink(a, href, blank.checked);
          if (wrapRange(linkRange, a)) made = a;
        }
        if (!made) { say('Select the words you want to link.', 'err'); close(); return; }
        markDirty(whereOf(made));
        close();
        say('Link updated. It stays bold, red and underlined after you save.');
      });
      urlInput.focus();
      if (!existing && chosen) urlInput.select && urlInput.focus();
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
      var tag = String(li.getAttribute('data-stb-back-tag') || 'p').toLowerCase();
      if (!/^(p|h2|h3|h4|div)$/.test(tag)) tag = 'p';
      var p = doc.createElement(tag);
      var back = li.getAttribute('data-stb-back-class') || '';
      if (back) p.setAttribute('class', back);
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
      if (!requireUk()) return;
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
      var p = null;
      if (el && el.closest) {
        if (el.matches && el.matches('p, h2, h3')) p = el;
        else p = el.closest('p, h2, h3');
        if (!p) {
          var box = el.matches && el.matches('div') ? el : el.closest('div');
          if (box && !box.querySelector('p, h2, h3, ul, ol, section, figure')) p = box;
        }
      }
      if (!p || (p.closest && p.closest('ul, ol'))) {
        say('Click a paragraph, then + Bullet.', 'err');
        return;
      }
      beforeChange();
      var made = doc.createElement('ul');
      made.className = 'ticks';
      var item = doc.createElement('li');
      var backClass = (p.getAttribute('class') || '').replace(/\bstb-[\w-]+\b/g, '').replace(/\s+/g, ' ').trim();
      var backTag = p.tagName.toLowerCase();
      if (backClass) item.setAttribute('data-stb-back-class', backClass);
      if (backTag && backTag !== 'p') item.setAttribute('data-stb-back-tag', backTag);
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
      if (doc.documentElement) doc.documentElement.classList.remove('stb-move');
      doc.querySelectorAll('[draggable]').forEach(function (el) { el.removeAttribute('draggable'); });
      doc.querySelectorAll('a[title]').forEach(function (a) {
        if (a.getAttribute('title') === 'Double-click to open this page. Click once to edit the words.') a.removeAttribute('title');
      });
      var ui = doc.getElementById('stb-ui');
      if (ui) ui.remove();
    }

    function save(after) {
      if (!doc) return;
      var done = typeof after === 'function' ? after : null;
      var btn = host.querySelector('#stb-save');
      btn.disabled = true;
      say('Saving to the site…');
      try {
        saveBody(btn, done);
      } catch (err) {
        btn.disabled = false;
        say('Not saved: ' + (err && err.message ? err.message : err), 'err');
      }
    }

    function saveBody(btn, after) {
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
        formDirty = false;
        chromeDirty = false;
        metaDirty = false;
        if (after) { after(res); return; }
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
        '<p class="lead">Set the title, the address, and where the link appears. Choose a template to start from a copy of a page that is already on the site, or leave it blank. After you create it, this editor opens that page.</p>' +
        '<div class="stb-form">' +
          '<label>Page title<input type="text" id="stb-np-title" placeholder="For example: Service"></label>' +
          '<label>URL slug<input type="text" id="stb-np-slug" placeholder="service"></label>' +
          '<label class="wide">Template<input type="search" id="stb-np-find" placeholder="Search by name, category or address" autocomplete="off"></label>' +
          '<div class="wide stb-tpl" id="stb-np-tpl" role="listbox" aria-label="Template"></div>' +
          '<div class="wide stb-tpl-preview" id="stb-np-preview" hidden></div>' +
          '<input type="hidden" id="stb-np-template" value="">' +
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
      modal.querySelector('#stb-np-find').addEventListener('input', renderTemplates);
      function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }
      var templatePages = [];
      function templateRows() {
        var rows = [{
          id: '',
          name: 'Blank',
          path: 'A short page with a heading, one text section and the quote form.',
          url: '',
          thumb: ''
        }];
        templatePages.forEach(function (p) {
          var path = p.parentName
            ? (p.parentName + ' → ' + (p.name || p.id))
            : ((p.kindLabel ? p.kindLabel + ' · ' : '') + (p.name || p.id));
          rows.push({ id: p.id, name: p.name || p.id, path: path, url: p.url || '', thumb: p.thumb || '' });
        });
        return rows;
      }
      function selectedTemplate() {
        var id = modal.querySelector('#stb-np-template').value;
        var rows = templateRows();
        for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
        return rows[0];
      }
      function showPreview() {
        var row = selectedTemplate();
        var box = modal.querySelector('#stb-np-preview');
        box.hidden = false;
        var img = row.thumb ? '<img src="' + esc(row.thumb) + '" alt="">' : '<span class="stb-tpl-ph" aria-hidden="true"></span>';
        box.innerHTML = img + '<div><strong>' + esc(row.name) + '</strong><p>' + esc(row.path) + '</p>' + (row.url ? '<code>' + esc(row.url) + '</code>' : '') + '</div>';
      }
      function renderTemplates() {
        var q = modal.querySelector('#stb-np-find').value.trim().toLowerCase();
        var current = modal.querySelector('#stb-np-template').value;
        var box = modal.querySelector('#stb-np-tpl');
        var rows = templateRows().filter(function (row) {
          if (!q || row.id === '') return true;
          return (row.name + ' ' + row.path + ' ' + row.url).toLowerCase().indexOf(q) !== -1;
        });
        if (!rows.length) {
          box.innerHTML = '<p class="stb-tpl-empty">No pages match that search.</p>';
          return;
        }
        box.innerHTML = rows.map(function (row) {
          return '<button type="button" role="option" data-id="' + esc(row.id) + '"' + (row.id === current ? ' class="is-on" aria-selected="true"' : ' aria-selected="false"') + '><b>' + esc(row.name) + '</b><small>' + esc(row.path) + (row.url ? ' · ' + esc(row.url) : '') + '</small></button>';
        }).join('');
        box.querySelectorAll('button').forEach(function (btn) {
          btn.addEventListener('click', function () {
            modal.querySelector('#stb-np-template').value = btn.getAttribute('data-id') || '';
            renderTemplates();
            showPreview();
          });
        });
      }
      function fill(cat) {
        templatePages = (cat.pages || []).slice().sort(function (a, b) {
          var ap = (a.parentName || '') + ' ' + (a.name || '');
          var bp = (b.parentName || '') + ' ' + (b.name || '');
          return ap.localeCompare(bp);
        });
        renderTemplates();
        showPreview();
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
          position: parseInt(modal.querySelector('#stb-np-pos').value, 10) || 1,
          template: modal.querySelector('#stb-np-template').value
        }).then(function (res) {
          if (!res || !res.ok) { status.textContent = (res && res.error) || 'The page was not created.'; return; }
          ctx.hello = res.where || 'The new page is open.';
          close();
          open(res.id, host, ctx);
        }).catch(function () { status.textContent = 'Connection error.'; });
      });
    }

    function syncPageTools() {
      var addType = host.querySelector('#stb-add-type');
      var addMach = host.querySelector('#stb-add-mach');
      var addVar = host.querySelector('#stb-add-var');
      var main = doc && doc.getElementById('main');
      if (addType) addType.hidden = !(page && page.role === 'group' && main && main.querySelector('a.tile'));
      if (addMach) addMach.hidden = !(main && main.querySelector('.mach-list > article.mach'));
      if (addVar) addVar.hidden = !(main && main.querySelector('ul.model-strip > li'));
    }

    function plainLabel(s) {
      return String(s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function absorbVariantText(name) {
      var btn = name && name.closest && name.closest('button.model-strip__btn');
      if (!btn) return;
      var extra = '';
      Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
        if (n === name || n.nodeType !== 3) return;
        extra += n.nodeValue || '';
        n.remove();
      });
      if (!plainLabel(extra)) return;
      name.textContent = plainLabel(name.textContent + ' ' + extra);
    }

    function syncVariantName(el) {
      if (!el || !el.closest) return;
      var root = el.closest('[data-param-matrix]') || el.closest('section') || doc;
      var name = el.matches && el.matches('.model-strip__name') ? el : el.closest('.model-strip__name');
      if (!name && el.matches && el.matches('button.model-strip__btn')) name = el.querySelector('.model-strip__name');
      if (name) absorbVariantText(name);
      var headEl = el.matches && el.matches('.param-matrix__head[data-col]') ? el : el.closest('.param-matrix__head[data-col]');
      var src = name && (el === name || (name.contains && name.contains(el)) || (el.closest && el.closest('button.model-strip__btn'))) ? name : headEl;
      if (!src) return;
      var label = plainLabel(src.textContent);
      if (!label) return;
      if (src === name) {
        var btn = name.closest('[data-model]');
        var mid = btn && btn.getAttribute('data-model');
        if (!mid) return;
        var head = root.querySelector('.param-matrix__head[data-col="' + mid + '"]');
        if (head && plainLabel(head.textContent) !== label) head.textContent = label;
        return;
      }
      var col = headEl.getAttribute('data-col');
      var stripName = root.querySelector('.model-strip [data-model="' + col + '"] .model-strip__name');
      if (stripName && plainLabel(stripName.textContent) !== label) stripName.textContent = label;
    }

    function reflowTiles(grid) {
      if (!grid || !grid.children) return;
      var tiles = Array.prototype.filter.call(grid.children, function (el) {
        return el.matches && el.matches('a.tile');
      });
      tiles.forEach(function (t, i) {
        var no = t.querySelector('.tile__no');
        if (!no) return;
        var num = String(i + 1);
        if (num.length < 2) num = '0' + num;
        no.textContent = num;
      });
      var n = tiles.length;
      var g = n <= 1 ? 'g-1' : (n === 2 ? 'g-2' : (n === 4 ? 'g-4' : 'g-3'));
      var cls = grid.getAttribute('class') || '';
      if (/\bg-\d+\b/.test(cls)) cls = cls.replace(/\bg-\d+\b/, g);
      else cls = (cls + ' ' + g).trim();
      grid.setAttribute('class', cls.replace(/\s+/g, ' ').trim());
    }

    function renumberMach(list) {
      if (!list || !list.children) return;
      var items = Array.prototype.filter.call(list.children, function (el) {
        return el.matches && el.matches('article.mach');
      });
      items.forEach(function (a, i) {
        var idx = a.querySelector('.mach__idx');
        if (!idx) return;
        var num = String(i + 1);
        if (num.length < 2) num = '0' + num;
        idx.textContent = num;
      });
    }

    function childPage(href) {
      var n = normUrl(href);
      if (!n || !page || !page.pages) return null;
      var parent = normUrl(page.url || '');
      if (!parent) return null;
      for (var i = 0; i < page.pages.length; i++) {
        var row = page.pages[i];
        if (!row || row.id === id) continue;
        if (normUrl(row.url) === n && normUrl(row.parentUrl) === parent) return row;
      }
      return null;
    }

    function matrixRoot(el) {
      if (!el || !el.closest) return null;
      return el.closest('[data-param-matrix]');
    }

    function applyMatrixCount(root, n) {
      if (!root) return;
      n = Math.max(1, n | 0);
      var pm = root.querySelector('.param-matrix');
      if (pm) {
        pm.style.setProperty('--pm-cols', String(n));
        Array.prototype.slice.call(pm.classList).forEach(function (c) {
          if (/^param-matrix--\d+$/.test(c)) pm.classList.remove(c);
        });
        pm.classList.add('param-matrix--' + n);
        pm.className = pm.className.replace(/\bis-hl-\d+\b/g, '').replace(/\s+/g, ' ').trim();
        pm.classList.add('is-hl-1');
      }
      var strip = root.querySelector('.model-strip');
      if (strip && strip.classList.contains('model-strip--shots')) {
        strip.style.setProperty('--ms-cols', String(n));
        Array.prototype.slice.call(strip.classList).forEach(function (c) {
          if (/^model-strip--\d+$/.test(c)) strip.classList.remove(c);
        });
        strip.classList.add('model-strip--' + n);
      }
    }

    function reorderMatrix(root) {
      if (!root) return;
      var strip = root.querySelector('ul.model-strip');
      var table = root.querySelector('.param-matrix__table');
      if (!strip || !table) return;
      var buttons = Array.prototype.slice.call(strip.querySelectorAll(':scope > li [data-model]'));
      var order = buttons.map(function (b) { return b.getAttribute('data-model'); }).filter(Boolean);
      var cells = Array.prototype.slice.call(table.children);
      var rows = [];
      var row = null;
      cells.forEach(function (cell) {
        if (cell.classList && cell.classList.contains('param-matrix__label')) {
          row = { label: cell, cols: {} };
          rows.push(row);
          return;
        }
        if (!row) return;
        var col = cell.getAttribute('data-col');
        if (col) row.cols[col] = cell;
      });
      while (table.firstChild) table.removeChild(table.firstChild);
      rows.forEach(function (r) {
        table.appendChild(r.label);
        order.forEach(function (cid, i) {
          var cell = r.cols[cid];
          if (!cell) return;
          cell.setAttribute('data-col', String(i + 1));
          table.appendChild(cell);
        });
      });
      buttons.forEach(function (b, i) {
        b.setAttribute('data-model', String(i + 1));
        var on = i === 0;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyMatrixCount(root, order.length);
    }

    function moveVariant(li, dir) {
      var sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib) return;
      beforeChange();
      if (dir < 0) sib.before(li); else sib.after(li);
      reorderMatrix(matrixRoot(li));
      markDirty(whereOf(li));
      setSelection(li);
    }

    function deleteVariant(li) {
      var strip = li.parentElement;
      var items = strip ? strip.querySelectorAll(':scope > li') : [];
      if (!items || items.length <= 1) { say('Keep at least one variant.', 'err'); return; }
      var name = labelOf(li) || 'this variant';
      if (!window.confirm('Delete the variant “' + name + '”? Its column is removed. The other variants stay.')) return;
      beforeChange();
      var root = matrixRoot(li);
      var where = whereOf(li);
      li.remove();
      reorderMatrix(root);
      currentItem = null;
      level = 'text';
      selected = null;
      if (root) setSelection(root);
      else renderPick();
      markDirty(where);
      say('Variant removed. Save to publish.');
    }

    function addVariant() {
      if (!requireUk()) return;
      var root = (currentItem && matrixRoot(currentItem))
        || (currentSection && currentSection.querySelector && currentSection.querySelector('[data-param-matrix]'))
        || (doc && doc.querySelector('#main [data-param-matrix]'));
      if (!root) { say('This page has no specification table.', 'err'); return; }
      var strip = root.querySelector('ul.model-strip');
      var table = root.querySelector('.param-matrix__table');
      if (!strip || !table) { say('This specification has no variant list to extend.', 'err'); return; }
      var lastLi = strip.querySelector(':scope > li:last-child');
      if (!lastLi) return;
      var btn0 = lastLi.querySelector('[data-model]');
      var oldId = btn0 ? btn0.getAttribute('data-model') : '';
      if (!oldId) { say('This specification has no variant list to extend.', 'err'); return; }
      beforeChange();
      var copy = lastLi.cloneNode(true);
      copy.classList.remove('stb-on');
      var btn = copy.querySelector('[data-model]');
      if (btn) {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('data-model', 'new');
      }
      var nameEl = copy.querySelector('.model-strip__name');
      if (nameEl) nameEl.textContent = 'Нова модель';
      lastLi.after(copy);
      Array.prototype.slice.call(table.querySelectorAll('[data-col="' + oldId + '"]')).forEach(function (cell) {
        var c = cell.cloneNode(true);
        c.setAttribute('data-col', 'new');
        if (c.classList.contains('param-matrix__head')) c.textContent = 'Нова модель';
        else c.innerHTML = '—';
        cell.after(c);
      });
      reorderMatrix(root);
      stampTree(copy);
      setSelection(copy);
      if (nameEl && nameEl.isConnected) startEdit(nameEl);
      markDirty('page');
      say('Variant added. Edit its name and values, then Save.');
    }

    function dropItem(el) {
      var grid = el.parentElement;
      var tile = el.matches && el.matches('a.tile');
      var mach = el.matches && el.matches('article.mach');
      var where = whereOf(el);
      beforeChange();
      el.remove();
      if (tile && grid && grid.isConnected) reflowTiles(grid);
      if (mach && grid && grid.isConnected) renumberMach(grid);
      currentItem = null;
      level = 'text';
      selected = null;
      image = null;
      if (currentSection && !currentSection.isConnected) currentSection = null;
      highlight(currentSection);
      renderPick();
      syncImageTools();
      markDirty(where);
    }

    function itemKind(el) {
      if (!el || !el.matches) return 'item';
      if (el.matches('a.tile, a.card, a.choice__card, a.area, article.area')) return 'card';
      if (el.matches('article.mach')) return 'product';
      if (el.matches('article.vcard, article.film-rail__i')) return 'video';
      if (el.matches('.faq > details')) return 'question';
      if (el.matches('ul.ticks > li, ol.ticks > li')) return 'bullet';
      if (el.matches('figure')) return 'photo';
      if (el.matches('ul.model-strip > li')) return 'variant';
      return 'item';
    }

    function pickKind(el) {
      var noun = itemKind(el);
      if (noun === 'variant') return 'Variant';
      if (noun === 'question') return 'Question';
      if (noun === 'bullet') return 'Bullet';
      if (noun === 'product') return 'Product';
      if (noun === 'photo') return 'Photo';
      if (noun === 'video') return 'Video';
      if (noun === 'item') return 'Item';
      return 'Card';
    }

    function confirmRemoveItem(el) {
      var name = labelOf(el) || '';
      var kind = itemKind(el);
      var child = el.matches && el.matches('a[href]') ? childPage(el.getAttribute('href')) : null;
      var offerPage = !!(child && child.canDelete && child.id);
      var old = document.getElementById('stb-del-dlg');
      if (old) old.remove();
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-del-dlg';
      var short = name;
      if (short.length > 42) short = short.slice(0, 42) + '…';
      var title = short ? ('Delete this ' + kind + ' “' + short + '”?') : ('Delete this ' + kind + '?');
      if (title.length > 90) title = 'Delete this ' + kind + '?';
      var lead = 'Only this ' + kind + ' is removed. The rest of the section stays.';
      if (kind === 'card') lead = 'Only this card is removed. The other cards stay, and the grid closes up.';
      var pageBox = '';
      if (offerPage) {
        pageBox = '<label class="wide stb-check"><input type="checkbox" id="stb-del-page"> Also delete its page' +
          (child.url ? ' (' + esc(child.url) + ')' : '') +
          '. A backup is kept, and the page leaves the menu and the sitemap.</label>';
      } else if (child) {
        pageBox = '<p class="wide">Its page stays on the site. This only removes the card.</p>';
      }
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-del-title">' +
        '<h2 id="stb-del-title">' + esc(title) + '</h2>' +
        '<p class="lead">' + esc(lead) + '</p>' +
        '<div class="stb-form">' + pageBox + '</div>' +
        '<div class="stb-actions"><button type="button" class="btn" id="stb-del-ok">Delete</button>' +
        '<button type="button" class="btn btn-ghost" id="stb-del-x">Cancel</button></div></div>';
      document.body.appendChild(modal);
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      modal.querySelector('#stb-del-x').addEventListener('click', close);
      modal.querySelector('#stb-del-ok').addEventListener('click', function () {
        var also = offerPage && modal.querySelector('#stb-del-page') && modal.querySelector('#stb-del-page').checked;
        var childId = child && child.id;
        close();
        if (!also) {
          dropItem(el);
          say('Deleted “' + (name || kind) + '”. The rest of the section stays. Save to publish.');
          return;
        }
        dropItem(el);
        say('Removing “' + (name || kind) + '” and its page…');
        save(function () {
          api({ action: 'cms.page.delete', id: childId }).then(function (res) {
            if (!res || !res.ok) {
              say('The card was removed, but the page stayed: ' + ((res && res.error) || 'Could not delete the page.'), 'err');
              ctx.hello = 'The card was removed from this page. The subpage is still on the site.';
              load();
              return;
            }
            ctx.hello = 'Deleted “' + (name || kind) + '” and its page. A backup was kept, and the menu and sitemap were updated.';
            flash(ctx.hello);
            load();
          }).catch(function () {
            say('The card was removed, but the page could not be deleted (connection error).', 'err');
            load();
          });
        });
      });
    }

    function openAddType() {
      if (!doc) return;
      if (dirty || formDirty || chromeDirty || metaDirty) {
        say('Save this page first, then add a machine type.', 'err');
        return;
      }
      var old = document.getElementById('stb-type-dlg');
      if (old) old.remove();
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-type-dlg';
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-type-title">' +
        '<h2 id="stb-type-title">Add a machine type</h2>' +
        '<p class="lead">A new card is added to this category, and a subpage starts from a blank specification (one empty variant, no text copied from a sibling). English fields are optional: leave one empty and the English site keeps the Ukrainian wording. An empty description stays hidden on the live page.</p>' +
        '<div class="stb-form">' +
          '<label class="wide">Name (Ukrainian)<input type="text" id="stb-type-name" placeholder="Наприклад: Машини 40 кВА"></label>' +
          '<label class="wide">English name (optional)<input type="text" id="stb-type-name-en" placeholder="Mesh line LS-3000"></label>' +
          '<label>Address slug<input type="text" id="stb-type-slug" placeholder="mashyny-40-kva"></label>' +
          '<label>Short tag<input type="text" id="stb-type-tag" maxlength="60" placeholder="TECNA"></label>' +
          '<label class="wide">Menu subtitle (Ukrainian, optional)<input type="text" id="stb-type-sub" maxlength="80" placeholder="Короткий рядок у меню"></label>' +
          '<label class="wide">English menu subtitle (optional)<input type="text" id="stb-type-sub-en" maxlength="80" placeholder="Short menu line"></label>' +
          '<label class="wide">Short description<textarea id="stb-type-text" rows="3" maxlength="400" placeholder="Потужність, процес і типові деталі."></textarea></label>' +
          '<label class="wide">English short description (optional)<textarea id="stb-type-text-en" rows="2" maxlength="400" placeholder="Used on the English site when the Ukrainian description is filled in."></textarea></label>' +
          '<div class="wide stb-actions" style="margin-top:0"><button type="button" class="btn btn-ghost" id="stb-type-img">Upload card image</button><span id="stb-type-img-name">Uses the last card’s photo if you skip this.</span></div>' +
          '<p class="wide" id="stb-type-status"></p>' +
        '</div>' +
        '<div class="stb-actions"><button type="button" class="btn" id="stb-type-ok">Add machine type</button><button type="button" class="btn btn-ghost" id="stb-type-x">Cancel</button></div></div>';
      document.body.appendChild(modal);
      var slugTouchedLocal = false;
      var imageUrl = '';
      var nameInput = modal.querySelector('#stb-type-name');
      var slugInput = modal.querySelector('#stb-type-slug');
      nameInput.addEventListener('input', function () {
        if (!slugTouchedLocal) slugInput.value = slugify(nameInput.value);
      });
      slugInput.addEventListener('input', function () { slugTouchedLocal = true; });
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      modal.querySelector('#stb-type-x').addEventListener('click', close);
      modal.querySelector('#stb-type-img').addEventListener('click', function () {
        uploadFile(function (url) {
          imageUrl = url || '';
          modal.querySelector('#stb-type-img-name').textContent = imageUrl || 'Uses the last card’s photo if you skip this.';
        });
      });
      modal.querySelector('#stb-type-ok').addEventListener('click', function () {
        var status = modal.querySelector('#stb-type-status');
        var title = nameInput.value.trim();
        if (title.length < 2) { status.textContent = 'Enter the machine type name.'; return; }
        var titleEn = modal.querySelector('#stb-type-name-en').value.trim();
        var taken = false;
        doc.querySelectorAll('#main a.tile h3').forEach(function (h) {
          var have = String(h.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (have && (have === title.toLowerCase() || (titleEn && have === titleEn.toLowerCase()))) taken = true;
        });
        if (taken) { status.textContent = 'A machine type with this name is already on the page. Choose a different name.'; return; }
        status.textContent = 'Creating the card and its page…';
        modal.querySelector('#stb-type-ok').disabled = true;
        api({
          action: 'cms.page.add-machine',
          parent: id,
          title: title,
          titleEn: titleEn,
          slug: slugInput.value.trim(),
          tag: modal.querySelector('#stb-type-tag').value.trim(),
          subtitle: modal.querySelector('#stb-type-sub').value.trim(),
          subtitleEn: modal.querySelector('#stb-type-sub-en').value.trim(),
          text: modal.querySelector('#stb-type-text').value.trim(),
          textEn: modal.querySelector('#stb-type-text-en').value.trim(),
          image: imageUrl
        }).then(function (res) {
          modal.querySelector('#stb-type-ok').disabled = false;
          if (!res || !res.ok) { status.textContent = (res && res.error) || 'The machine type was not created.'; return; }
          ctx.hello = res.where || 'The new machine type is on the site.';
          close();
          if (window.confirm('Open the new page to edit its variants?')) open(res.id, host, ctx);
          else load();
        }).catch(function () {
          modal.querySelector('#stb-type-ok').disabled = false;
          status.textContent = 'Connection error.';
        });
      });
      nameInput.focus();
    }

    function openAddMach() {
      var list = doc && doc.querySelector('#main .mach-list');
      var last = list && list.querySelector('article.mach:last-of-type');
      if (!list || !last) { say('This page has no product list.', 'err'); return; }
      var old = document.getElementById('stb-mach-dlg');
      if (old) old.remove();
      var modal = document.createElement('div');
      modal.className = 'stb-modal';
      modal.id = 'stb-mach-dlg';
      modal.innerHTML = '<div class="stb-dialog" role="dialog" aria-modal="true" aria-labelledby="stb-mach-title">' +
        '<h2 id="stb-mach-title">Add a product</h2>' +
        '<p class="lead">A new product card is added to this page, in the same style as the others. Change its photo or video after it appears, then Save.</p>' +
        '<div class="stb-form">' +
          '<label class="wide">Product name<input type="text" id="stb-mach-name" placeholder="Назва машини"></label>' +
          '<label class="wide">Short description<textarea id="stb-mach-text" rows="3" placeholder="Короткий опис."></textarea></label>' +
          '<p class="wide" id="stb-mach-status"></p>' +
        '</div>' +
        '<div class="stb-actions"><button type="button" class="btn" id="stb-mach-ok">Add product</button><button type="button" class="btn btn-ghost" id="stb-mach-x">Cancel</button></div></div>';
      document.body.appendChild(modal);
      function close() { modal.remove(); }
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      modal.querySelector('#stb-mach-x').addEventListener('click', close);
      var nameInput = modal.querySelector('#stb-mach-name');
      modal.querySelector('#stb-mach-ok').addEventListener('click', function () {
        var title = nameInput.value.trim();
        var text = modal.querySelector('#stb-mach-text').value.trim();
        if (title.length < 2) { modal.querySelector('#stb-mach-status').textContent = 'Enter the product name.'; return; }
        beforeChange();
        var copy = last.cloneNode(true);
        copyUkFrom(last, copy);
        copy.classList.remove('stb-on', 'rv-d1', 'rv-d2', 'rv-d3');
        var slug = slugify(title) || 'produkt';
        var base = slug;
        var n = 2;
        while (doc.getElementById(base)) { base = slug + '-' + n; n++; }
        copy.id = base;
        if (copy.hasAttribute('data-ask-topic')) copy.setAttribute('data-ask-topic', title);
        var h = copy.querySelector('h3');
        if (h) writeUk(h, title);
        var textBox = copy.querySelector('.mach__text');
        var p = textBox && textBox.querySelector('p');
        if (text && p) writeUk(p, text);
        else if (textBox) textBox.remove();
        last.after(copy);
        renumberMach(list);
        stampTree(copy);
        setSelection(copy);
        markDirty('page');
        close();
        if (h) startEdit(h);
        say('Product added on this page. Save to publish it.');
      });
      nameInput.focus();
    }

    host.querySelector('#stb-pick').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pick]');
      if (!btn) return;
      if (btn.getAttribute('data-pick') === 'section' && currentSection) setSelection(currentSection, 'section');
      else if (currentItem) setSelection(currentItem, 'item');
    });
    host.querySelector('#stb-add-type').addEventListener('click', openAddType);
    host.querySelector('#stb-add-mach').addEventListener('click', openAddMach);
    host.querySelector('#stb-add-var').addEventListener('click', addVariant);
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
