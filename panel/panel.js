(function () {
  'use strict';

  var csrf = '';
  var items = [];
  var filter = 'all';
  var activeId = '';
  var API = '/panel/obsluga.php';
  var currentView = 'dash';
  var overview = { pages: 0, machines: 0, machItems: 0, videos: 0 };
  var pageCache = null;
  var editing = null;
  var videoState = null;
  var editTrail = [];

  var loginView = document.getElementById('view-login');
  var totpView = document.getElementById('view-totp');
  var appView = document.getElementById('view-app');
  var listEl = document.getElementById('list');
  var detail = document.getElementById('detail');
  var detailIn = document.getElementById('detail-in');
  var emptyDetail = document.getElementById('empty-detail');
  var unreadPill = document.getElementById('unread-pill');
  var q = document.getElementById('q');
  var toast = document.getElementById('toast');
  var otpInputs = Array.prototype.slice.call(document.querySelectorAll('#otp input'));
  var side = document.getElementById('side');
  var filePick = document.getElementById('file-pick');

  var KIND_ORDER = ['home', 'company', 'machines', 'studs', 'video', 'contact', 'legal', 'other'];

  function t(k) { return window.STAdmin ? STAdmin.t(k) : k; }
  function tf(k, v) { return window.STAdmin ? STAdmin.tf(k, v) : k; }
  // Site content is edited in English (like the public site); only the panel UI is Polish.
  var EDIT_LANG = 'en';
  function looksUk(s) {
    return /[А-Яа-яЁёІіЇїЄєҐґ]/.test(String(s || ''));
  }
  function hasWords(s) {
    return /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9]/.test(String(s || '').replace(/<[^>]+>/g, ' '));
  }
  function ct(uk) {
    if (!uk) return uk;
    if (window.ST && typeof ST.lookup === 'function') return ST.lookup(uk, EDIT_LANG);
    return uk;
  }
  // Polish label for UI-level names (page names in the site tree).
  function ctUi(uk) {
    if (!uk) return uk;
    if (window.ST && typeof ST.lookup === 'function') return ST.lookup(uk, 'pl');
    return uk;
  }
  function ctField(s) {
    s = s == null ? '' : String(s);
    if (!s) return s;
    var direct = ct(s);
    if (direct !== s) return direct;
    var stripped = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (stripped && stripped !== s) {
      var tr = ct(stripped);
      if (tr !== stripped) return tr;
    }
    return s;
  }
  // UI name (Polish) of a page / group.
  function plLabel(s) {
    return String(ctUi(s || '') || '').replace(/кВА/g, 'kVA');
  }
  // Content label (English) — headings of cards, captions, FAQ questions.
  function enLabel(s) {
    return String(ct(s || '') || '').replace(/кВА/g, 'kVA');
  }
  // The public site loads a fresh language file on every publish. The panel
  // HTML keeps a fixed address, so the browser would keep the old English and
  // the editor would show the page from before the last save.
  function refreshCmsOverlay() {
    return fetch('/assets/js/nakladka-jezyk.js?_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (txt) {
        var mark = 'window.ST_I18N_CMS=';
        var i = String(txt || '').indexOf(mark);
        if (i < 0) return;
        var raw = txt.slice(i + mark.length).trim().replace(/^\uFEFF/, '').replace(/;\s*$/, '');
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') window.ST_I18N_CMS = data;
      })
      .catch(function () {});
  }
  function hydrateNames(nodes) {
    var els = [];
    Array.prototype.forEach.call(nodes || [], function (el) {
      if (!el) return;
      var uk = el.textContent || '';
      if (!looksUk(uk)) {
        if (uk.indexOf('кВА') !== -1) el.textContent = uk.replace(/кВА/g, 'kVA');
        return;
      }
      var pl = plLabel(uk);
      if (pl && !looksUk(pl)) {
        el.textContent = pl;
        return;
      }
      els.push(el);
    });
    if (!els.length) return;
    api({ action: 'cms.translate', sl: 'uk', tl: 'pl', texts: els.map(function (el) { return el.textContent; }) }).then(function (res) {
      var map = (res && res.map) || {};
      els.forEach(function (el) {
        var src = el.textContent;
        var pl = mapHit(map, src);
        if (pl) el.textContent = String(pl).replace(/кВА/g, 'kVA');
      });
    });
  }
  function normTxt(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function loc() { return 'pl-PL'; }
  function unreadLabel(n) {
    return n === 1 ? '1 nowe' : n + ' nowych';
  }
  function mapHit(map, val) {
    if (!map) return val;
    if (map[val]) return map[val];
    var n = normTxt(val);
    return map[n] || val;
  }

  function i18nPairBox() {
    var map = {};
    function strip(s) {
      return normTxt(String(s || '').replace(/<[^>]+>/g, ' '));
    }
    return {
      add: function (uk, en) {
        uk = strip(uk);
        en = strip(en);
        if (!uk || !en || uk === en) return;
        if (!looksUk(uk) || looksUk(en)) return;
        map[uk] = en;
      },
      fromForm: function (root) {
        if (!root || !root.querySelectorAll) return;
        var self = this;
        root.querySelectorAll('[data-content]').forEach(function (el) {
          self.add(el.getAttribute('data-save') || el.getAttribute('data-uk'), el.value);
        });
      },
      fromPlan: function (plan, tr) {
        if (!plan || !plan.nodes) return;
        var self = this;
        plan.nodes.forEach(function (x) {
          var uk = x.uk != null ? x.uk : mapHit(tr, x.pl);
          self.add(uk, x.pl);
        });
        if (plan.flow && plan.flow.uk) self.add(plan.flow.uk, plan.flow.en);
      },
      list: function () {
        return Object.keys(map).map(function (uk) { return { uk: uk, en: map[uk] }; });
      }
    };
  }

  function show(step) {
    loginView.hidden = step !== 'login';
    totpView.hidden = step !== 'totp';
    appView.hidden = step !== 'app';
    if (step === 'totp') {
      otpInputs.forEach(function (i) { i.value = ''; });
      setTimeout(function () { otpInputs[0] && otpInputs[0].focus(); }, 40);
    }
    if (step === 'login') {
      var u = document.querySelector('#form-login [name="user"]');
      setTimeout(function () { u && u.focus(); }, 40);
    }
  }

  function flash(msg) {
    toast.hidden = false;
    toast.textContent = msg;
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { toast.hidden = true; }, String(msg).length > 50 ? 5200 : 2600);
  }

  function syncPublishBtn() {
    var btn = document.getElementById('btn-publish');
    if (!btn) return;
    var on = !!overview.pending;
    btn.disabled = !on;
    btn.classList.toggle('is-pending', on);
    btn.textContent = on ? t('Zatwierdź na witrynie') : t('Witryna aktualna');
  }

  function draftBanner() {
    if (!overview.pending) return '';
    return '<p class="pub-banner">' + esc(t('Są niezatwierdzone zmiany. Żeby weszły na witrynę, kliknij „Zatwierdź na witrynie” u góry.')) + '</p>';
  }

  function api(body, retried) {
    return fetch(API, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.assign({ csrf: csrf }, body || {}))
    }).then(function (r) {
      return r.json().then(function (data) {
        data._status = r.status;
        if (data.csrf) csrf = data.csrf;
        if (typeof data.pending === 'boolean') {
          overview.pending = data.pending;
          if (data.since) overview.since = data.since;
          syncPublishBtn();
        }
        var act = body && body.action;
        if (!retried && data._status === 401 && act && act !== 'status' && act !== 'login' && act !== 'totp' && act !== 'logout') {
          return api({ action: 'status' }, true).then(function (st) {
            if (st && st.step === 'app') return api(body, true);
            return data;
          });
        }
        return data;
      }).catch(function () {
        return { ok: false, error: t('Błąd serwera.'), _status: r.status };
      });
    });
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function packed(el) {
    if (!el) return '';
    if (el.getAttribute('data-save') != null) return el.getAttribute('data-save');
    var uk = el.getAttribute('data-uk');
    if (uk == null) return el.value;
    if (looksUk(uk) && normTxt(el.value) === normTxt(ctField(uk))) return uk;
    if (looksUk(el.value)) return el.value;
    return el.value;
  }

  function val(form, name) {
    return packed(form.querySelector('[name="' + name + '"]'));
  }

  function resolveContent(root, done) {
    var els = [];
    root.querySelectorAll('[data-content]').forEach(function (el) {
      if (el.tagName === 'SELECT') return;
      if (el.name === 'new-title' || el.name === 'new-id') return;
      var uk = el.getAttribute('data-uk') || '';
      var val = el.value;
      if (!normTxt(val)) {
        el.setAttribute('data-save', '');
        return;
      }
      if (looksUk(uk) && normTxt(val) === normTxt(ctField(uk))) {
        el.setAttribute('data-save', uk);
        return;
      }
      if (looksUk(val)) {
        el.setAttribute('data-save', val);
        return;
      }
      els.push(el);
    });
    if (!els.length) { done(); return; }
    flash(t('Tłumaczę treści na ukraiński…'));
    api({ action: 'cms.translate', sl: EDIT_LANG, tl: 'uk', texts: els.map(function (el) { return el.value; }) }).then(function (res) {
      var map = (res && res.map) || {};
      els.forEach(function (el) {
        var uk = mapHit(map, el.value);
        el.setAttribute('data-save', uk);
        el.setAttribute('data-uk', uk);
      });
      done();
    }).catch(function () { done(); });
  }

  // Show the Ukrainian source of side-panel fields in the editing language (English).
  function hydrateEdit(root, done) {
    done = typeof done === 'function' ? done : function () {};
    if (!root) { done(); return; }
    var els = [];
    root.querySelectorAll('[data-content]').forEach(function (el) {
      if (el.tagName === 'SELECT') return;
      var uk = el.getAttribute('data-uk') || '';
      var val = el.value;
      if (!looksUk(val)) return;
      var en = ctField(uk || val);
      if (en && !looksUk(en) && en !== val) {
        el.value = en;
        return;
      }
      els.push(el);
    });
    if (!els.length) { done(); return; }
    api({ action: 'cms.translate', sl: 'uk', tl: EDIT_LANG, texts: els.map(function (el) { return el.getAttribute('data-uk') || el.value; }) }).then(function (res) {
      var map = (res && res.map) || {};
      els.forEach(function (el) {
        var src = el.getAttribute('data-uk') || el.value;
        var en = mapHit(map, src);
        if (en && en !== src) el.value = en;
      });
      done();
    }).catch(done);
  }

  function field(label, name, value, extra) {
    extra = extra || {};
    var content = extra.content === true || (!extra.raw && !extra.code && !extra.skipI18n && extra.type !== 'url');
    if (extra.skipI18n || extra.raw || extra.code) content = false;
    var uk = value || '';
    var shown = content ? ctField(uk) : uk;
    var ukAttr = content ? ' data-uk="' + esc(uk) + '" data-content="1"' : '';
    var tag = extra.area ? 'textarea' : (extra.select ? 'select' : 'input');
    if (extra.select) {
      var opts = extra.select.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (o.v === uk ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      }).join('');
      return '<label class="field"><span>' + esc(label) + '</span><select name="' + name + '"' + ukAttr + '>' + opts + '</select></label>';
    }
    var cls = extra.code ? ' class="code"' : '';
    var inner = extra.area
      ? '<' + tag + cls + ' name="' + name + '"' + ukAttr + (extra.rows ? ' rows="' + extra.rows + '"' : '') + '>' + esc(shown) + '</' + tag + '>'
      : '<input name="' + name + '" value="' + esc(shown) + '"' + ukAttr + (extra.type ? ' type="' + extra.type + '"' : '') + '>';
    return '<label class="field"><span>' + esc(label) + '</span>' + inner + '</label>';
  }

  function imgSrc(path) {
    if (!path) return '';
    var p = String(path);
    if (/^https?:/i.test(p) || p.indexOf('/') === 0) return p;
    return '/assets/img/' + p.replace(/^assets\/img\//, '');
  }

  function ytSrc(id) {
    if (!id) return '';
    return '/assets/img/yt/' + encodeURIComponent(id) + '.jpg';
  }

  function parseYt(s) {
    s = String(s || '').trim();
    var m = s.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([\w-]{11})/);
    if (m) return m[1];
    if (/^[\w-]{11}$/.test(s)) return s;
    return '';
  }

  function sendFile(file, cb) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { flash(t('Plik jest większy niż 8 MB.')); return; }
    var reader = new FileReader();
    reader.onload = function () {
      api({ action: 'cms.media.upload', name: file.name || 'wklejka.jpg', data: String(reader.result || '') }).then(function (res) {
        if (!res.ok) { flash(res.error || t('Upload nieudany')); return; }
        cb(res.url);
      });
    };
    reader.readAsDataURL(file);
  }

  function uploadFile(cb) {
    if (!filePick) return;
    filePick.onchange = function () {
      var file = filePick.files && filePick.files[0];
      filePick.value = '';
      if (file) sendFile(file, cb);
    };
    filePick.click();
  }

  function relTime(iso) {
    var ts = Date.parse(iso);
    if (!ts) return '';
    var s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return t('przed chwilą');
    if (s < 3600) return Math.round(s / 60) + ' min';
    if (s < 86400) return Math.round(s / 3600) + ' h';
    if (s < 172800) return t('wczoraj');
    return new Date(ts).toLocaleString(loc(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function setView(name) {
    currentView = name;
    var map = { dash: 'Start', inbox: 'Zapytania', pages: 'Witryna', editor: 'Edycja', videos: 'Filmy', media: 'Zdjęcia', settings: 'Ustawienia' };
    document.getElementById('top-section').textContent = t(map[name] || 'SMOLTECH');
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (el) {
      el.hidden = el.id !== 'view-' + name;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.side__i'), function (btn) {
      var v = btn.getAttribute('data-view');
      btn.classList.toggle('is-on', v === name || (name === 'editor' && v === 'pages') || (name === 'media' && v === 'settings'));
    });
    side.classList.remove('is-open');
    if (name === 'dash') renderDash();
    if (name === 'inbox') renderList();
    if (name === 'pages') loadPages();
    if (name === 'videos') loadVideos();
    if (name === 'media') loadMedia();
    if (name === 'settings') loadSettings();
  }

  function visibleItems() {
    var needle = (q.value || '').trim().toLowerCase();
    return items.filter(function (it) {
      if (filter === 'unread' && it.read) return false;
      if (!needle) return true;
      var blob = [it.name, it.company, it.email, it.phone, it.topic, it.preview].join(' ').toLowerCase();
      return blob.indexOf(needle) !== -1;
    });
  }

  function renderList() {
    var vis = visibleItems();
    var unread = items.filter(function (it) { return !it.read; }).length;
    unreadPill.textContent = unreadLabel(unread);
    var badge = document.getElementById('side-unread');
    if (unread) { badge.hidden = false; badge.textContent = String(unread); }
    else badge.hidden = true;
    if (!listEl) return;
    if (!vis.length) {
      listEl.innerHTML = '<p class="list-empty">' + esc(t('Brak zapytań w tym widoku.')) + '</p>';
      return;
    }
    listEl.innerHTML = vis.map(function (it) {
      return '<button type="button" class="item' + (it.read ? '' : ' is-unread') + (it.id === activeId ? ' is-on' : '') + '" data-id="' + it.id + '">' +
        '<div class="item__top"><span class="item__name"></span><span class="item__time"></span></div>' +
        '<div class="item__meta"></div><div class="item__preview"></div></button>';
    }).join('');
    Array.prototype.forEach.call(listEl.querySelectorAll('.item'), function (btn, i) {
      var it = vis[i];
      btn.querySelector('.item__name').textContent = it.name || t('Bez imienia');
      btn.querySelector('.item__time').textContent = relTime(it.created);
      btn.querySelector('.item__meta').textContent = [it.company, it.topic].filter(Boolean).join(' · ') || it.email;
      btn.querySelector('.item__preview').textContent = it.preview || '';
    });
  }

  function openItem(id) {
    activeId = id;
    renderList();
    api({ action: 'get', id: id }).then(function (data) {
      if (!data.ok || !data.item) {
        flash(data.error || t('Nie udało się otworzyć.'));
        return;
      }
      var it = data.item;
      items.forEach(function (row) { if (row.id === id) row.read = true; });
      renderList();
      emptyDetail.hidden = true;
      detailIn.hidden = false;
      detail.classList.add('is-open');
      var mail = 'mailto:' + encodeURIComponent(it.email || '') + '?subject=' + encodeURIComponent('SMOLTECH — ' + (it.topic || t('Zapytania')));
      detailIn.innerHTML =
        '<button type="button" class="icon-btn back-mob" id="btn-close-detail">← ' + esc(t('Lista')) + '</button>' +
        '<div class="detail__head"><div><h2></h2><p class="detail__topic"></p></div></div>' +
        '<dl class="kv">' +
          '<div><dt>' + esc(t('E-mail')) + '</dt><dd>' + (it.email ? '<a class="js-email" href="' + esc(mail) + '"></a>' : '—') + '</dd></div>' +
          '<div><dt>' + esc(t('Telefon')) + '</dt><dd>' + (it.phone ? '<a class="js-phone" href="tel:' + esc(it.phone) + '"></a>' : '—') + '</dd></div>' +
          '<div><dt>' + esc(t('Firma')) + '</dt><dd class="js-company"></dd></div>' +
          '<div><dt>' + esc(t('Data')) + '</dt><dd class="js-date"></dd></div>' +
        '</dl>' +
        '<div class="message"></div>' +
        '<div class="actions">' +
          (it.email ? '<a class="btn" href="' + esc(mail) + '">' + esc(t('Odpowiedz')) + '</a>' : '') +
          '<button type="button" class="icon-btn" id="btn-unread">' + esc(t('Nieprzeczytane')) + '</button>' +
          '<button type="button" class="icon-btn danger" id="btn-del">' + esc(t('Usuń')) + '</button>' +
        '</div>';
      detailIn.querySelector('h2').textContent = it.name || t('Bez imienia');
      detailIn.querySelector('.detail__topic').textContent = it.topic || t('Bez tematu');
      var em = detailIn.querySelector('.js-email');
      var ph = detailIn.querySelector('.js-phone');
      if (em) em.textContent = it.email;
      if (ph) ph.textContent = it.phone;
      detailIn.querySelector('.js-company').textContent = it.company || '—';
      detailIn.querySelector('.js-date').textContent = it.created ? new Date(it.created).toLocaleString(loc()) : '—';
      detailIn.querySelector('.message').textContent = it.message || '';
      var close = document.getElementById('btn-close-detail');
      if (close) close.addEventListener('click', function () { detail.classList.remove('is-open'); });
      document.getElementById('btn-unread').addEventListener('click', function () {
        api({ action: 'unread', id: id }).then(function (res) {
          if (res.ok) {
            items.forEach(function (row) { if (row.id === id) row.read = false; });
            renderList();
            flash(t('Oznaczone jako nieprzeczytane'));
          }
        });
      });
      document.getElementById('btn-del').addEventListener('click', function () {
        if (!confirm(t('Usunąć to zapytanie na stałe?'))) return;
        api({ action: 'delete', id: id }).then(function (res) {
          if (!res.ok) return;
          items = items.filter(function (row) { return row.id !== id; });
          activeId = '';
          detailIn.hidden = true;
          emptyDetail.hidden = false;
          detail.classList.remove('is-open');
          renderList();
          flash(t('Usunięto'));
        });
      });
    });
  }

  function renderDash() {
    var el = document.getElementById('view-dash');
    var unread = items.filter(function (i) { return !i.read; }).length;
    el.innerHTML =
      '<div class="cms-head"><div><h1>' + esc(t('Co chcesz zmienić?')) + '</h1><p>' + esc(t('Zapisujesz szkic. Na witrynie pojawi się dopiero po kliknięciu „Zatwierdź na witrynie”.')) + '</p></div></div>' +
      draftBanner() +
      '<div class="dash-go">' +
        '<button type="button" data-go="home"><b>' + esc(t('Strona główna')) + '</b><span>' + esc(t('Baner, kafelki i teksty na wejściu.')) + '</span></button>' +
        '<button type="button" data-go="pages"><b>' + esc(t('Maszyny i podstrony')) + '</b><span>' + esc(t('Grupy, konkretne profile maszyn, o firmie, kontakt.')) + '</span></button>' +
        '<button type="button" data-go="videos"><b>' + esc(t('Filmy')) + '</b><span>' + esc(t('Filmy z YouTube na stronie głównej i w katalogu.')) + '</span></button>' +
        '<button type="button" data-go="inbox"><b>' + esc(t('Zapytania od klientów')) + '</b><span>' + (unread ? esc(unreadLabel(unread)) : esc(t('Wiadomości z formularza.'))) + '</span></button>' +
      '</div>';
    el.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        var go = b.getAttribute('data-go');
        if (go === 'home') openEditor('00-strona-glowna');
        else setView(go);
      });
    });
  }

  function pageRoleLabel(p) {
    if (p.roleLabel) return p.roleLabel;
    if (p.kind === 'home') return t('Strona główna');
    if ((p.kind === 'machines' || p.kind === 'studs') && p.parentUrl) return t('Profil maszyny');
    if (p.kind === 'machines' || p.kind === 'studs') return t('Grupa maszyn');
    return t('Strona');
  }

  function pageCanDelete(p) {
    if (!p) return false;
    if (p.hasChildren) return false;
    if (typeof p.canDelete === 'boolean') return p.canDelete;
    if (p.children && p.children.length) return false;
    return p.kind === 'machines' || p.kind === 'studs';
  }

  function isProductPage(p) {
    return !!(p && (p.kind === 'machines' || p.kind === 'studs'));
  }

  function pageCard(p, depth) {
    var thumb = p.image
      ? '<img class="page-card__img" src="' + esc(imgSrc(p.image)) + '" alt="">'
      : '<div class="page-card__img page-card__img--off"></div>';
    return '<div class="page-card' + (depth ? ' page-card--child' : '') + '" data-id="' + esc(p.id) + '" role="button" tabindex="0">' +
      thumb +
      '<span class="page-card__body"><span class="page-card__role"></span><span class="page-card__name"></span><span class="page-card__path"></span></span>' +
      '<span class="page-card__go">' + esc(t('Otwórz')) + '</span>' +
      (isProductPage(p) ? '<button type="button" class="btn btn-ghost btn-sm page-card__del" data-del="' + esc(p.id) + '">' + esc(t('Usuń')) + '</button>' : '') +
      '</div>';
  }

  function renderPageList(el) {
    var roots = nestPages(pageCache);
    var home = [];
    var company = [];
    var machines = [];
    var studs = [];
    var rest = [];
    roots.forEach(function (p) {
      if (p.kind === 'home') home.push(p);
      else if (p.kind === 'company' || p.kind === 'video' || p.kind === 'contact') company.push(p);
      else if (p.kind === 'machines') machines.push(p);
      else if (p.kind === 'studs') studs.push(p);
      else rest.push(p);
    });
    var html = '<div class="cms-head"><div><h1>' + esc(t('Witryna')) + '</h1><p>' + esc(t('Wybierz stronę albo konkretny profil maszyny. Widać, co klient otwiera na witrynie.')) + '</p></div></div>' +
      draftBanner() +
      '<div class="page-board">';
    function dump(items, depth) {
      items.forEach(function (p) {
        html += pageCard(p, depth);
        if (p.children && p.children.length) dump(p.children, depth + 1);
      });
    }
    if (home.length || company.length) {
      html += '<div class="page-group-label">' + esc(t('Wejście na stronę')) + '</div>';
      dump(home.concat(company), 0);
    }
    if (machines.length) {
      html += '<div class="page-group-label">' + esc(t('Maszyny — grupy i profile')) + '</div>';
      dump(machines, 0);
    }
    if (studs.length) {
      html += '<div class="page-group-label">' + esc(t('Zgrzewanie trzpieni')) + '</div>';
      dump(studs, 0);
    }
    if (rest.length) {
      html += '<div class="page-group-label">' + esc(t('Pozostałe')) + '</div>';
      dump(rest, 0);
    }
    html += '</div>';
    el.innerHTML = html;
    var order = [];
    function walk(items) {
      items.forEach(function (p) {
        order.push(p);
        if (p.children) walk(p.children);
      });
    }
    walk(home.concat(company, machines, studs, rest));
    el.querySelectorAll('.page-card').forEach(function (btn, i) {
      var p = order[i];
      if (!p) return;
      btn.querySelector('.page-card__role').textContent = pageRoleLabel(p);
      btn.querySelector('.page-card__name').textContent = plLabel(p.name || p.title);
      var path = btn.querySelector('.page-card__path');
      if (p.parentName) path.textContent = plLabel(p.parentName) + ' → ' + plLabel(p.name);
      else if (p.roleHint) path.textContent = p.roleHint;
      else path.textContent = '';
      btn.addEventListener('click', function (e) {
        if (e.target.closest('[data-del]')) return;
        openEditor(p.id);
      });
      btn.addEventListener('keydown', function (e) {
        if (e.target.closest('[data-del]')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEditor(p.id);
        }
      });
      var del = btn.querySelector('[data-del]');
      if (del) {
        del.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          deleteProductPage(p.id, plLabel(p.name || p.title), { hasChildren: !pageCanDelete(p) });
        });
      }
    });
    hydrateNames(el.querySelectorAll('.page-card__name, .page-card__path'));
  }

  function deleteProductPage(id, name, opts) {
    opts = opts || {};
    if (opts.hasChildren) {
      flash(t('Najpierw usuń podstrony tej grupy.'));
      return;
    }
    var msg = tf('Usunąć stronę „{name}”? Zniknie z listy w panelu od razu. Z witryny zejdzie dopiero po kliknięciu „Zatwierdź na witrynie”.', { name: name || id });
    if (!confirm(msg)) return;
    flash(t('Usuwam stronę…'));
    api({ action: 'cms.page.delete', id: id }).then(function (res) {
      if (!res.ok) { flash(res.error || t('Nie usunięto')); return; }
      flash(t('Usunięto z panelu. Żeby zeszło z witryny, kliknij „Zatwierdź na witrynie”.'));
      if (currentView === 'editor') setView('pages');
      else loadPages();
    }).catch(function () { flash(t('Błąd połączenia — nie usunięto.')); });
  }

  function loadPages() {
    var el = document.getElementById('view-pages');
    el.innerHTML = '<p class="empty">' + esc(t('Ładuję strony…')) + '</p>';
    api({ action: 'cms.pages' }).then(function (data) {
      if (!data.ok) { el.innerHTML = '<p class="err">' + esc(data.error) + '</p>'; return; }
      pageCache = data.pages || [];
      renderPageList(el);
    });
  }

  function nestPages(pages) {
    var skip = { '90-404': 1, '11-kompetentsiyi': 1 };
    var list = pages.filter(function (p) { return !skip[p.id]; }).map(function (p) {
      return Object.assign({}, p, { children: [] });
    });
    var byUrl = {};
    list.forEach(function (p) { byUrl[p.url] = p; });
    var roots = [];
    list.forEach(function (p) {
      var parent = p.parentUrl && byUrl[p.parentUrl];
      if (parent && parent !== p) parent.children.push(p);
      else roots.push(p);
    });
    function byFile(a, b) { return String(a.file).localeCompare(String(b.file)); }
    roots.sort(byFile);
    roots.forEach(function (r) {
      r.children.sort(byFile);
      r.children.forEach(function (c) { c.children.sort(byFile); });
    });
    return roots;
  }

  function ensurePageCache() {
    if (pageCache && pageCache.length) return Promise.resolve(pageCache);
    return api({ action: 'cms.pages' }).then(function (data) {
      if (data.ok) pageCache = data.pages || [];
      return pageCache || [];
    }).catch(function () { return pageCache || []; });
  }

  function pageNormUrl(u) {
    var path = String(u || '');
    try { path = new URL(path, 'https://smoltech.com.ua').pathname; } catch (e) {}
    path = path.split('?')[0].split('#')[0];
    if (!path) path = '/';
    if (path !== '/' && !/\.[a-z0-9]+$/i.test(path) && path.charAt(path.length - 1) !== '/') path += '/';
    return path;
  }

  function pageByUrl(href) {
    var path = pageNormUrl(href);
    if (!path || path === '#') return null;
    var list = pageCache || [];
    for (var i = 0; i < list.length; i++) {
      if (pageNormUrl(list[i].url) === path) return list[i];
    }
    return null;
  }

  function walkNest(nodes, fn, parent) {
    (nodes || []).forEach(function (n) {
      fn(n, parent, nodes);
      if (n.children && n.children.length) walkNest(n.children, fn, n);
    });
  }

  function pageFamily(id) {
    var roots = nestPages(pageCache || []);
    var hit = null;
    walkNest(roots, function (n, parent, siblings) {
      if (!hit && n.id === id) hit = { node: n, parent: parent || null, siblings: siblings || [] };
    });
    if (!hit) {
      var raw = (pageCache || []).filter(function (p) { return p.id === id; })[0];
      return { node: raw || null, parent: null, siblings: [], children: [] };
    }
    return {
      node: hit.node,
      parent: hit.parent,
      siblings: hit.siblings,
      children: hit.node.children || []
    };
  }

  function pageById(id) {
    var list = pageCache || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function rememberTrail(id, mode) {
    id = String(id || '');
    if (!id) return;
    var i;
    if (mode === 'keep') {
      if (editTrail.indexOf(id) === -1) editTrail = [id];
      return;
    }
    if (mode === 'push') {
      i = editTrail.indexOf(id);
      if (i !== -1) {
        editTrail = editTrail.slice(0, i + 1);
        return;
      }
      if (editTrail[editTrail.length - 1] !== id) editTrail.push(id);
      if (editTrail.length > 12) editTrail = editTrail.slice(editTrail.length - 12);
      return;
    }
    editTrail = [id];
  }

  function trailPages() {
    var out = [];
    (editTrail || []).forEach(function (tid) {
      var p = pageById(tid);
      if (p) out.push(p);
    });
    return out;
  }

  function hopSequence() {
    return trailPages();
  }

  function hopChip(page, currentId) {
    var name = plLabel(page.name || page.title || page.id);
    var current = page.id === currentId;
    var cls = 'vis__hop-i' + (current ? ' is-on' : '');
    if (current) {
      return '<span class="' + cls + '" title="' + esc(name) + '"><span>' + esc(name) + '</span></span>';
    }
    return '<button type="button" class="' + cls + '" data-hop="' + esc(page.id) + '" title="' + esc(t('Wróć do')) + ': ' + esc(name) + '">' +
      '<span>' + esc(name) + '</span></button>';
  }

  function hopRailHtml(id) {
    var pages = trailPages();
    if (pages.length < 2) return '';
    var chips = '';
    pages.forEach(function (page, i) {
      if (i) chips += '<span class="vis__hop-sep" aria-hidden="true">›</span>';
      chips += hopChip(page, id);
    });
    var prev = pages[pages.length - 2];
    return '<div class="vis__hop" role="navigation" aria-label="' + esc(t('Ścieżka')) + '">' +
      '<span class="vis__hop-lab">' + esc(t('Ścieżka')) + '</span>' +
      '<button type="button" class="vis__hop-arrow" data-hop="' + esc(prev.id) + '" title="' + esc(t('Poprzednia karta')) + '" aria-label="' + esc(t('Poprzednia karta')) + '">‹</button>' +
      '<div class="vis__hop-track">' + chips + '</div>' +
      '</div>';
  }

  // Product card row in the side column: media + inquiry topic. Title and description are edited on the card itself.
  function machRow(it, key, idx) {
    var thumbSrc = it.video ? ytSrc(it.video) : (it.image ? imgSrc(it.image) : '');
    var thumb = thumbSrc
      ? '<img class="item-thumb" src="' + esc(thumbSrc) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
      : '<div class="item-thumb item-thumb--off"></div>';
    var heading = enLabel(it.title) || (t('Produkt') + ' ' + (idx + 1));
    return '<div class="repeat__i item-card" data-idx="' + idx + '" data-mach-key="' + esc(String(key)) + '">' +
      '<div class="repeat__top"><span class="item-card__name">' + esc(heading) + '</span>' +
        '<span class="item-card__tools">' +
          '<button type="button" class="icon-btn js-up" title="' + esc(t('Wyżej')) + '">↑</button>' +
          '<button type="button" class="icon-btn js-down" title="' + esc(t('Niżej')) + '">↓</button>' +
          '<button type="button" class="icon-btn danger js-del">' + esc(t('Usuń')) + '</button>' +
        '</span></div>' +
      '<div class="item-card__in">' + thumb + '<div>' +
      field(t('Film YouTube (wklej link albo ID)'), 'm-video-' + idx, it.video, { skipI18n: true }) +
      '<label class="field"><span>' + esc(t('Zdjęcie (gdy nie ma filmu)')) + '</span><span class="pick-row">' +
        '<input name="m-image-' + idx + '" value="' + esc(it.image || '') + '" readonly placeholder="' + esc(t('brak')) + '">' +
        '<button type="button" class="btn btn-ghost btn-sm js-pick-img">' + esc(t('Wybierz')) + '</button>' +
        '<button type="button" class="icon-btn js-clear-img" title="' + esc(t('Usuń zdjęcie')) + '">×</button>' +
      '</span></label>' +
      field(t('Temat w formularzu zapytania'), 'm-topic-' + idx, it.topic, { content: true }) +
      '<input type="hidden" name="m-id-' + idx + '" value="' + esc(it.id || '') + '">' +
      '</div></div>' +
      '<p class="hint item-card__hint">' + esc(t('Tytuł i opis zmieniasz bezpośrednio na kafelku obok — kliknij tekst.')) + '</p>' +
      '</div>';
  }

  function faqRow(it, idx) {
    return '<div class="repeat__i">' +
      '<div class="repeat__top"><span>' + esc((enLabel(it.q) || (t('Pytanie') + ' ' + (idx + 1)))) + '</span><button type="button" class="icon-btn danger js-del">' + esc(t('Usuń')) + '</button></div>' +
      field(t('Pytanie'), 'f-q-' + idx, it.q, { content: true }) +
      field(t('Odpowiedź'), 'f-a-' + idx, it.a, { area: true, content: true }) +
      '</div>';
  }

  function photoLabel(im, idx) {
    if (im.kind === 'hero') return t('Zdjęcie na górze strony');
    if (im.caption) return t('Zdjęcie') + ': ' + enLabel(im.caption);
    if (im.kind === 'area' || im.kind === 'tile') return t('Zdjęcie kafelka');
    return t('Zdjęcie na stronie');
  }

  /* ---------- Visual (click-to-edit) page editor ---------- */

  var EDIT_SEL = '[data-cms-copy],[data-cms-shared],[data-cms-img],[data-cms-mach],[data-cms-faq],[data-cms-person]';
  var TEXT_SEL = '[data-cms-copy],[data-cms-shared],[data-cms-new]';
  // Text blocks that can be added next to / removed from their neighbours.
  var BLOCK_KINDS = ['li', 'p', 'lead', 'hero__sub'];
  var CHROME_SEL = '.topbar, .hdr, .drawer, .crumbs, .mbar, .skip, .totop';
  var MULTILINE_KINDS = ['p', 'hero__sub', 'lead', 'li', 'summary', 'label', 'cell'];
  var TEXT_ROLES = [
    { v: '', l: 'Domyślna (jak na stronie)' },
    { v: 'head', l: 'Nagłówek' },
    { v: 'sub', l: 'Podnagłówek' },
    { v: 'body', l: 'Treść' },
    { v: 'small', l: 'Treść mała' }
  ];
  var TEXT_COLORS = [
    { v: '#161616', l: 'Czerń' },
    { v: '#d10a11', l: 'Czerwień SMOLTECH' },
    { v: '#ffffff', l: 'Biel' },
    { v: '#5c6570', l: 'Szary' }
  ];
  var VIS_CSS = [
    'html{scroll-behavior:auto!important}',
    '.has-rv .rv,.rv{opacity:1!important;transform:none!important;transition:none!important}',
    '.hdr{opacity:1;filter:none;pointer-events:auto;overflow:visible!important}',
    '.topbar,.drawer,.crumbs{pointer-events:auto}',
    '@media (min-width:1000px){.nav{display:flex!important}.burger{display:none!important}.hdr__cta .btn{display:inline-flex!important}}',
    '.hdr a,.topbar a,.drawer a,.crumbs a,.hdr .nav__link,.hdr .burger{cursor:pointer}',
    '.hdr [data-cms-copy],.hdr [data-cms-shared],.topbar [data-cms-copy],.drawer [data-cms-copy],.crumbs [data-cms-copy],.crumbs [data-cms-shared]{cursor:pointer;outline:none!important;background:transparent!important}',
    'html.cms-show-all .hdr [data-cms-copy],html.cms-show-all .hdr [data-cms-shared],html.cms-show-all .crumbs [data-cms-copy],html.cms-show-all .crumbs [data-cms-shared]{outline:none!important}',
    '.logos.is-marquee .logos__track{animation:none!important;transform:none!important;will-change:auto}',
    '.area__media::after,.tile__media::after,.card__media::after,.spec__media::after{pointer-events:none}',
    '.ftr a:not([data-cms-shared]),.ftr .brand{pointer-events:none}',
    '.cta .cta__phone,.cta form [type="submit"],.cta form .form-privacy__i{pointer-events:auto}',
    '.cta form input,.cta form textarea{pointer-events:none}',
    '.mbar{display:none!important}',
    '.hero__video{display:none!important}',
    '.hero--video .hero__poster{display:block!important;z-index:1;opacity:.92}',
    '.hero--video .hero__poster,.hero--video .hero__poster picture,.hero--video .hero__poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.hero--video .hero__in{pointer-events:none}.hero--video .hero__in [data-cms-copy],.hero--video .hero__in .hero__shot,.hero--video .hero__in .hero__shot *{pointer-events:auto}',
    '.hero__emerge,.hero__emerge picture,.hero__emerge img,.hero__bg,.hero__bg picture,.hero__bg img,.hero__poster{pointer-events:auto!important}',
    '.hero__in .hero__shot,.hero__in .hero__shot *{pointer-events:auto}',
    '.hero__dim,.grid-lines,.spark,.hero__glow{pointer-events:none}',
    '[data-cms-copy],[data-cms-shared]{cursor:text;border-radius:3px;outline:1.5px dashed transparent;outline-offset:3px;transition:outline-color .15s,background-color .15s,box-shadow .15s}',
    'html.cms-show-all [data-cms-copy],html.cms-show-all [data-cms-shared]{outline-color:rgba(209,10,17,.38)}',
    '.ftr [data-cms-shared]{outline-offset:2px}html.cms-show-all .ftr [data-cms-shared]{outline-color:rgba(255,140,140,.55)}',
    '[data-cms-copy]:hover,[data-cms-copy].cms-hover,[data-cms-shared]:hover,[data-cms-shared].cms-hover{outline-color:#d10a11!important;background-color:rgba(209,10,17,.07)}',
    '.ftr [data-cms-shared]:hover,.ftr [data-cms-shared].cms-hover{background-color:rgba(255,255,255,.08)}',
    '[data-cms-copy].cms-editing,[data-cms-shared].cms-editing{outline:2px solid #d10a11!important;background-color:rgba(255,255,255,.96)!important;box-shadow:0 0 0 6px rgba(209,10,17,.14);background-image:none!important}',
    '[data-cms-copy] [style*="color"],[data-cms-shared] [style*="color"]{-webkit-text-fill-color:currentColor!important}',
    '[data-cms-copy].cms-editing *,[data-cms-shared].cms-editing *{background-image:none!important}',
    '[data-cms-copy].cms-changed,[data-cms-shared].cms-changed{outline:1.5px solid #1c9a4a!important;background-color:rgba(28,154,74,.09)}',
    '[data-cms-deleted]{display:none!important}',
    '.ticks li,.prose .ticks li{display:block!important;align-items:unset!important;gap:unset!important;padding-left:2.1rem!important;min-height:1.65em}',
    '.ticks li::before{position:absolute!important;left:0!important;top:.08em!important;flex:none!important}',
    '.ticks li b,.ticks li strong,.ticks li em,.ticks li i,.ticks li u,.ticks li a,.ticks li span{display:inline!important}',
    '[data-cms-list]{margin:.15rem 0 0}',
    '[data-cms-list="ol"]{padding-left:1.25em;display:grid;gap:.48rem}',
    '[data-cms-new]{outline:1.5px dashed #1c9a4a;outline-offset:3px;border-radius:3px;cursor:text;background-color:rgba(28,154,74,.09)}',
    '[data-cms-new].cms-editing{outline:2px solid #d10a11!important;background-color:rgba(255,255,255,.96)!important;box-shadow:0 0 0 6px rgba(209,10,17,.14)}',
    '@media (min-width:560px){.mach--prod{grid-template-columns:minmax(0,2fr) minmax(0,3fr)!important}}',
    '.mach__text[data-cms-copy]{min-height:3.2em;padding:.35rem .5rem;margin:-.35rem -.5rem;outline-offset:0}',
    '.mach__text[data-cms-copy].cms-editing p:empty::before{content:"\\200b"}',
    '.mach__film--empty[data-cms-mach-media]{display:grid;place-items:center;color:#8a93a3;font:600 13px/1.3 Inter,"Segoe UI",system-ui,sans-serif;cursor:pointer;text-align:center;padding:1rem}',
    '.mach__film--img{cursor:pointer}',
    '.model-strip__shot--empty,.film-rail__empty{cursor:pointer;display:grid;place-items:center;color:#8a93a3;font:600 13px/1.3 Inter,"Segoe UI",system-ui,sans-serif;text-align:center;padding:.8rem}',
    '.model-strip li{position:relative}',
    'div.model-strip__btn{cursor:default}',
    '.model-strip__name{cursor:text;min-width:1.5ch}',
    '.param-matrix__head[data-col]{position:relative;padding-right:1.4rem}',
    '.cms-col-del{position:absolute;top:.2rem;right:.2rem;z-index:6;width:20px;height:20px;border:0;border-radius:50%;background:#d10a11;color:#fff;cursor:pointer;padding:0;box-shadow:0 2px 8px rgba(0,0,0,.25)}',
    '.cms-col-del::before{content:"\\00d7";font:700 15px/20px Inter,"Segoe UI",system-ui,sans-serif}',
    '.model-strip:not(.model-strip--shots) .cms-col-del{top:-8px;right:-8px}',
    '.cms-editing > .cms-col-del{display:none!important}',
    '.param-matrix__cell[data-cms-copy]{cursor:text}',
    '[data-cms-tile]{cursor:pointer}',
    '.cms-new-card{outline:2px dashed rgba(28,154,74,.7);outline-offset:4px}',
    '[data-cms-img]{cursor:grab;outline:2px dashed transparent;outline-offset:-3px;transition:outline-color .15s,box-shadow .15s;object-fit:cover!important;object-position:var(--st-x,center) var(--st-y,center)!important;transform:scale(var(--st-z,1))!important;transform-origin:var(--st-x,50%) var(--st-y,50%)!important;-webkit-user-drag:none;user-select:none;touch-action:none}',
    '[data-cms-img].cms-cropping{cursor:grabbing}',
    '[data-cms-img].cms-crop-on{outline:2px solid #d10a11!important;box-shadow:0 0 0 4px rgba(209,10,17,.2)}',
    'picture:has(> img[data-cms-img]),.tile__media,.card__media,.area__media,.spec__media,.mach__film,.mach__shot,.model-strip__shot,.stud-stage__media,.stud-svc__shot,.showcase-intro__media,.hero__bg,.hero__emerge,.hero__shot,.hero__poster,.about-intro__media,.proof__media,.stud-partner__media,.split__media,.why__media,.comp__media,.logos__item,.client-wall li{overflow:hidden}',
    '.logos__item img[data-cms-img],.client-wall img[data-cms-img]{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}',
    '.tile__media img,.card__media img,.spec__media img,.mach__shot img,.frame--product img,.stud-stage__media img,.stud-svc__shot img,.hero__shot--studio img,.model-strip__shot img,.showcase-intro__media--product img,.hero__bg img,.hero__emerge img,.hero__poster img{object-fit:cover!important;object-position:var(--st-x,center) var(--st-y,center)!important;padding:0!important;background:transparent!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}',
    '.hero__shot--studio{overflow:hidden;padding:0!important;aspect-ratio:4/3}',
    '.hero__shot--studio picture,.tile__media picture,.card__media picture,.spec__media picture,.mach__shot picture,.stud-stage__media picture{position:absolute;inset:0;width:100%;height:100%;display:block}',
    'html.cms-show-all [data-cms-img]{outline-color:rgba(209,10,17,.5)}',
    '[data-cms-img]:hover,[data-cms-img].cms-hover{outline-color:#d10a11!important}',
    '[data-cms-img].cms-changed{outline:3px solid #1c9a4a!important}',
    '[data-cms-mach],[data-cms-faq],[data-cms-person]{cursor:pointer;outline:1.5px dashed transparent;outline-offset:5px;border-radius:6px;transition:outline-color .15s}',
    'html.cms-show-all [data-cms-mach],html.cms-show-all [data-cms-faq],html.cms-show-all [data-cms-person]{outline-color:rgba(209,10,17,.3)}',
    '[data-cms-mach]:hover,[data-cms-faq]:hover,[data-cms-person]:hover,.cms-hover[data-cms-mach],.cms-hover[data-cms-faq],.cms-hover[data-cms-person]{outline-color:#d10a11!important}',
    '[data-cms-mach] a:not([data-cms-copy]),[data-cms-faq] a,[data-cms-person] a{pointer-events:none}',
    '[data-cms-mach] .yt{pointer-events:none}',
    '#cms-tip{position:fixed;z-index:2147483647;pointer-events:none;background:#161616;color:#fff;font:600 12px/1.35 Inter,"Segoe UI",system-ui,sans-serif;padding:6px 10px;border-radius:7px;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s;max-width:300px;white-space:normal}',
    '#cms-tip.is-on{opacity:1;transform:none}',
    '#cms-tip b{color:#ff9a9e;font-weight:800}',
    '.cms-flash{animation:cmsFlash 1.4s ease}',
    '@keyframes cmsFlash{0%{box-shadow:0 0 0 0 rgba(209,10,17,.75)}100%{box-shadow:0 0 0 22px rgba(209,10,17,0)}}',
    '.cms-hop-host{position:relative!important}',
    '.cms-hop{z-index:80;width:32px;height:32px;padding:0;border:0;border-radius:9px;background:#d10a11;color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 18px -8px rgba(22,22,22,.55);pointer-events:auto!important}',
    '.cms-hop svg{display:block;width:15px;height:15px}',
    '.cms-hop--card{position:absolute;top:10px;right:10px}',
    '.cms-hop--row{position:absolute;top:50%;right:8px;transform:translateY(-50%);width:26px;height:26px;border-radius:7px;box-shadow:none}',
    '.cms-hop-host--row{position:relative!important;padding-right:2.5rem!important}',
    '.cms-hop--cta{position:static;flex:none;width:28px;height:28px;margin:0;border-radius:8px;box-shadow:none}',
    '.cms-hop-host--cta{display:inline-flex!important;align-items:center;gap:.45rem}',
    'a.btn.cms-hop-host--cta{width:auto}',
    '.cms-hop:hover,.cms-hop:focus{background:#b10910}',
    '.cms-hop--card:hover,.cms-hop--cta:hover,.cms-hop--card:focus,.cms-hop--cta:focus{transform:scale(1.06)}',
    '.cms-hop--row:hover,.cms-hop--row:focus{transform:translateY(-50%) scale(1.06)}'
  ].join('\n');

  function textNodes(root) {
    var out = [];
    var doc = root.ownerDocument;
    var walker = doc.createTreeWalker(root, 4, {
      acceptNode: function (n) {
        if (!normTxt(n.nodeValue)) return 2;
        var par = n.parentNode;
        while (par && par !== root) {
          var tag = String(par.nodeName || '').toLowerCase();
          if (tag === 'svg' || tag === 'script' || tag === 'style' || tag === 'noscript') return 2;
          par = par.parentNode;
        }
        return 1;
      }
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  function setNodeText(node, text) {
    var v = node.nodeValue || '';
    var lead = (v.match(/^\s*/) || [''])[0];
    var trail = (v.match(/\s*$/) || [''])[0];
    node.nodeValue = lead + text + trail;
  }

  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (s) { if (s && !seen[s]) { seen[s] = 1; out.push(s); } });
    return out;
  }

  function fmtCard() {
    var html = '';
    html += '<div class="ed-card vis__block fmt" id="fmt-card"><h2>' + esc(t('Czcionka i formatowanie')) + '</h2>' +
      '<p class="hint" id="fmt-hint">' + esc(t('Kliknij napis, zaznacz fragment i zmień kolor, pogrubienie albo wstaw link (przycisk Link albo Ctrl+K).')) + '</p>' +
      '<div class="fmt__row">' +
        '<label class="field fmt__sel"><span>' + esc(t('Szablon tekstu')) + '</span><select id="fmt-role">' +
          TEXT_ROLES.map(function (f) { return '<option value="' + esc(f.v) + '">' + esc(t(f.l)) + '</option>'; }).join('') +
        '</select></label>' +
        '<div class="field fmt__color">' +
          '<span>' + esc(t('Kolor czcionki')) + '</span>' +
          '<div class="fmt__color-row">' +
            '<input type="color" id="fmt-color" value="#161616" title="' + esc(t('Kolor czcionki')) + '" disabled>' +
            TEXT_COLORS.map(function (c) {
              return '<button type="button" class="fmt__swatch" data-color="' + esc(c.v) + '" title="' + esc(t(c.l)) + '" style="background:' + esc(c.v) + '"></button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="fmt__btns">' +
        '<button type="button" class="fmt__b" data-cmd="bold" title="' + esc(t('Pogrubienie')) + '"><b>B</b></button>' +
        '<button type="button" class="fmt__b" data-cmd="italic" title="' + esc(t('Kursywa')) + '"><i>I</i></button>' +
        '<button type="button" class="fmt__b" data-cmd="underline" title="' + esc(t('Podkreślenie')) + '"><u>U</u></button>' +
        '<button type="button" class="fmt__b fmt__b--rich" data-cmd="insertUnorderedList" title="' + esc(t('Lista punktowana')) + '">•&nbsp;—</button>' +
        '<button type="button" class="fmt__b fmt__b--rich" data-cmd="insertOrderedList" title="' + esc(t('Lista numerowana')) + '">1.&nbsp;—</button>' +
        '<button type="button" class="fmt__x fmt__x--link" id="fmt-link" title="' + esc(t('Wstaw lub edytuj link (Ctrl+K)')) + '">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>' +
          '<span>' + esc(t('Link')) + '</span></button>' +
        '<button type="button" class="fmt__b" data-cmd="removeFormat" title="' + esc(t('Wyczyść formatowanie')) + '">' + esc(t('Wyczyść')) + '</button>' +
      '</div>' +
      '<div class="fmt__blocks" id="fmt-blocks">' +
        '<button type="button" class="fmt__x fmt__x--add" id="fmt-add">+ <span>' + esc(t('Dodaj akapit poniżej')) + '</span></button>' +
        '<button type="button" class="fmt__x fmt__x--copy" id="fmt-copy">' + esc(t('Kopiuj to pole')) + '</button>' +
        '<button type="button" class="fmt__x fmt__x--del" id="fmt-del">' + esc(t('Usuń to pole')) + '</button>' +
      '</div></div>';
    return html;
  }

  function structuredCards(p, m) {
    var html = '';
    html += '<div class="ed-card vis__block" id="hero-crop-card">' +
      '<h2 id="photo-crop-title">' + esc(t('Zdjęcie')) + '</h2>' +
      '<p class="hint" id="photo-crop-hint">' + esc(t('Kliknij dowolne zdjęcie na stronie. Przeciągnij, żeby przesunąć, kółkiem przybliż. „Wybierz zdjęcie” albo Ctrl+V podmienia plik.')) + '</p>' +
      '<div class="crop-ui">' +
        '<div class="crop-ui__btns">' +
          '<button type="button" class="btn btn-sm" id="btn-hero-pick">' + esc(t('Wybierz zdjęcie')) + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btn-hero-reset">' + esc(t('Wyśrodkuj')) + '</button>' +
        '</div>' +
        '<label class="crop-ui__zoom"><span>' + esc(t('Przybliżenie')) + '</span>' +
        '<input type="range" id="hero-zoom" min="100" max="250" step="1" value="100">' +
        '<b id="hero-zoom-val">100%</b></label>' +
        '<p class="hint">' + esc(t('Na zdjęciu obok: przeciągnij, żeby przesunąć. Kółko myszy przybliża.')) + '</p>' +
      '</div></div>';
    if (p.people && p.people.length) {
      html += '<details class="ed-card vis__block" id="people-wrap"><summary>' + esc(t('Osoby do kontaktu')) + ' <span class="vis__n">' + p.people.length + '</span></summary>' +
        '<p class="hint">' + esc(t('Kliknij osobę na stronie obok albo rozwiń tutaj.')) + '</p><div class="repeat" id="people">';
      p.people.forEach(function (it, idx) {
        html += '<div class="repeat__i" data-idx="' + idx + '">' +
          field(t('Rola'), 'p-role-' + idx, it.role, { content: true }) +
          field(t('Imię i nazwisko'), 'p-name-' + idx, it.name, { skipI18n: true }) +
          field(t('E-mail'), 'p-email-' + idx, it.email, { skipI18n: true }) +
          field(t('Telefony (każdy w nowej linii)'), 'p-phones-' + idx, (it.phones || []).join('\n'), { area: true, rows: 3, skipI18n: true }) +
          '</div>';
      });
      html += '</div></details>';
    }
    var cat = p.catalog || {};
    var machItems = p.mach || [];
    if (machItems.length || cat.canAddMach) {
      html += '<details class="ed-card vis__block" id="mach-wrap" open><summary>' + esc(t('Produkty na tej stronie')) + ' <span class="vis__n" id="mach-n">' + machItems.length + '</span></summary>' +
        '<p class="hint">' + esc(t('Każdy produkt to kafelek: numer i tytuł nad filmem lub zdjęciem, link „zapytaj” pod nim, a z prawej dowolny tekst. Tytuł i opis edytujesz na kafelku, film i zdjęcie — tutaj.')) + '</p>' +
        '<p class="vis__add"><button type="button" class="btn btn-sm" id="btn-add-mach">' + esc(t('+ Dodaj produkt')) + '</button></p>' +
        '<div class="repeat" id="mach">';
      machItems.forEach(function (it, idx) { html += machRow(it, String(idx), idx); });
      html += '</div></details>';
    }
    if (cat.canAddModel) {
      var cols = (p.models && p.models.columns) || [];
      html += '<details class="ed-card vis__block" id="model-wrap" open><summary>' + esc(t('Modele w tabeli')) + ' <span class="vis__n" id="model-n">' + cols.length + '</span></summary>' +
        '<p class="hint">' + esc(t('Kliknij numer modelu nad tabelą, żeby go zmienić — ten sam wpisze się w nagłówku kolumny. Krzyżyk albo „Usuń” kasuje model i całą kolumnę.')) + '</p>' +
        '<div class="repeat" id="model-list"></div>' +
        '<p class="vis__add"><button type="button" class="btn btn-sm" id="btn-add-model">' + esc(t('+ Dodaj urządzenie / model')) + '</button></p></details>';
    }
    if (cat.canAddFilm) {
      var films = p.films || [];
      html += '<details class="ed-card vis__block" id="film-wrap" open><summary>' + esc(t('Filmy instruktażowe')) + ' <span class="vis__n" id="film-n">' + films.length + '</span></summary>' +
        '<p class="hint">' + esc(t('Kolejny film w tej samej belce co obecne. Tytuł edytujesz na kafelku, link YouTube — tutaj.')) + '</p>' +
        '<p class="vis__add"><button type="button" class="btn btn-sm" id="btn-add-film">' + esc(t('+ Dodaj film instruktażowy')) + '</button></p>' +
        '<div class="repeat" id="films">';
      films.forEach(function (it, idx) {
        html += '<div class="repeat__i" data-film-key="' + idx + '">' +
          field(t('Film YouTube (wklej link albo ID)'), 'film-v-' + idx, it.video, { skipI18n: true }) +
          '</div>';
      });
      html += '</div></details>';
    }
    if (cat.canAddTile) {
      html += '<details class="ed-card vis__block" id="tile-wrap" open><summary>' + esc(t('Nowy rodzaj na tej stronie')) + '</summary>' +
        '<p class="hint">' + esc(t('Doda kafelek w tym samym układzie i skopiuje szablon podstrony produktowej z tej grupy — potem edytujesz ją jak pozostałe.')) + '</p>' +
        field(t('Nazwa (po angielsku)'), 'new-tile-title', '', { skipI18n: true }) +
        field(t('Etykieta na kafelku, np. AC · 400 kVA'), 'new-tile-tag', '', { skipI18n: true }) +
        field(t('Krótki opis na kafelku'), 'new-tile-text', '', { area: true, skipI18n: true }) +
        '<p class="vis__add"><button type="button" class="btn btn-sm" id="btn-add-tile">' + esc(t('+ Dodaj rodzaj i utwórz stronę')) + '</button></p></details>';
    }
    if (p.faq && p.faq.length) {
      html += '<details class="ed-card vis__block" id="faq-wrap"><summary>' + esc(t('Pytania i odpowiedzi')) + ' <span class="vis__n">' + p.faq.length + '</span></summary>' +
        '<p class="hint">' + esc(t('Kliknij pytanie na stronie obok, żeby je tu otworzyć.')) + '</p><div class="repeat" id="faq">';
      p.faq.forEach(function (it, idx) { html += faqRow(it, idx); });
      html += '</div><p class="vis__add"><button type="button" class="btn btn-ghost btn-sm" id="btn-add-faq">' + esc(t('+ Dodaj pytanie')) + '</button></p></details>';
    }
    html += '<details class="ed-card vis__block"><summary>' + esc(t('Tekst w Google (opcjonalnie)')) + '</summary><p class="hint">' + esc(t('Tytuł i opis, które widać w wynikach wyszukiwania.')) + '</p><div class="stack">' +
      field(t('Tytuł w Google'), 'title', m.title, { content: true }) +
      field(t('Opis w Google'), 'desc', m.desc, { area: true, content: true }) +
      field(t('Tytuł przy udostępnianiu'), 'ogtitle', m.ogtitle, { content: true }) +
      field(t('Zdjęcie przy udostępnianiu'), 'og', m.og, { skipI18n: true }) +
      '</div></details>';
    return html;
  }

  function openEditor(id, opts) {
    opts = opts || {};
    rememberTrail(id, opts.trail || 'reset');
    var el = document.getElementById('view-editor');
    el.innerHTML = '<p class="empty">' + esc(t('Otwieram…')) + '</p>';
    setView('editor');
    Promise.all([
      api({ action: 'cms.page.get', id: id }),
      api({ action: 'cms.page.preview', id: id }),
      ensurePageCache(),
      refreshCmsOverlay()
    ]).then(function (both) {
      var data = both[0], prev = both[1];
      if (!data.ok) { el.innerHTML = '<p class="err">' + esc(data.error) + '</p>'; return; }
      if (!prev.ok) { el.innerHTML = '<p class="err">' + esc(prev.error || t('Nie udało się wczytać podglądu strony.')) + '</p>'; return; }
      editing = data.page;
      var p = editing;
      p._stamp = data.stamp || '';
      var m = p.meta || {};
      var pageName = p.name || m.title || p.id;
      var role = p.roleLabel || pageRoleLabel(p);
      var crumb = p.parentName ? plLabel(p.parentName) + ' → ' + plLabel(pageName) : '';

      var html = '<div class="vis">' +
        '<div class="vis__bar">' +
          '<div class="vis__who">' +
            '<button class="btn btn-ghost btn-sm" type="button" id="btn-back-pages">← ' + esc(t('Wróć')) + '</button>' +
            '<div><span class="vis__role">' + esc(role) + '</span><h1 class="vis__title"></h1>' +
            (crumb ? '<p class="vis__crumb">' + esc(crumb) + '</p>' : '') + '</div>' +
          '</div>' +
          '<div class="vis__tools">' +
            '<span class="vis__count" id="vis-count">' + esc(t('Brak zmian')) + '</span>' +
            (m.url ? '<a class="btn btn-ghost btn-sm" id="btn-view-live" href="' + esc(m.url) + (m.url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now() + '" target="_blank" rel="noopener">' + esc(t('Zobacz na stronie')) + '</a>' : '') +
            (isProductPage(p) ? '<button class="btn btn-ghost btn-sm btn-danger" type="button" id="btn-del-page">' + esc(t('Usuń stronę')) + '</button>' : '') +
            '<button class="btn btn-sm" type="button" id="btn-save-page">' + esc(t('Zapisz')) + '</button>' +
          '</div>' +
        '</div>' +
        hopRailHtml(p.id) +
        '<div class="vis__body">' +
          '<div class="vis__stage"><div class="vis__loading" id="vis-loading">' + esc(t('Ładuję podgląd strony…')) + '</div>' +
            '<iframe class="vis__frame" id="vis-frame" title="' + esc(t('Podgląd strony')) + '"></iframe></div>' +
          '<form class="vis__side" id="form-page">' + fmtCard() +
            '<div class="ed-card vis__help"><h2>' + esc(t('Jak edytować')) + '</h2><ol>' +
              '<li><b>' + esc(t('Kliknij tekst')) + '</b> ' + esc(t('na stronie obok i po prostu go popraw — po angielsku. Enter albo kliknięcie obok kończy.')) + '</li>' +
              '<li><b>' + esc(t('Szablon tekstu')) + '</b> — ' + esc(t('nagłówek, podnagłówek, treść albo treść mała. To te same cztery role, co na stronie.')) + '</li>' +
              '<li><b>' + esc(t('Akapit i opis')) + '</b> — ' + esc(t('„Dodaj poniżej” wstawia nowy blok, „Kopiuj” robi kopię do podmiany treści, „Usuń” kasuje. Opis pod tytułem też: kliknij nagłówek, żeby go dodać, albo sam opis, żeby skasować.')) + '</li>' +
              '<li><b>' + esc(t('Zdjęcie')) + '</b> — ' + esc(t('kliknij, przeciągnij i kółkiem przybliż. Nowe wklejasz albo wybierasz w panelu obok.')) + '</li>' +
              '<li><b>' + esc(t('Formularz i stopka')) + '</b> — ' + esc(t('też są do kliknięcia; zmiana wchodzi na wszystkie strony.')) + '</li>' +
              '<li>' + esc(t('Na końcu')) + ' <b>' + esc(t('Zapisz')) + '</b> — ' + esc(t('ukraińska wersja strony zrobi się sama i od razu wejdzie na witrynę. Potem „Zobacz na stronie”.')) + '</li>' +
            '</ol>' +
            '<label class="vis__toggle"><input type="checkbox" id="vis-outline" checked> ' + esc(t('Podświetl wszystko, co da się zmienić')) + '</label></div>' +
            '<div class="ed-card vis__block" id="vis-toc-card"><h2>' + esc(t('Części tej strony')) + '</h2><p class="hint">' + esc(t('Kliknij, żeby przewinąć do wybranej części.')) + '</p><div class="vis__toc" id="vis-toc"></div></div>' +
            structuredCards(p, m) +
            '<div class="vis__foot"><button class="btn" type="submit">' + esc(t('Zapisz')) + '</button>' +
            '<button class="btn btn-ghost" type="button" id="btn-reset-page">' + esc(t('Cofnij niezapisane zmiany')) + '</button>' +
            (isProductPage(p) ? '<button class="btn btn-ghost btn-danger" type="button" id="btn-del-page-foot">' + esc(t('Usuń tę stronę')) + '</button>' : '') +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';
      el.innerHTML = html;
      el.querySelector('.vis__title').textContent = plLabel(pageName);
      hydrateNames([el.querySelector('.vis__title')]);
      document.getElementById('top-section').textContent = t('Edycja') + ': ' + plLabel(pageName);
      bindVisual(el, p, prev.html, opts);
    });
  }

  function bindVisual(el, p, previewHtml, opts) {
    var form = el.querySelector('#form-page');
    var frame = el.querySelector('#vis-frame');
    var loading = el.querySelector('#vis-loading');
    var countEl = el.querySelector('#vis-count');
    var machBox = el.querySelector('#mach');
    var faqBox = el.querySelector('#faq');
    var st = {
      orig: {}, snap: {}, snapStyle: {}, dict: {}, changed: {}, images: {}, crops: {}, deleted: {}, blockSeq: 0, blocksDirty: false,
      cropImg: null, crop: null, cropIdx: -1, editing: null, doc: null, win: null,
      busy: false, newSeq: 0, fmtBusy: false, fmtBlock: null, fmtRange: null, typeColorSpan: null, holdColor: '', colorWrap: null, machDirty: false, structDirty: false, modelsDirty: false, filmsDirty: false
    };

    /* ---- keys of editable text nodes: page copy "12", new card texts "n1:t", shared blocks "form:3" ---- */
    function keyOf(node) {
      if (!node || !node.hasAttribute) return null;
      if (node.hasAttribute('data-cms-copy')) return node.getAttribute('data-cms-copy');
      if (node.hasAttribute('data-cms-shared')) return node.getAttribute('data-cms-shared');
      if (node.hasAttribute('data-cms-new')) return 'new:' + node.getAttribute('data-cms-new');
      return null;
    }
    function nodeByKey(key) {
      if (!st.doc || key == null) return null;
      key = String(key);
      if (key.indexOf('new:') === 0) return st.doc.querySelector('[data-cms-new="' + key.slice(4) + '"]');
      return st.doc.querySelector('[data-cms-copy="' + key + '"],[data-cms-shared="' + key + '"]');
    }
    function rememberSnap(node, key) {
      key = key != null ? key : keyOf(node);
      if (!node || key == null) return;
      st.snap[key] = node.innerHTML;
      st.snapStyle[key] = node.getAttribute('style') || '';
    }
    function markupChanged(node, key) {
      return normTxt(node.innerHTML) !== normTxt(st.snap[key] || '')
        || String(node.getAttribute('style') || '') !== String(st.snapStyle[key] || '');
    }
    function itemOf(node) {
      if (!node || !node.hasAttribute) return {};
      if (node.hasAttribute('data-cms-kind')) return { kind: node.getAttribute('data-cms-kind'), label: node.getAttribute('data-cms-label') || '' };
      if (node.hasAttribute('data-cms-copy')) return (p.copy || [])[+node.getAttribute('data-cms-copy')] || {};
      if (node.hasAttribute('data-cms-shared')) {
        var sp = node.getAttribute('data-cms-shared').split(':');
        return ((p.shared || {})[sp[0]] || [])[+sp[1]] || {};
      }
      return {};
    }
    function kindOf(node) { return itemOf(node).kind || ''; }
    function isShared(node) { return !!(node && node.hasAttribute && node.hasAttribute('data-cms-shared')); }

    /* ---- product cards (mach) ---- */
    function machArticle(key) { return st.doc ? st.doc.querySelector('[data-cms-mach="' + key + '"]') : null; }
    function machRowOf(key) { return machBox ? machBox.querySelector('.repeat__i[data-mach-key="' + key + '"]') : null; }
    function ensureMachList() {
      var list = st.doc.querySelector('.mach-list');
      if (list) return list;
      var doc = st.doc;
      var sec = doc.createElement('section');
      sec.className = 'sec sec-paper';
      sec.id = 'produkty';
      sec.innerHTML = '<div class="wrap"><div class="sec-head sec-head-wide rv"><p class="eyebrow">Products</p><h2 class="h-lg">Our products</h2>' +
        '<p class="lead">Choose a configuration and ask for an offer — we will match a solution to your part.</p></div><div class="mach-list"></div></div>';
      var anchor = doc.querySelector('#zapyt') || doc.querySelector('footer.ftr');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor); else doc.body.appendChild(sec);
      return sec.querySelector('.mach-list');
    }
    function renumberMach() {
      if (!st.doc) return;
      var arts = st.doc.querySelectorAll('[data-cms-mach]');
      Array.prototype.forEach.call(arts, function (a, i) {
        var n = a.querySelector('.mach__idx');
        if (n) n.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        a.classList.remove('rv-d1', 'rv-d2');
        if (i % 3 === 1) a.classList.add('rv-d1');
        if (i % 3 === 2) a.classList.add('rv-d2');
      });
      var nEl = el.querySelector('#mach-n');
      if (nEl) nEl.textContent = String(arts.length);
      if (!machBox) return;
      Array.prototype.forEach.call(machBox.querySelectorAll('.repeat__i'), function (row, i) {
        var nm = row.querySelector('.item-card__name');
        var art = machArticle(row.getAttribute('data-mach-key'));
        var h3 = art && art.querySelector('h3');
        if (!nm) return;
        if (h3 && normTxt(h3.textContent)) nm.textContent = normTxt(h3.textContent);
        else if (!normTxt(nm.textContent)) nm.textContent = t('Produkt') + ' ' + (i + 1);
      });
    }
    function setMachMedia(key, media) {
      var art = machArticle(key);
      if (!art) return;
      var film = art.querySelector('.mach__film');
      if (!film) {
        film = st.doc.createElement('div');
        var h3 = art.querySelector('h3');
        var side = art.querySelector('.mach__side') || art;
        side.insertBefore(film, h3 ? h3.nextSibling : side.firstChild);
      }
      film.className = 'mach__film';
      film.removeAttribute('data-cms-mach-media');
      film.removeAttribute('aria-hidden');
      film.textContent = '';
      if (media.video) {
        var btn = st.doc.createElement('button');
        btn.className = 'yt';
        btn.type = 'button';
        btn.setAttribute('data-vid', media.video);
        var im = st.doc.createElement('img');
        im.src = ytSrc(media.video);
        im.alt = '';
        im.width = 640;
        im.height = 360;
        im.onerror = function () { im.onerror = null; im.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(media.video) + '/hqdefault.jpg'; };
        btn.appendChild(im);
        var tpl = st.doc.querySelector('.yt__play');
        if (tpl) btn.appendChild(tpl.cloneNode(true));
        film.appendChild(btn);
      } else if (media.image) {
        film.classList.add('mach__film--img');
        var pic = st.doc.createElement('img');
        pic.className = 'mach__pic';
        pic.src = media.image;
        pic.alt = '';
        pic.width = 640;
        pic.height = 360;
        film.appendChild(pic);
      } else {
        film.classList.add('mach__film--empty');
        film.setAttribute('data-cms-mach-media', key);
        film.textContent = t('Brak filmu ani zdjęcia — kliknij tutaj, żeby wybrać zdjęcie, albo wklej link YouTube w panelu obok.');
      }
      var row = machRowOf(key);
      if (row) {
        var th = row.querySelector('.item-thumb');
        var src = media.video ? ytSrc(media.video) : (media.image || '');
        if (th) {
          if (src && th.tagName === 'IMG') { th.src = src; th.style.visibility = ''; }
          else if (src) { var ni = document.createElement('img'); ni.className = 'item-thumb'; ni.src = src; ni.alt = ''; th.parentNode.replaceChild(ni, th); }
          else if (th.tagName === 'IMG') { var off = document.createElement('div'); off.className = 'item-thumb item-thumb--off'; th.parentNode.replaceChild(off, th); }
        }
      }
      st.machDirty = true;
      updateCount();
    }
    function pickMachImage(key) {
      uploadFile(function (url) {
        var row = machRowOf(key);
        if (row) {
          var imgIn = row.querySelector('input[name^="m-image-"]');
          if (imgIn) imgIn.value = url;
          var v = row.querySelector('input[name^="m-video-"]');
          if (v) v.value = '';
        }
        setMachMedia(key, { image: url });
        flash(t('Zdjęcie wstawione do kafelka. Zapisz, żeby weszło na stronę.'));
      });
    }
    function wireMachRows() {
      if (!machBox) return;
      Array.prototype.forEach.call(machBox.querySelectorAll('.repeat__i'), function (row) {
        if (row._wired) return;
        row._wired = true;
        var key = row.getAttribute('data-mach-key');
        var del = row.querySelector('.js-del');
        if (del) del.onclick = function () {
          if (!confirm(t('Usunąć ten produkt ze strony?'))) return;
          var art = machArticle(key);
          if (art) art.remove();
          row.remove();
          st.machDirty = true;
          st.structDirty = true;
          renumberMach();
          updateCount();
        };
        function move(dir) {
          var sib = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
          if (!sib) return;
          if (dir < 0) machBox.insertBefore(row, sib); else machBox.insertBefore(sib, row);
          var art = machArticle(key);
          var sibArt = machArticle(sib.getAttribute('data-mach-key'));
          if (art && sibArt && art.parentNode) {
            if (dir < 0) art.parentNode.insertBefore(art, sibArt); else art.parentNode.insertBefore(sibArt, art);
            art.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          st.machDirty = true;
          renumberMach();
          updateCount();
        }
        var up = row.querySelector('.js-up');
        var down = row.querySelector('.js-down');
        if (up) up.onclick = function () { move(-1); };
        if (down) down.onclick = function () { move(1); };
        var vid = row.querySelector('input[name^="m-video-"]');
        if (vid) vid.addEventListener('input', function () {
          var id = parseYt(vid.value);
          var imgIn = row.querySelector('input[name^="m-image-"]');
          if (id) {
            if (imgIn) imgIn.value = '';
            setMachMedia(key, { video: id });
          } else if (!normTxt(vid.value)) {
            setMachMedia(key, { image: imgIn ? imgIn.value : '' });
          }
        });
        var pick = row.querySelector('.js-pick-img');
        if (pick) pick.onclick = function () { pickMachImage(key); };
        var clr = row.querySelector('.js-clear-img');
        if (clr) clr.onclick = function () {
          var imgIn = row.querySelector('input[name^="m-image-"]');
          if (imgIn) imgIn.value = '';
          var v = row.querySelector('input[name^="m-video-"]');
          setMachMedia(key, { video: v ? parseYt(v.value) : '' });
        };
        row.addEventListener('click', function (e) {
          if (e.target.closest('button, input, select, textarea, label')) return;
          var art = machArticle(key);
          if (art) art.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
    function addProduct() {
      if (!st.doc || !machBox) return;
      var list = ensureMachList();
      var key = 'n' + (++st.newSeq);
      var idx = machBox.querySelectorAll('.repeat__i').length;
      var art = st.doc.createElement('article');
      art.className = 'mach mach--clip mach--prod rv cms-new-card';
      art.id = 'produkt-' + Date.now().toString(36);
      art.setAttribute('data-cms-mach', key);
      art.setAttribute('data-ask-topic', '');
      art.innerHTML = '<div class="mach__side"><p class="mach__idx">00</p>' +
        '<h3 data-cms-copy="' + key + ':t" data-cms-kind="h3" data-cms-label="' + esc(t('Tytuł produktu')) + '">New product</h3>' +
        '<p class="mach__links"><a class="arrow-link" href="#zapyt">Ask about this configuration' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></p></div>' +
        '<div class="mach__text" data-cms-copy="' + key + ':d" data-cms-kind="rich" data-cms-label="' + esc(t('Opis produktu')) + '">' +
        '<p>Describe the product here: what it welds, power, tooling and options.</p></div>';
      list.appendChild(art);
      ['t', 'd'].forEach(function (s) {
        var k = key + ':' + s;
        var node = nodeByKey(k);
        st.orig[k] = [];
        rememberSnap(node, k);
        st.changed[k] = true;
        if (node) node.classList.add('cms-changed');
      });
      setMachMedia(key, {});
      machBox.insertAdjacentHTML('beforeend', machRow({ title: '', id: art.id, topic: '', video: '', html: '', image: '' }, key, idx));
      wireMachRows();
      st.structDirty = true;
      st.machDirty = true;
      renumberMach();
      updateCount();
      var det = machBox.closest('details');
      if (det) det.open = true;
      art.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var h3 = art.querySelector('h3');
      setTimeout(function () {
        if (!h3) return;
        startEdit(h3);
        try { st.win.getSelection().selectAllChildren(h3); } catch (e) { /* ignore */ }
      }, 450);
      flash(t('Nowy produkt dodany na dole listy. Wpisz tytuł, opis, wybierz film albo zdjęcie.'));
    }

    function setCountClass(node, prefix, n) {
      if (!node) return;
      node.className = String(node.className || '').replace(new RegExp('\\b' + prefix + '--\\d+\\b', 'g'), '').replace(/\s+/g, ' ').trim();
      if (n !== 3) node.classList.add(prefix + '--' + n);
    }
    function markNew(node, key, kind) {
      if (!node) return;
      node.setAttribute('data-cms-copy', key);
      node.setAttribute('data-cms-kind', kind || 'h3');
      st.orig[key] = [];
      rememberSnap(node, key);
      st.changed[key] = true;
      node.classList.add('cms-changed');
    }
    function addModel() {
      if (!st.doc) return;
      var root = st.doc.querySelector('[data-param-matrix]');
      if (!root) { flash(t('Na tej stronie nie ma tabeli modeli.')); return; }
      var strip = root.querySelector('.model-strip');
      var table = root.querySelector('.param-matrix__table');
      var matrix = root.querySelector('.param-matrix');
      var oldN = strip ? strip.querySelectorAll('.model-strip__btn').length : 0;
      if (!oldN) { flash(t('Nie znaleziono listy modeli do skopiowania.')); return; }
      var n = oldN + 1;
      var key = 'n' + (++st.newSeq);
      var lastLi = strip.querySelector('li:last-child');
      var li = lastLi.cloneNode(true);
      var btn = li.querySelector('.model-strip__btn');
      btn.classList.remove('is-active');
      btn.setAttribute('data-model', String(n));
      btn.setAttribute('aria-pressed', 'false');
      var name = li.querySelector('.model-strip__name');
      if (name) { name.textContent = 'New model'; markNew(name, key + ':n', 'h3'); }
      var shot = li.querySelector('.model-strip__shot');
      if (shot) {
        shot.className = 'model-strip__shot model-strip__shot--empty';
        shot.innerHTML = '';
        shot.textContent = t('Kliknij, aby dodać zdjęcie');
        shot.setAttribute('data-cms-model-media', key);
      }
      strip.appendChild(li);
      if (strip.classList.contains('model-strip--shots')) {
        strip.style.setProperty('--ms-cols', String(n));
        setCountClass(strip, 'model-strip', n);
      }
      if (table) {
        var heads = table.querySelectorAll('.param-matrix__head[data-col]');
        var lastHead = heads[heads.length - 1];
        if (lastHead) {
          var h = lastHead.cloneNode(true);
          h.setAttribute('data-col', String(n));
          h.textContent = 'New model';
          markNew(h, key + ':h', 'h3');
          lastHead.parentNode.insertBefore(h, lastHead.nextSibling);
        }
        var lastVals = table.querySelectorAll('.param-matrix__val[data-col="' + oldN + '"]');
        Array.prototype.forEach.call(lastVals, function (lastVal, rowi) {
          var cell = lastVal.cloneNode(true);
          cell.setAttribute('data-col', String(n));
          cell.innerHTML = '—';
          markNew(cell, key + ':c' + rowi, 'cell');
          lastVal.parentNode.insertBefore(cell, lastVal.nextSibling);
        });
      }
      if (matrix) {
        matrix.style.setProperty('--pm-cols', String(n));
        setCountClass(matrix, 'param-matrix', n);
      }
      var nEl = el.querySelector('#model-n');
      if (nEl) nEl.textContent = String(n);
      st.modelsDirty = true;
      updateCount();
      if (name) {
        name.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { startEdit(name); }, 300);
      }
      flash(t('Dodano urządzenie. Wpisz nazwę i parametry w nowej kolumnie tabeli.'));
      decorateModels();
      refreshModelList();
    }
    function modelBtns() {
      return st.doc ? st.doc.querySelectorAll('[data-param-matrix] .model-strip__btn') : [];
    }
    function convertModelStrip() {
      if (!st.doc) return;
      Array.prototype.forEach.call(st.doc.querySelectorAll('.model-strip__btn'), function (btn) {
        if (btn.tagName !== 'BUTTON') return;
        var div = st.doc.createElement('div');
        div.className = btn.className;
        Array.prototype.forEach.call(btn.attributes, function (a) {
          if (a.name === 'type') return;
          div.setAttribute(a.name, a.value);
        });
        div.setAttribute('role', 'button');
        while (btn.firstChild) div.appendChild(btn.firstChild);
        btn.parentNode.replaceChild(div, btn);
      });
    }
    function decorateModels() {
      if (!st.doc) return;
      convertModelStrip();
      Array.prototype.forEach.call(modelBtns(), function (btn) {
        var name = btn.querySelector('.model-strip__name');
        if (name) {
          name.setAttribute('data-cms-kind', 'h3');
          name.setAttribute('data-cms-label', t('Numer modelu'));
        }
        if (!btn.querySelector('.cms-col-del')) {
          var del = st.doc.createElement('button');
          del.type = 'button';
          del.className = 'cms-col-del';
          del.setAttribute('aria-label', t('Usuń kolumnę'));
          btn.appendChild(del);
        }
      });
      Array.prototype.forEach.call(st.doc.querySelectorAll('.param-matrix__head[data-col]'), function (h) {
        h.setAttribute('data-cms-kind', 'h3');
        h.setAttribute('data-cms-label', t('Numer modelu'));
        if (!h.querySelector('.cms-col-del')) {
          var delh = st.doc.createElement('button');
          delh.type = 'button';
          delh.className = 'cms-col-del';
          delh.setAttribute('aria-label', t('Usuń kolumnę'));
          h.appendChild(delh);
        }
      });
      st.doc.querySelectorAll('.param-matrix__head[data-col], .model-strip__name').forEach(function (node) {
        rememberSnap(node);
      });
    }
    function refreshModelList() {
      var box = el.querySelector('#model-list');
      if (!box) return;
      var btns = modelBtns();
      var html = '';
      Array.prototype.forEach.call(btns, function (btn, i) {
        var name = btn.querySelector('.model-strip__name');
        var label = name ? normTxt(name.textContent) : (t('Model') + ' ' + (i + 1));
        html += '<div class="repeat__i" data-col="' + (i + 1) + '"><div class="repeat__top"><span>' + esc(label) + '</span>' +
          '<button type="button" class="icon-btn danger js-del-model" data-col="' + (i + 1) + '">' + esc(t('Usuń')) + '</button></div></div>';
      });
      box.innerHTML = html;
      box.querySelectorAll('.js-del-model').forEach(function (b) {
        b.addEventListener('click', function () { removeModelCol(b.getAttribute('data-col')); });
      });
      var nEl = el.querySelector('#model-n');
      if (nEl) nEl.textContent = String(btns.length);
    }
    function headPlain(node) {
      if (!node) return '';
      var clone = node.cloneNode(true);
      clone.querySelectorAll('.cms-col-del').forEach(function (d) { d.remove(); });
      return normTxt(clone.textContent);
    }
    function setHeadLabel(head, text) {
      if (!head) return;
      var del = head.querySelector('.cms-col-del');
      head.textContent = text;
      if (del) head.appendChild(del);
      else decorateModels();
    }
    function syncModelName(col, text) {
      col = String(col);
      var btn = st.doc.querySelector('.model-strip__btn[data-model="' + col + '"]');
      var name = btn && btn.querySelector('.model-strip__name');
      if (name && normTxt(name.textContent) !== normTxt(text)) name.textContent = text;
      var head = st.doc.querySelector('.param-matrix__head[data-col="' + col + '"]');
      if (head && headPlain(head) !== normTxt(text)) setHeadLabel(head, text);
    }
    function renumberModels() {
      var root = st.doc && st.doc.querySelector('[data-param-matrix]');
      if (!root) return;
      var strip = root.querySelector('.model-strip');
      var matrix = root.querySelector('.param-matrix');
      var table = root.querySelector('.param-matrix__table');
      var btns = strip ? strip.querySelectorAll('.model-strip__btn') : [];
      var n = btns.length;
      Array.prototype.forEach.call(btns, function (btn, i) {
        var col = String(i + 1);
        btn.setAttribute('data-model', col);
        btn.classList.toggle('is-active', i === 0);
        btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      });
      if (table) {
        var heads = table.querySelectorAll('.param-matrix__head[data-col]');
        Array.prototype.forEach.call(heads, function (h, i) { h.setAttribute('data-col', String(i + 1)); });
        var rowVals = [];
        Array.prototype.forEach.call(table.children, function (cell) {
          if (cell.classList.contains('param-matrix__head')) return;
          if (cell.classList.contains('param-matrix__label')) { rowVals.push([]); return; }
          if (cell.classList.contains('param-matrix__val') && rowVals.length) rowVals[rowVals.length - 1].push(cell);
        });
        rowVals.forEach(function (cells) {
          cells.forEach(function (c, i) { c.setAttribute('data-col', String(i + 1)); });
        });
      }
      if (strip && strip.classList.contains('model-strip--shots')) {
        strip.style.setProperty('--ms-cols', String(n));
        setCountClass(strip, 'model-strip', n);
      }
      if (matrix) {
        matrix.style.setProperty('--pm-cols', String(n));
        setCountClass(matrix, 'param-matrix', n);
        matrix.className = String(matrix.className || '').replace(/\bis-hl-\d+\b/g, '').replace(/\s+/g, ' ').trim();
        matrix.classList.add('is-hl-1');
      }
    }
    function removeModelCol(n) {
      n = parseInt(n, 10) || 0;
      if (!st.doc || n < 1) return;
      var btns = modelBtns();
      if (btns.length < 2) { flash(t('Musi zostać przynajmniej jeden model.')); return; }
      if (!confirm(t('Usunąć ten model i jego kolumnę z tabeli?'))) return;
      if (st.editing) commit(st.editing);
      var btn = st.doc.querySelector('.model-strip__btn[data-model="' + n + '"]');
      var li = btn && btn.closest('li');
      if (li) li.remove();
      var table = st.doc.querySelector('.param-matrix__table');
      if (table) table.querySelectorAll('[data-col="' + n + '"]').forEach(function (c) { c.remove(); });
      renumberModels();
      decorateModels();
      st.modelsDirty = true;
      updateCount();
      refreshModelList();
      flash(t('Usunięto kolumnę.'));
    }
    function wireFilmRows() {
      var box = el.querySelector('#films');
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('.repeat__i'), function (row) {
        if (row._wired) return;
        row._wired = true;
        var inp = row.querySelector('input[name^="film-v-"]');
        if (!inp) return;
        inp.addEventListener('input', function () {
          var arts = st.doc ? st.doc.querySelectorAll('[data-cms-film], .film-rail__i') : [];
          var idx = Array.prototype.indexOf.call(box.querySelectorAll('.repeat__i'), row);
          var art = arts[idx];
          if (!art) return;
          var id = parseYt(inp.value);
          var media = art.querySelector('.yt, .film-rail__empty');
          if (id) {
            var btn = st.doc.createElement('button');
            btn.className = 'yt';
            btn.type = 'button';
            btn.setAttribute('data-vid', id);
            var im = st.doc.createElement('img');
            im.src = ytSrc(id);
            im.alt = '';
            im.width = 480; im.height = 360;
            btn.appendChild(im);
            if (media) media.parentNode.replaceChild(btn, media); else art.insertBefore(btn, art.firstChild);
          }
          st.filmsDirty = true;
          updateCount();
        });
      });
    }
    function addFilm() {
      if (!st.doc) return;
      var rail = st.doc.querySelector('.film-rail');
      if (!rail) { flash(t('Na tej stronie nie ma sekcji filmów instruktażowych.')); return; }
      var last = rail.querySelector('.film-rail__i:last-child');
      var key = 'n' + (++st.newSeq);
      var art = last ? last.cloneNode(true) : st.doc.createElement('article');
      art.className = 'film-rail__i cms-new-card';
      art.setAttribute('data-cms-film', key);
      var oldMedia = art.querySelector('.yt, .film-rail__empty');
      var empty = st.doc.createElement('div');
      empty.className = 'film-rail__empty';
      empty.setAttribute('data-cms-film-media', key);
      empty.textContent = t('Wklej link YouTube w panelu obok');
      if (oldMedia) oldMedia.parentNode.replaceChild(empty, oldMedia);
      else art.insertBefore(empty, art.firstChild);
      var h3 = art.querySelector('h3');
      if (!h3) { h3 = st.doc.createElement('h3'); art.appendChild(h3); }
      h3.textContent = 'New instructional video';
      markNew(h3, key + ':t', 'h3');
      rail.appendChild(art);
      var n = rail.querySelectorAll('.film-rail__i').length;
      rail.style.setProperty('--film-cols', String(n));
      setCountClass(rail, 'film-rail', n);
      var box = el.querySelector('#films');
      if (box) {
        var idx = box.querySelectorAll('.repeat__i').length;
        box.insertAdjacentHTML('beforeend', '<div class="repeat__i" data-film-key="' + key + '">' +
          field(t('Film YouTube (wklej link albo ID)'), 'film-v-' + idx, '', { skipI18n: true }) + '</div>');
        wireFilmRows();
      }
      var nEl = el.querySelector('#film-n');
      if (nEl) nEl.textContent = String(n);
      st.filmsDirty = true;
      updateCount();
      art.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { startEdit(h3); }, 300);
      flash(t('Dodano miejsce na film. Wpisz tytuł i wklej link YouTube.'));
    }
    function addChildType() {
      var title = val(form, 'new-tile-title');
      if (!normTxt(title)) { flash(t('Wpisz nazwę nowego rodzaju — po angielsku.')); return; }
      if (hasChanges() && !confirm(t('Niezapisane zmiany na tej stronie nie wejdą w nowy kafelek. Kontynuować?'))) return;
      var btn = el.querySelector('#btn-add-tile');
      if (btn) btn.disabled = true;
      flash(t('Kopiuję szablon podstrony i dodaję kafelek…'));
      api({
        action: 'cms.page.add-child',
        parent: p.id,
        title: title,
        tag: val(form, 'new-tile-tag'),
        text: val(form, 'new-tile-text')
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res.ok) { flash(res.error || t('Nie utworzono strony.')); return; }
        flash(t('Utworzono nową podstronę w panelu. Żeby weszła na witrynę, kliknij „Zatwierdź na witrynie”.'));
        pageCache = null;
        openEditor(res.id, { trail: 'push' });
      }).catch(function () {
        if (btn) btn.disabled = false;
        flash(t('Błąd połączenia — nie utworzono strony.'));
      });
    }

    function rebindDel(box) {
      if (!box) return;
      box.querySelectorAll('.js-del').forEach(function (btn) {
        btn.onclick = function () { btn.closest('.repeat__i').remove(); st.structDirty = true; updateCount(); };
      });
    }
    rebindDel(faqBox);
    wireMachRows();
    var addM = el.querySelector('#btn-add-mach');
    if (addM) addM.addEventListener('click', addProduct);
    var addModelBtn = el.querySelector('#btn-add-model');
    if (addModelBtn) addModelBtn.addEventListener('click', addModel);
    var addFilmBtn = el.querySelector('#btn-add-film');
    if (addFilmBtn) addFilmBtn.addEventListener('click', addFilm);
    var addTileBtn = el.querySelector('#btn-add-tile');
    if (addTileBtn) addTileBtn.addEventListener('click', addChildType);
    wireFilmRows();
    var addF = el.querySelector('#btn-add-faq');
    if (addF) addF.addEventListener('click', function () {
      faqBox.insertAdjacentHTML('beforeend', faqRow({ q: '', a: '' }, faqBox.children.length));
      rebindDel(faqBox);
      st.structDirty = true;
      updateCount();
      var last = faqBox.lastElementChild;
      if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); var f = last.querySelector('input'); if (f) f.focus({ preventScroll: true }); }
    });
    form.addEventListener('input', function (e) {
      if (e.target && e.target.closest && (e.target.closest('#fmt-card') || e.target.closest('#tile-wrap'))) return;
      st.structDirty = true;
      updateCount();
    });
    el.querySelector('#btn-back-pages').addEventListener('click', function () {
      if (hasChanges() && !confirm(t('Masz niezapisane zmiany. Wyjść bez zapisywania?'))) return;
      setView('pages');
    });
    el.querySelectorAll('[data-hop]').forEach(function (btn) {
      btn.addEventListener('click', function () { hopTo(btn.getAttribute('data-hop')); });
    });
    var hopOn = el.querySelector('.vis__hop-i.is-on');
    if (hopOn && hopOn.scrollIntoView) hopOn.scrollIntoView({ inline: 'center', block: 'nearest' });
    el.querySelector('#btn-reset-page').addEventListener('click', function () {
      if (!hasChanges()) { flash(t('Nie ma czego cofać.')); return; }
      if (!confirm(t('Cofnąć wszystkie niezapisane zmiany na tej stronie?'))) return;
      openEditor(p.id, { scrollY: st.win ? st.win.scrollY : 0, trail: 'keep' });
    });
    var delPage = el.querySelector('#btn-del-page');
    var delFoot = el.querySelector('#btn-del-page-foot');
    function askDeletePage() {
      deleteProductPage(p.id, plLabel(p.name || p.title), { hasChildren: !pageCanDelete(p) });
    }
    if (delPage) delPage.addEventListener('click', askDeletePage);
    if (delFoot) delFoot.addEventListener('click', askDeletePage);
    el.querySelector('#vis-outline').addEventListener('change', function (e) {
      if (st.doc) st.doc.documentElement.classList.toggle('cms-show-all', e.target.checked);
    });
    el.querySelector('#btn-save-page').addEventListener('click', save);
    form.addEventListener('submit', function (e) { e.preventDefault(); save(); });
    el.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        var seq = hopSequence();
        if (seq.length < 2) return;
        var at = seq.length - 1;
        if (e.key === 'ArrowLeft' && at > 0) hopTo(seq[at - 1].id);
      }
    });
    el.addEventListener('paste', function (e) {
      if (st.editing) return;
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var pi = 0; pi < items.length; pi++) {
        if (String(items[pi].type || '').indexOf('image/') === 0) {
          var file = items[pi].getAsFile();
          if (file) { e.preventDefault(); sendFile(file, applyHeroUrl); return; }
        }
      }
    });
    var heroPick = el.querySelector('#btn-hero-pick');
    if (heroPick) heroPick.addEventListener('click', function () { uploadFile(applyHeroUrl); });
    var heroReset = el.querySelector('#btn-hero-reset');
    if (heroReset) heroReset.addEventListener('click', function () {
      if (!st.cropImg) armCrop(firstCropTarget());
      setCrop({ x: 50, y: 50, z: 1 }, true);
    });
    var heroZoom = el.querySelector('#hero-zoom');
    if (heroZoom) heroZoom.addEventListener('input', function () {
      if (!st.cropImg) armCrop(firstCropTarget());
      if (!st.crop) return;
      setCrop({ x: st.crop.x, y: st.crop.y, z: (+heroZoom.value) / 100 }, true);
    });

    function hasChanges() {
      return Object.keys(st.changed).length > 0 || Object.keys(st.images).length > 0 || Object.keys(st.crops).length > 0 || !!st.structDirty || !!st.machDirty || !!st.modelsDirty || !!st.filmsDirty || !!st.blocksDirty;
    }

    function hopTo(id) {
      if (!id || id === p.id) return;
      if (hasChanges() && !confirm(t('Masz niezapisane zmiany. Przejść do innej strony bez zapisywania?'))) return;
      openEditor(id, { trail: 'push' });
    }

    // FAQ card headings in the side column follow the question field.
    function refreshRowHeads() {
      el.querySelectorAll('#faq .repeat__i').forEach(function (row) {
        var head = row.querySelector('.repeat__top span');
        var src = row.querySelector('input[name^="f-q-"]');
        if (!head || !src) return;
        var v = normTxt(src.value);
        if (looksUk(v)) v = st.dict[v] || enLabel(v);
        if (v) head.textContent = v;
      });
    }
    form.addEventListener('input', function (e) {
      var n = e.target && e.target.name || '';
      if (/^f-q-/.test(n)) refreshRowHeads();
    });
    hydrateEdit(form, refreshRowHeads);

    function updateCount() {
      var n = Object.keys(st.changed).length;
      var im = Object.keys(st.images).length;
      var parts = [];
      if (n) parts.push(n === 1 ? t('1 tekst') : n + ' ' + (n < 5 ? t('teksty') : t('tekstów')));
      if (im) parts.push(im === 1 ? t('1 zdjęcie') : im + ' ' + (im < 5 ? t('zdjęcia') : t('zdjęć')));
      var cr = Object.keys(st.crops).length;
      if (cr && !im) parts.push(t('kadr zdjęcia'));
      if (st.machDirty) parts.push(t('produkty'));
      if (st.modelsDirty) parts.push(t('tabela modeli'));
      if (st.filmsDirty) parts.push(t('filmy'));
      if (Object.keys(st.deleted).length) parts.push(t('usunięte pola'));
      if (st.structDirty && !st.machDirty) parts.push(t('pola obok'));
      countEl.textContent = parts.length ? t('Zmieniono') + ': ' + parts.join(', ') : t('Brak zmian');
      countEl.classList.toggle('is-dirty', parts.length > 0);
    }

    function tipHtml(node) {
      var idx;
      if (node.hasAttribute('data-cms-copy') || node.hasAttribute('data-cms-shared')) {
        var c = itemOf(node);
        var lab = c.label || t('Tekst');
        var extra = isShared(node) ? ' · ' + esc(t('wspólne dla całej witryny')) : '';
        return '<b>' + esc(lab) + '</b>' + extra + ' · ' + esc(t('kliknij, aby zmienić tekst'));
      }
      if (node.hasAttribute('data-cms-img')) {
        idx = +node.getAttribute('data-cms-img');
        var im = (p.images || [])[idx] || {};
        var cap = im.caption || '';
        if (looksUk(cap)) cap = st.dict[normTxt(cap)] || cap;
        return '<b>' + esc(photoLabel({ kind: im.kind, caption: cap }, idx)) + '</b> · ' +
          esc(t('przeciągnij i przybliż — albo wklej / wybierz nowe zdjęcie'));
      }
      if (node.hasAttribute('data-cms-mach')) return '<b>' + esc(t('Produkt')) + '</b> · ' + esc(t('tytuł i opis: kliknij tekst · film/zdjęcie: kliknij, aby otworzyć w panelu obok'));
      if (node.hasAttribute('data-cms-faq')) return '<b>' + esc(t('Pytanie i odpowiedź')) + '</b> · ' + esc(t('kliknij, aby edytować w panelu obok'));
      if (node.hasAttribute('data-cms-person')) return '<b>' + esc(t('Osoba do kontaktu')) + '</b> · ' + esc(t('kliknij, aby edytować w panelu obok'));
      return '';
    }

    function focusAside(kind, idx) {
      var box = el.querySelector(kind === 'mach' ? '#mach' : kind === 'faq' ? '#faq' : '#people');
      if (!box) return;
      var det = box.closest('details');
      if (det) det.open = true;
      var row = kind === 'mach' ? machRowOf(idx) : box.querySelectorAll('.repeat__i')[+idx];
      if (!row) return;
      el.querySelectorAll('.is-focus').forEach(function (r) { r.classList.remove('is-focus'); });
      row.classList.add('is-focus');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var first = row.querySelector('input:not([type="hidden"]):not([readonly]),textarea');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    }

    /* ---- add / copy / remove text blocks (paragraphs, leads, list points) ---- */
    function cmsClassOf(node) {
      return String(node.getAttribute('class') || '').split(/\s+/).filter(function (c) {
        return c && c.indexOf('cms-') !== 0;
      }).join(' ');
    }
    function blockOk(node) {
      if (!node || !node.closest || isShared(node)) return false;
      if (node.closest(CHROME_SEL) || node.closest('[data-cms-mach],[data-cms-faq],[data-cms-person]')) return false;
      return BLOCK_KINDS.indexOf(kindOf(node)) !== -1 && /^(LI|P)$/.test(node.tagName);
    }
    function insertAfterOk(node) {
      if (blockOk(node)) return true;
      if (!node || !node.closest || isShared(node)) return false;
      if (node.closest(CHROME_SEL) || node.closest('[data-cms-mach],[data-cms-faq],[data-cms-person]')) return false;
      var k = kindOf(node);
      return (k === 'h2' || k === 'h3') && /^(H2|H3)$/.test(node.tagName);
    }
    function caretAtEnd(node) {
      try {
        var s = st.win.getSelection();
        if (!s || !s.rangeCount || !s.isCollapsed) return false;
        var r = st.doc.createRange();
        r.selectNodeContents(node);
        r.setStart(s.anchorNode, s.anchorOffset);
        return !normTxt(r.toString());
      } catch (e) { return false; }
    }
    function liveSiblings(node) {
      var n = 0;
      Array.prototype.forEach.call(node.parentNode ? node.parentNode.children : [], function (c) {
        if (c.tagName === node.tagName && !c.hasAttribute('data-cms-deleted')) n++;
      });
      return n;
    }
    function newBlockSpec(node) {
      var k = kindOf(node);
      if (k === 'li' || node.tagName === 'LI') {
        return { tag: 'li', cls: cmsClassOf(node), kind: 'li', placeholder: 'New point', after: node, label: itemOf(node).label || '' };
      }
      if (k === 'h2' || k === 'h3' || node.tagName === 'H2' || node.tagName === 'H3') {
        var inHead = !!(node.closest && node.closest('.sec-head'));
        var after = node;
        var n = node.nextElementSibling;
        while (n && n.tagName === 'P' && !n.hasAttribute('data-cms-deleted')) {
          after = n;
          n = n.nextElementSibling;
        }
        return {
          tag: 'p',
          cls: inHead ? 'lead' : '',
          kind: inHead ? 'lead' : 'p',
          placeholder: inHead ? 'New description' : 'New paragraph',
          after: after,
          label: inHead ? 'Opis pod tytułem' : 'Akapit'
        };
      }
      var kind = (k === 'lead' || k === 'hero__sub') ? k : 'p';
      return {
        tag: 'p',
        cls: cmsClassOf(node),
        kind: kind,
        placeholder: kind === 'p' ? 'New paragraph' : 'New description',
        after: node,
        label: itemOf(node).label || ''
      };
    }
    function addBlockAfter(node, opts) {
      opts = opts || {};
      if (!insertAfterOk(node)) return;
      if (st.editing) commit(st.editing);
      if (!node.isConnected) return;
      var spec = newBlockSpec(node);
      var after = spec.after && spec.after.isConnected ? spec.after : node;
      if (!after.parentNode) return;
      var nn = st.doc.createElement(spec.tag);
      if (spec.cls) nn.setAttribute('class', spec.cls);
      var id = 'b' + (++st.blockSeq);
      nn.setAttribute('data-cms-new', id);
      nn.setAttribute('data-cms-kind', spec.kind);
      nn.setAttribute('data-cms-label', spec.label || '');
      var copying = !!(opts.copy && blockOk(node) && /^(P|LI)$/.test(node.tagName));
      if (copying) {
        nn.innerHTML = node.innerHTML;
        nn.querySelectorAll('.cms-col-del, .cms-hop').forEach(function (d) { d.remove(); });
      } else {
        nn.textContent = spec.placeholder;
      }
      after.parentNode.insertBefore(nn, after.nextSibling);
      var key = 'new:' + id;
      st.orig[key] = [];
      st.changed[key] = true;
      nn.classList.add('cms-changed');
      st.blocksDirty = true;
      startEdit(nn);
      try {
        var r = st.doc.createRange();
        r.selectNodeContents(nn);
        var s = st.win.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      } catch (e) { /* ignore */ }
      updateCount();
      flash(copying
        ? t('Skopiowano — zmień treść i zapisz, żeby weszło na stronę.')
        : t('Dodano nowe pole — wpisz tekst. Zapisz, żeby weszło na stronę.'));
    }
    function copyBlock(node) {
      if (!blockOk(node)) return;
      addBlockAfter(node, { copy: true });
    }
    function removeBlock(node) {
      if (!blockOk(node)) return;
      if (node.tagName === 'LI' && liveSiblings(node) <= 1 && hasWords(node.textContent)) {
        flash(t('To jedyny punkt na tej liście — zmień jego tekst zamiast go usuwać.'));
        return;
      }
      var key = keyOf(node);
      if (st.editing === node) {
        node.onblur = null;
        node.removeAttribute('contenteditable');
        node.removeAttribute('spellcheck');
        node.classList.remove('cms-editing');
        st.editing = null;
        st.fmtBusy = false;
      }
      if (String(key).indexOf('new:') === 0) {
        delete st.orig[key];
        node.remove();
      } else {
        node.setAttribute('data-cms-deleted', '1');
        st.deleted[key] = true;
      }
      delete st.changed[key];
      st.blocksDirty = true;
      hideTip();
      updateCount();
      syncFmtUi();
      flash(t('Pole usunięte. Zapisz, żeby zniknęło ze strony.'));
    }

    /* ---- inline editing ---- */
    function startEdit(node) {
      if (st.editing === node) {
        try { node.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        snapshotFmtSel();
        syncFmtUi();
        return;
      }
      if (st.editing) commit(st.editing);
      st.editing = node;
      st.typeColorSpan = null;
      st.holdColor = '';
      st.colorWrap = null;
      st.fmtRange = null;
      node.classList.add('cms-editing');
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');
      node.onblur = function () {
        if (st.fmtBusy) return;
        clearTimeout(st._blurT);
        st._blurT = setTimeout(function () {
          if (st.fmtBusy || st.editing !== node) return;
          var ae = document.activeElement;
          if (ae && el.contains(ae)) return;
          commit(node);
        }, 0);
      };
      node.focus({ preventScroll: true });
      try {
        var s = st.win.getSelection();
        var inside = s && s.rangeCount && s.anchorNode && node.contains(s.anchorNode);
        if (!inside) {
          var r = st.doc.createRange();
          r.selectNodeContents(node);
          r.collapse(false);
          s.removeAllRanges();
          s.addRange(r);
        }
      } catch (e) { /* ignore */ }
      hideTip();
      snapshotFmtSel();
      syncFmtUi();
    }

    function commit(node) {
      if (!node) return;
      if (node.normalize) node.normalize();
      st.typeColorSpan = null;
      node.querySelectorAll && node.querySelectorAll('span[data-st-ink]').forEach(function (sp) {
        if (!normTxt(sp.textContent)) { if (sp.parentNode) sp.parentNode.removeChild(sp); return; }
        sp.removeAttribute('data-st-ink');
      });
      node.onblur = null;
      node.removeAttribute('contenteditable');
      node.removeAttribute('spellcheck');
      node.classList.remove('cms-editing');
      if (st.editing === node) st.editing = null;
      st.holdColor = '';
      st.fmtBusy = false;
      var key = keyOf(node);
      var recs = st.orig[key] || [];
      var now = textNodes(node).map(function (n) { return normTxt(n.nodeValue); }).join('\n');
      if (!hasWords(now) && (String(key).indexOf('new:') === 0 || (blockOk(node) && (liveSiblings(node) > 1 || !hasWords(st.snap[key] || ''))))) {
        if (String(key).indexOf('new:') === 0) {
          delete st.changed[key];
          delete st.orig[key];
          node.remove();
          updateCount();
          syncFmtUi();
          return;
        }
        removeBlock(node);
        return;
      }
      if (!hasWords(now)) {
        node.innerHTML = st.snap[key] || '';
        if (st.snapStyle[key] != null) {
          if (st.snapStyle[key]) node.setAttribute('style', st.snapStyle[key]);
          else node.removeAttribute('style');
        }
        node.classList.toggle('cms-changed', !!st.changed[key]);
        flash(BLOCK_KINDS.indexOf(kindOf(node)) !== -1
          ? t('Pole nie może być puste — przywrócono tekst. Żeby je usunąć, kliknij „Usuń pole” w panelu obok.')
          : t('Pole nie może być puste — przywrócono poprzedni tekst.'));
        syncFmtUi();
        return;
      }
      var was = recs.map(function (r) { return r.pl; }).join('\n');
      var changed = now !== was || markupChanged(node, key);
      if (!recs.length && st.orig[key]) changed = true; // brand-new card text: always saved
      node.classList.toggle('cms-changed', changed);
      if (changed) st.changed[key] = true; else delete st.changed[key];
      if (node.closest && node.closest('[data-cms-mach]') && node.tagName === 'H3') renumberMach();
      if (node.classList && node.classList.contains('model-strip__name')) {
        var btnN = node.closest('.model-strip__btn');
        var colN = btnN && btnN.getAttribute('data-model');
        if (colN) syncModelName(colN, normTxt(node.textContent));
        if (changed) { st.modelsDirty = true; refreshModelList(); }
      }
      if (node.classList && node.classList.contains('param-matrix__head') && node.hasAttribute('data-col')) {
        syncModelName(node.getAttribute('data-col'), headPlain(node));
        if (changed) { st.modelsDirty = true; refreshModelList(); }
      }
      updateCount();
      syncFmtUi();
    }

    /* ---- typography toolbar (side column) ---- */
    function markChanged(node) {
      var key = keyOf(node);
      if (key == null) return;
      st.changed[key] = true;
      node.classList.add('cms-changed');
      updateCount();
    }
    function rgbToHex(v) {
      v = String(v || '').trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
      if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      var m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (!m) return '#161616';
      return '#' + [m[1], m[2], m[3]].map(function (n) {
        return ('0' + Number(n).toString(16)).slice(-2);
      }).join('');
    }
    function snapshotFmtSel(opts) {
      st.fmtBlock = fmtBlockOf();
      try {
        var s = st.win && st.win.getSelection();
        if (!s || !s.rangeCount || !st.editing) return;
        var r = s.getRangeAt(0);
        var root = r.commonAncestorContainer;
        if (root.nodeType === 3) root = root.parentNode;
        if (!root || (root !== st.editing && !st.editing.contains(root))) return;
        if (r.collapsed) {
          if (opts && opts.allowCollapsed) st.fmtRange = r.cloneRange();
          return;
        }
        st.fmtRange = r.cloneRange();
      } catch (e) { /* ignore */ }
    }
    function restoreFmtSel() {
      var node = st.editing;
      if (!node || !st.win || !st.doc) return false;
      try { node.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      var s = st.win.getSelection();
      if (!s) return false;
      if (st.fmtRange) {
        try {
          s.removeAllRanges();
          s.addRange(st.fmtRange);
          return true;
        } catch (e2) { /* ignore */ }
      }
      return s.rangeCount > 0;
    }
    function caretIn(span) {
      var s = st.win.getSelection();
      if (!s || !span) return;
      var r = st.doc.createRange();
      if (!span.childNodes.length) span.appendChild(st.doc.createTextNode(''));
      r.selectNodeContents(span);
      r.collapse(false);
      s.removeAllRanges();
      s.addRange(r);
    }
    function applyTypingColor(color) {
      var s = st.win.getSelection();
      var range = (s && s.rangeCount) ? s.getRangeAt(0).cloneRange() : null;
      var span = st.typeColorSpan;
      if (span && span.isConnected && st.editing.contains(span)) {
        span.style.color = color;
        caretIn(span);
        return;
      }
      span = st.doc.createElement('span');
      span.setAttribute('data-st-ink', '1');
      span.style.color = color;
      if (range && st.editing.contains(range.commonAncestorContainer) || (range && range.commonAncestorContainer === st.editing)) {
        range.collapse(true);
        range.insertNode(span);
      } else {
        st.editing.appendChild(span);
      }
      caretIn(span);
      st.typeColorSpan = span;
    }
    function paintInnerColor(node, color) {
      if (!node) return;
      if (node.querySelectorAll) {
        node.querySelectorAll('.stats__v').forEach(function (el) { el.style.color = color; });
      }
      var kids = [];
      for (var i = 0; i < node.childNodes.length; i++) {
        var n = node.childNodes[i];
        if (n.nodeType === 3 && !/\S/.test(n.nodeValue || '')) continue;
        kids.push(n);
      }
      if (kids.length === 1 && kids[0].nodeType === 1 && String(kids[0].tagName || '').toLowerCase() === 'span') {
        kids[0].style.color = color;
        return;
      }
      var wrap = (node.ownerDocument || st.doc).createElement('span');
      wrap.style.color = color;
      while (node.firstChild) wrap.appendChild(node.firstChild);
      node.appendChild(wrap);
    }
    function setColorUi(color) {
      var card = el.querySelector('#fmt-card');
      var colorInp = card && card.querySelector('#fmt-color');
      var hex = rgbToHex(color);
      st.holdColor = hex;
      if (colorInp) colorInp.value = hex;
    }
    function stayInEdit() {
      var node = st.editing;
      if (!node) { st.fmtBusy = false; return; }
      try { node.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      restoreFmtSel();
      setTimeout(function () {
        st.fmtBusy = false;
        try { if (st.editing) st.editing.focus({ preventScroll: true }); } catch (e2) { /* ignore */ }
      }, 30);
    }
    function colorSpanOnly(el) {
      if (!el || el.nodeType !== 1) return false;
      if (String(el.tagName || '').toLowerCase() !== 'span') return false;
      var style = el.getAttribute('style') || '';
      if (!/color\s*:/i.test(style)) return false;
      var rest = style.replace(/(?:^|;)\s*color\s*:[^;]*/ig, '').replace(/^\s*;\s*|\s*;\s*$/g, '').trim();
      if (rest) return false;
      for (var i = 0; i < el.attributes.length; i++) {
        if (el.attributes[i].name !== 'style') return false;
      }
      return true;
    }
    function unwrapColorDeep(root) {
      if (!root || !root.querySelectorAll) return;
      var list = Array.prototype.slice.call(root.querySelectorAll('span'));
      for (var i = list.length - 1; i >= 0; i--) {
        var sp = list[i];
        if (!colorSpanOnly(sp) || !sp.parentNode) continue;
        while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
        sp.parentNode.removeChild(sp);
      }
    }
    function liftOutOfColorSpan(wrap) {
      var p = wrap.parentNode;
      while (p && colorSpanOnly(p) && normTxt(p.textContent) === normTxt(wrap.textContent)) {
        var gp = p.parentNode;
        if (!gp) break;
        gp.insertBefore(wrap, p);
        gp.removeChild(p);
        p = wrap.parentNode;
      }
    }
    function wrapRangeColor(range, color) {
      if (!range || range.collapsed || !st.doc) return null;
      try {
        var wrap = st.doc.createElement('span');
        wrap.style.color = color;
        wrap.appendChild(range.extractContents());
        unwrapColorDeep(wrap);
        range.insertNode(wrap);
        if (!normTxt(wrap.textContent)) {
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          return null;
        }
        liftOutOfColorSpan(wrap);
        if (st.editing) {
          Array.prototype.slice.call(st.editing.querySelectorAll('span')).forEach(function (sp) {
            if (colorSpanOnly(sp) && !normTxt(sp.textContent) && sp.parentNode) sp.parentNode.removeChild(sp);
          });
        }
        var nr = st.doc.createRange();
        nr.selectNodeContents(wrap);
        st.fmtRange = nr.cloneRange();
        try {
          var s = st.win.getSelection();
          if (s) { s.removeAllRanges(); s.addRange(nr); }
        } catch (e2) { /* ignore */ }
        return wrap;
      } catch (e) {
        return null;
      }
    }
    function applyForeColor(color, opts) {
      var node = st.editing;
      if (!node) { flash(t('Najpierw kliknij tekst na stronie obok.')); return; }
      opts = opts || {};
      st.fmtBusy = true;
      if (st.colorWrap && st.colorWrap.isConnected && node.contains(st.colorWrap)) {
        st.colorWrap.style.color = color;
        markChanged(node);
        setColorUi(color);
        if (!opts.keepPicker) stayInEdit();
        return;
      }
      var range = null;
      try {
        if (st.fmtRange && !st.fmtRange.collapsed) range = st.fmtRange.cloneRange();
      } catch (e) { range = null; }
      if (!range && !opts.keepPicker) {
        restoreFmtSel();
        try {
          var s = st.win.getSelection();
          if (s && s.rangeCount && !s.isCollapsed) range = s.getRangeAt(0).cloneRange();
        } catch (e2) { /* ignore */ }
      }
      var selected = !!(range && !range.collapsed && normTxt(range.toString()));
      st.typeColorSpan = null;
      if (selected) {
        var wrap = wrapRangeColor(range, color);
        if (wrap) st.colorWrap = wrap;
      } else if (!opts.keepPicker) {
        applyTypingColor(color);
      }
      markChanged(node);
      setColorUi(color);
      if (!opts.keepPicker) stayInEdit();
    }
    function fmtBlockOf() {
      var node = st.editing;
      if (!node) return null;
      var sel = st.win && st.win.getSelection ? st.win.getSelection() : null;
      var anchor = sel && sel.anchorNode;
      if (anchor && node.contains(anchor)) {
        var elx = anchor.nodeType === 1 ? anchor : anchor.parentNode;
        var blk = elx && elx.closest ? elx.closest('p,li,h1,h2,h3,h4,summary,dt,dd') : null;
        if (blk && node.contains(blk) && blk !== node) return blk;
      }
      return node;
    }
    function typeCss(role) {
      if (role === 'head') return { size: 'var(--t-head)', fam: 'var(--f-display)', weight: '800' };
      if (role === 'sub') return { size: 'var(--t-sub)', fam: 'var(--f-display)', weight: '800' };
      if (role === 'body') return { size: 'var(--t-body)', fam: 'var(--f-body)', weight: '400' };
      if (role === 'small') return { size: 'var(--t-small)', fam: 'var(--f-body)', weight: '500' };
      return null;
    }
    function readTypeRole(node) {
      if (!node || !node.getAttribute) return '';
      var role = node.getAttribute('data-st-type') || '';
      if (role) return role;
      var inner = node.querySelector && node.querySelector('[data-st-type]');
      if (inner) return inner.getAttribute('data-st-type') || '';
      var fs = String((node.style && node.style.fontSize) || '');
      if (fs.indexOf('--t-head') !== -1) return 'head';
      if (fs.indexOf('--t-sub') !== -1) return 'sub';
      if (fs.indexOf('--t-body') !== -1) return 'body';
      if (fs.indexOf('--t-small') !== -1) return 'small';
      return '';
    }
    function clearTypeRole(tg) {
      if (!tg) return;
      Array.prototype.slice.call(tg.querySelectorAll ? tg.querySelectorAll('span[data-st-type]') : []).forEach(function (sp) {
        while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp);
        sp.remove();
      });
      if (tg.removeAttribute) tg.removeAttribute('data-st-type');
      if (tg.style) {
        tg.style.fontSize = '';
        tg.style.fontFamily = '';
        tg.style.fontWeight = '';
        tg.style.lineHeight = '';
        tg.style.letterSpacing = '';
        if (!tg.getAttribute('style')) tg.removeAttribute('style');
      }
    }
    function applyTypeRole(role) {
      var node = st.editing;
      if (!node) { flash(t('Najpierw kliknij tekst na stronie obok.')); return; }
      var blk = st.fmtBlock && node.contains(st.fmtBlock) ? st.fmtBlock : fmtBlockOf();
      var targets = [];
      if (kindOf(node) === 'rich' && blk === node) targets = Array.prototype.slice.call(node.querySelectorAll('p,li'));
      if (!targets.length) targets = [blk || node];
      targets.forEach(function (tg) {
        clearTypeRole(tg);
        if (!role) return;
        var css = typeCss(role);
        if (!css) return;
        var isRoot = tg.hasAttribute('data-cms-copy') || tg.hasAttribute('data-cms-shared');
        if (isRoot) {
          var sp = st.doc.createElement('span');
          sp.setAttribute('data-st-type', role);
          sp.style.fontSize = css.size;
          sp.style.fontFamily = css.fam;
          sp.style.fontWeight = css.weight;
          while (tg.firstChild) sp.appendChild(tg.firstChild);
          tg.appendChild(sp);
        } else {
          tg.setAttribute('data-st-type', role);
          tg.style.fontSize = css.size;
          tg.style.fontFamily = css.fam;
          tg.style.fontWeight = css.weight;
        }
      });
      markChanged(node);
    }
    function listOk(node) {
      if (!node) return false;
      if (isShared(node)) return false;
      if (node.closest && (node.closest(CHROME_SEL) || node.closest('[data-cms-mach],[data-cms-faq],[data-cms-person]'))) return false;
      var k = kindOf(node);
      if (['h1', 'h2', 'h3', 'eyebrow', 'btn', 'link', 'tag', 'stats__l', 'stats__n', 'proof__l', 'proof__n', 'summary', 'hero__sub', 'cell', 'label'].indexOf(k) !== -1) return false;
      if (node.tagName === 'BUTTON' || (node.tagName === 'A' && k === 'btn')) return false;
      return k === 'rich' || k === 'p' || k === 'lead' || k === 'li' || node.tagName === 'P' || node.tagName === 'LI';
    }
    function listRoot(node) {
      if (!node) return null;
      if (kindOf(node) === 'rich') {
        var blk = fmtBlockOf() || node;
        var inner = blk.tagName === 'LI' ? blk : (blk.closest ? blk.closest('li') : null);
        if (inner && node.contains(inner) && inner.parentElement && /^(UL|OL)$/.test(inner.parentElement.tagName)) return inner.parentElement;
        return node.querySelector('ul, ol');
      }
      if (node.tagName === 'LI' && node.parentElement && /^(UL|OL)$/.test(node.parentElement.tagName)) return node.parentElement;
      return null;
    }
    function inList(node, tag) {
      var list = listRoot(node);
      return !!(list && (!tag || list.tagName === tag));
    }
    function splitListParts(node) {
      var html = String(node.innerHTML || '');
      var parts = html.split(/<br\s*\/?\s*>/i).map(function (s) {
        return String(s || '').replace(/^\s+|\s+$/g, '').replace(/^<div>/i, '').replace(/<\/div>$/i, '');
      }).filter(function (s) {
        return s && String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      });
      return parts.length ? parts : [html];
    }
    function copyCmsAttrs(from, to) {
      Array.prototype.forEach.call(from.attributes, function (a) {
        if (a.name === 'class' || a.name === 'style' || a.name === 'contenteditable' || a.name === 'spellcheck') return;
        if (a.name.indexOf('data-cms') === 0) to.setAttribute(a.name, a.value);
      });
    }
    function unwrapMadeList(list) {
      var parent = list.parentNode;
      if (!parent) return null;
      var first = null;
      Array.prototype.slice.call(list.children).forEach(function (li) {
        if (li.tagName !== 'LI' || li.hasAttribute('data-cms-deleted')) return;
        var p = st.doc.createElement('p');
        p.innerHTML = li.innerHTML;
        copyCmsAttrs(li, p);
        if (p.hasAttribute('data-cms-kind')) p.setAttribute('data-cms-kind', 'p');
        parent.insertBefore(p, list);
        if (!first) first = p;
      });
      list.remove();
      return first;
    }
    function listifyBlock(node, ordered) {
      var tag = ordered ? 'ol' : 'ul';
      var parts = splitListParts(node);
      var list = st.doc.createElement(tag);
      if (!ordered) list.className = 'ticks';
      list.setAttribute('data-cms-list', ordered ? 'ol' : 'ul');
      var firstLi = null;
      parts.forEach(function (part, i) {
        var li = st.doc.createElement('li');
        li.innerHTML = part;
        if (i === 0) {
          copyCmsAttrs(node, li);
          li.setAttribute('data-cms-kind', 'li');
          firstLi = li;
        } else {
          var id = 'b' + (++st.blockSeq);
          li.setAttribute('data-cms-new', id);
          li.setAttribute('data-cms-kind', 'li');
          st.orig['new:' + id] = [];
          st.changed['new:' + id] = true;
        }
        list.appendChild(li);
      });
      if (node.parentNode) node.parentNode.replaceChild(list, node);
      st.blocksDirty = true;
      if (st.editing === node) {
        node.onblur = null;
        st.editing = null;
      }
      if (firstLi) {
        startEdit(firstLi);
        markChanged(firstLi);
      }
      flash(parts.length > 1
        ? t('Zrobiona lista — każdy wiersz to osobny punkt.')
        : t('To pierwszy punkt. Enter na końcu dodaje kolejny.'));
      return firstLi;
    }
    function toggleList(ordered) {
      var node = st.editing;
      if (!node || !listOk(node)) {
        flash(t('Kliknij akapit albo punkt, który ma stać się listą.'));
        return;
      }
      if (kindOf(node) === 'rich') {
        try {
          st.doc.execCommand('styleWithCSS', false, false);
          st.doc.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false, null);
        } catch (e) { /* ignore */ }
        markChanged(node);
        return;
      }
      var list = listRoot(node);
      if (list && list.hasAttribute('data-cms-list')) {
        if ((ordered && list.tagName === 'OL') || (!ordered && list.tagName === 'UL')) {
          var p = unwrapMadeList(list);
          if (p) {
            startEdit(p);
            markChanged(p);
          }
          return;
        }
        var neu = st.doc.createElement(ordered ? 'ol' : 'ul');
        if (!ordered) neu.className = 'ticks';
        neu.setAttribute('data-cms-list', ordered ? 'ol' : 'ul');
        while (list.firstChild) neu.appendChild(list.firstChild);
        list.parentNode.replaceChild(neu, list);
        st.blocksDirty = true;
        if (st.editing) markChanged(st.editing);
        return;
      }
      if (list) {
        flash(t('To już jest lista. Użyj „Dodaj punkt poniżej”, żeby dopisać kolejny.'));
        return;
      }
      listifyBlock(node, ordered);
    }
    function syncFmtUi() {
      var card = el.querySelector('#fmt-card');
      if (!card) return;
      var roleSel = card.querySelector('#fmt-role');
      var hint = card.querySelector('#fmt-hint');
      var node = st.editing;
      var on = !!node;
      card.classList.toggle('is-on', on);
      card.querySelectorAll('select, button, input').forEach(function (b) { b.disabled = !on; });
      if (hint) {
        if (!on) hint.textContent = t('Kliknij napis na stronie obok. Zaznacz fragment, żeby zmienić kolor, pogrubienie albo wstawić link.');
        else if (kindOf(node) === 'h2' || kindOf(node) === 'h3') hint.textContent = t('Ten nagłówek zostaje. „Dodaj opis poniżej” wstawia tekst pod tytułem — tak jak w innych sekcjach.');
        else if (kindOf(node) === 'lead' || kindOf(node) === 'hero__sub') hint.textContent = t('To opis pod tytułem. Możesz go skasować, skopiować albo dodać kolejny. Zapisz, żeby zmiana weszła na stronę.');
        else hint.textContent = t('Zaznacz fragment i zmień kolor albo pogrubienie. Lista punktowana: każda linia to osobny punkt (Shift+Enter = nowa linia). Link: Ctrl+K. „Dodaj” / „Kopiuj” / „Usuń” — akapity i punkty.');
      }
      card.querySelectorAll('.fmt__b--rich').forEach(function (b) { b.disabled = !on || !listOk(node); });
      var linkB = card.querySelector('#fmt-link');
      if (linkB) {
        linkB.disabled = !on || linkBlocked(node);
        linkB.classList.toggle('is-on', !!(on && !linkB.disabled && linkAt(node)));
      }
      var bOk = on && blockOk(node);
      var insOk = on && insertAfterOk(node);
      var blocks = card.querySelector('#fmt-blocks');
      if (blocks) blocks.hidden = !insOk && !bOk;
      var addB = card.querySelector('#fmt-add');
      var copyB = card.querySelector('#fmt-copy');
      var delB = card.querySelector('#fmt-del');
      if (addB) {
        addB.disabled = !insOk;
        addB.hidden = false;
        var addLabel = t('Dodaj akapit poniżej');
        if (node && node.tagName === 'LI') addLabel = t('Dodaj punkt poniżej');
        else if (node && (kindOf(node) === 'lead' || kindOf(node) === 'hero__sub' || kindOf(node) === 'h2' || kindOf(node) === 'h3')) addLabel = t('Dodaj opis poniżej');
        addB.querySelector('span').textContent = addLabel;
      }
      if (copyB) {
        var canCopy = bOk && /^(P|LI)$/.test(node.tagName);
        copyB.hidden = !canCopy;
        copyB.disabled = !canCopy;
        copyB.textContent = t(node && node.tagName === 'LI' ? 'Kopiuj punkt' : 'Kopiuj to pole');
      }
      if (delB) {
        delB.hidden = !bOk;
        delB.disabled = !bOk || (node.tagName === 'LI' && liveSiblings(node) <= 1 && hasWords(node.textContent));
      }
      if (!on) return;
      var blk = fmtBlockOf();
      st.fmtBlock = blk;
      if (roleSel) roleSel.value = readTypeRole(blk) || readTypeRole(node) || '';
      var colorInp = card.querySelector('#fmt-color');
      if (colorInp && !st.fmtBusy) {
        var col = st.holdColor || '';
        if (!col) {
          try { col = st.doc.queryCommandValue('foreColor'); } catch (e) { /* ignore */ }
        }
        if (!col && node && node.style && node.style.color) col = node.style.color;
        if (!col && blk && st.win) col = st.win.getComputedStyle(blk).color;
        colorInp.value = rgbToHex(col);
      }
      card.querySelectorAll('.fmt__b[data-cmd]').forEach(function (b) {
        var cmd = b.getAttribute('data-cmd');
        var state = false;
        try {
          if (cmd === 'insertUnorderedList') state = inList(node, 'UL');
          else if (cmd === 'insertOrderedList') state = inList(node, 'OL');
          else state = ['bold', 'italic', 'underline'].indexOf(cmd) !== -1 && st.doc.queryCommandState(cmd);
        } catch (e) { /* ignore */ }
        b.classList.toggle('is-on', !!state);
      });
    }
    function wireFmt() {
      var card = el.querySelector('#fmt-card');
      if (!card) return;
      var armFmt = function () {
        st.fmtBusy = true;
        snapshotFmtSel();
      };
      card.addEventListener('pointerdown', armFmt, true);
      card.querySelectorAll('.fmt__b').forEach(function (b) {
        b.addEventListener('mousedown', function (e) { e.preventDefault(); armFmt(); });
        b.addEventListener('click', function () {
          var node = st.editing;
          if (!node) { st.fmtBusy = false; flash(t('Najpierw kliknij tekst na stronie obok.')); return; }
          var cmd = b.getAttribute('data-cmd');
          try {
            node.focus({ preventScroll: true });
            restoreFmtSel();
            st.doc.execCommand('styleWithCSS', false, false);
            if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
              toggleList(cmd === 'insertOrderedList');
            } else if (cmd === 'removeFormat') {
              st.doc.execCommand('removeFormat', false, null);
              var blk = fmtBlockOf();
              if (blk) { clearTypeRole(blk); blk.removeAttribute('style'); }
              clearTypeRole(node);
              node.style.color = '';
              st.holdColor = '';
              node.querySelectorAll('[style]').forEach(function (x) { x.removeAttribute('style'); });
              node.querySelectorAll('span:not([class])').forEach(function (x) {
                if (!x.attributes.length) { while (x.firstChild) x.parentNode.insertBefore(x.firstChild, x); x.remove(); }
              });
            } else {
              st.doc.execCommand(cmd, false, null);
            }
          } catch (e) { /* ignore */ }
          if (st.editing && st.editing.isConnected) markChanged(st.editing);
          else if (node && node.isConnected) markChanged(node);
          stayInEdit();
          syncFmtUi();
        });
      });
      var roleSel = card.querySelector('#fmt-role');
      if (roleSel) {
        roleSel.addEventListener('mousedown', armFmt);
        roleSel.addEventListener('focus', function () { armFmt(); if (!st.fmtBlock) snapshotFmtSel(); });
        roleSel.addEventListener('change', function () {
          applyTypeRole(roleSel.value);
          stayInEdit();
        });
        roleSel.addEventListener('blur', function () { setTimeout(function () { if (!st.editing) st.fmtBusy = false; }, 0); });
      }
      var colorInp = card.querySelector('#fmt-color');
      if (colorInp) {
        var armColor = function () {
          armFmt();
          colorInp.setAttribute('data-start', colorInp.value);
        };
        colorInp.addEventListener('pointerdown', armColor, true);
        colorInp.addEventListener('mousedown', armColor);
        colorInp.addEventListener('input', function () {
          if (colorInp.value === colorInp.getAttribute('data-start') && !st.colorWrap) return;
          applyForeColor(colorInp.value, { keepPicker: true });
        });
        colorInp.addEventListener('change', function () {
          if (colorInp.value === colorInp.getAttribute('data-start') && !st.colorWrap) {
            st.fmtBusy = false;
            return;
          }
          applyForeColor(colorInp.value);
        });
        colorInp.addEventListener('blur', function () { setTimeout(stayInEdit, 0); });
      }
      card.querySelectorAll('.fmt__swatch').forEach(function (b) {
        b.addEventListener('mousedown', function (e) { e.preventDefault(); armFmt(); });
        b.addEventListener('click', function () {
          applyForeColor(b.getAttribute('data-color'));
        });
      });
      var noFocus = function (e) { e.preventDefault(); };
      var linkBtn = card.querySelector('#fmt-link');
      if (linkBtn) {
        linkBtn.addEventListener('mousedown', noFocus);
        linkBtn.addEventListener('click', function () { openLink(); });
      }
      var addBtn = card.querySelector('#fmt-add');
      if (addBtn) {
        addBtn.addEventListener('mousedown', noFocus);
        addBtn.addEventListener('click', function () { st.fmtBusy = false; addBlockAfter(st.editing); });
      }
      var copyBtn = card.querySelector('#fmt-copy');
      if (copyBtn) {
        copyBtn.addEventListener('mousedown', noFocus);
        copyBtn.addEventListener('click', function () { st.fmtBusy = false; copyBlock(st.editing); });
      }
      var delBtn = card.querySelector('#fmt-del');
      if (delBtn) {
        delBtn.addEventListener('mousedown', noFocus);
        delBtn.addEventListener('click', function () { st.fmtBusy = false; removeBlock(st.editing); });
      }
      syncFmtUi();
    }
    wireFmt();

    /* ---- links, like WordPress: select words → Link → paste an address or pick a page ---- */
    var lnk = { pop: null, a: null, range: null };
    function linkBlocked(node) {
      if (!node) return true;
      var kind = kindOf(node);
      return node.tagName === 'A' || !!(node.closest && node.closest('a,button')) || kind === 'link' || kind === 'btn';
    }
    function linkAt(node) {
      if (!node || !st.win) return null;
      var s = st.win.getSelection();
      if (!s || !s.rangeCount) return null;
      var r = s.getRangeAt(0);
      var n = r.commonAncestorContainer;
      if (n && n.nodeType === 3) n = n.parentNode;
      var a = n && n.closest ? n.closest('a') : null;
      if (!a && !r.collapsed && n && n.querySelectorAll) {
        Array.prototype.some.call(n.querySelectorAll('a'), function (x) {
          if (r.intersectsNode(x)) { a = x; return true; }
          return false;
        });
      }
      return a && a !== node && node.contains(a) ? a : null;
    }
    function linkHref(v) {
      v = String(v || '').trim();
      if (!v) return '';
      if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
      if (/^[\/#]/.test(v)) return v;
      if (/^[^\s@\/]+@[^\s@\/]+\.[a-z]{2,}$/i.test(v)) return 'mailto:' + v;
      if (/^\+?[\d\s().-]{7,}$/.test(v)) return 'tel:' + v.replace(/[^\d+]/g, '');
      if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([\/?#]\S*)?$/i.test(v)) return 'https://' + v;
      return '';
    }
    function linkTarget(a, blank) {
      a.setAttribute('data-st-link', '');
      if (blank) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      } else {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    }
    function linkPop() {
      if (lnk.pop) return lnk.pop;
      var d = document.createElement('div');
      d.className = 'lnk';
      d.id = 'lnk-pop';
      d.hidden = true;
      d.setAttribute('role', 'dialog');
      d.innerHTML =
        '<label class="lnk__f"><span>' + esc(t('Adres linku')) + '</span>' +
          '<input type="text" id="lnk-url" list="lnk-pages" autocomplete="off" spellcheck="false" placeholder="' + esc(t('https://…, /kontakty/ albo e-mail — lub wybierz stronę')) + '"></label>' +
        '<datalist id="lnk-pages"></datalist>' +
        '<label class="lnk__f" id="lnk-text-f"><span>' + esc(t('Tekst linku')) + '</span><input type="text" id="lnk-text" autocomplete="off"></label>' +
        '<label class="lnk__chk"><input type="checkbox" id="lnk-blank"> <span>' + esc(t('Otwórz w nowej karcie')) + '</span></label>' +
        '<div class="lnk__btns">' +
          '<button type="button" class="btn btn-sm" id="lnk-ok">' + esc(t('Zastosuj')) + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm lnk__rm" id="lnk-rm">' + esc(t('Usuń link')) + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="lnk-x">' + esc(t('Anuluj')) + '</button>' +
        '</div>';
      el.appendChild(d);
      d.querySelector('#lnk-ok').addEventListener('click', applyLink);
      d.querySelector('#lnk-rm').addEventListener('click', unlinkNow);
      d.querySelector('#lnk-x').addEventListener('click', function () { closeLink(); });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeLink(); }
      });
      lnk.pop = d;
      return d;
    }
    function openLink(hitA) {
      var node = st.editing;
      if (!node) { st.fmtBusy = false; flash(t('Najpierw kliknij tekst na stronie obok.')); return; }
      if (linkBlocked(node)) { st.fmtBusy = false; flash(t('Ten napis sam jest linkiem albo przyciskiem — nie da się w nim wstawić kolejnego linku.')); return; }
      st.fmtBusy = true;
      var s = st.win.getSelection();
      var r = s && s.rangeCount ? s.getRangeAt(0) : null;
      if (r && !node.contains(r.commonAncestorContainer)) r = null;
      if (!r && st.fmtRange && node.contains(st.fmtRange.commonAncestorContainer)) r = st.fmtRange;
      lnk.range = r ? r.cloneRange() : null;
      lnk.a = hitA && hitA.nodeType === 1 && hitA !== node && node.contains(hitA) ? hitA : linkAt(node);
      if (lnk.a && (!lnk.range || !lnk.a.contains(lnk.range.commonAncestorContainer))) {
        lnk.range = st.doc.createRange();
        lnk.range.selectNodeContents(lnk.a);
        lnk.range.collapse(false);
      }
      var pop = linkPop();
      var url = pop.querySelector('#lnk-url');
      var txt = pop.querySelector('#lnk-text');
      var chosen = !!(lnk.range && !lnk.range.collapsed && normTxt(lnk.range.toString()));
      url.value = lnk.a ? (lnk.a.getAttribute('href') || '') : '';
      txt.value = '';
      pop.querySelector('#lnk-text-f').hidden = !!(lnk.a || chosen);
      pop.querySelector('#lnk-blank').checked = !!(lnk.a && lnk.a.getAttribute('target') === '_blank');
      pop.querySelector('#lnk-rm').hidden = !lnk.a;
      ensurePageCache().then(function (pages) {
        var list = pop.querySelector('#lnk-pages');
        list.innerHTML = (pages || []).filter(function (pg) { return pg.url && pg.id !== '90-404'; }).map(function (pg) {
          return '<option value="' + esc(pg.url) + '">' + esc(pg.title || pg.url) + '</option>';
        }).join('');
      });
      var frame = document.getElementById('vis-frame');
      var fr = frame ? frame.getBoundingClientRect() : { top: 0, left: 0 };
      var box = null;
      try { box = lnk.a ? lnk.a.getBoundingClientRect() : (lnk.range ? lnk.range.getBoundingClientRect() : null); } catch (e) { box = null; }
      if (!box || (!box.width && !box.height)) box = node.getBoundingClientRect();
      pop.hidden = false;
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var top = fr.top + box.bottom + 10;
      if (top + h > window.innerHeight - 8) top = fr.top + box.top - h - 10;
      top = Math.min(Math.max(8, top), window.innerHeight - h - 8);
      var left = Math.min(Math.max(8, fr.left + box.left), window.innerWidth - w - 8);
      pop.style.top = Math.round(top) + 'px';
      pop.style.left = Math.round(left) + 'px';
      url.focus();
      url.select();
    }
    function closeLink(keepSel) {
      if (lnk.pop) lnk.pop.hidden = true;
      if (!keepSel && lnk.range) st.fmtRange = lnk.range;
      lnk.a = null;
      lnk.range = null;
      stayInEdit();
      syncFmtUi();
    }
    function applyLink() {
      var node = st.editing;
      var pop = linkPop();
      var url = pop.querySelector('#lnk-url');
      var href = linkHref(url.value);
      if (!href) {
        flash(t('Wpisz poprawny adres: https://…, /strona/ z listy albo e-mail.'));
        url.focus();
        return;
      }
      if (!node) { closeLink(); return; }
      var blank = pop.querySelector('#lnk-blank').checked;
      var made = null;
      if (lnk.a && node.contains(lnk.a)) {
        lnk.a.setAttribute('href', href);
        linkTarget(lnk.a, blank);
        made = lnk.a;
      } else {
        try { node.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        var s = st.win.getSelection();
        var r = lnk.range && node.contains(lnk.range.commonAncestorContainer) ? lnk.range : null;
        if (!r) {
          r = st.doc.createRange();
          r.selectNodeContents(node);
          r.collapse(false);
        }
        if (!r.collapsed && normTxt(r.toString())) {
          s.removeAllRanges();
          s.addRange(r);
          st.doc.execCommand('styleWithCSS', false, false);
          st.doc.execCommand('createLink', false, href);
          node.querySelectorAll('a[href]').forEach(function (a) {
            if (a.getAttribute('href') === href) { linkTarget(a, blank); made = a; }
          });
        } else {
          var label = String(pop.querySelector('#lnk-text').value || '').trim() || String(url.value).trim();
          made = st.doc.createElement('a');
          made.setAttribute('href', href);
          linkTarget(made, blank);
          made.textContent = label;
          var pre = st.doc.createRange();
          pre.selectNodeContents(node);
          pre.setEnd(r.startContainer, r.startOffset);
          var before = pre.toString();
          r.insertNode(made);
          if (before && !/\s$/.test(before)) made.parentNode.insertBefore(st.doc.createTextNode(' '), made);
        }
      }
      if (made) {
        var after = st.doc.createRange();
        after.setStartAfter(made);
        after.collapse(true);
        lnk.range = after;
      }
      markChanged(node);
      closeLink();
      flash(t('Link wstawiony. Zapisz, żeby pojawił się na stronie.'));
    }
    function unlinkNow() {
      var node = st.editing;
      var a = lnk.a;
      if (node && a && node.contains(a)) {
        while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
        a.remove();
        node.normalize();
        lnk.range = null;
        st.fmtRange = null;
        markChanged(node);
      }
      closeLink();
    }

    /* ---- hero crop ---- */
    function fmtCrop(c) {
      if (!c) return '';
      return (+c.x).toFixed(1) + ',' + (+c.y).toFixed(1) + ',' + (+c.z).toFixed(3);
    }
    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function isHeroImg(img) {
      if (!img) return false;
      var idx = +img.getAttribute('data-cms-img');
      return ((p.images || [])[idx] || {}).kind === 'hero' || !!(img.closest && img.closest('.hero'));
    }
    function cropFrame(img) {
      if (!img) return null;
      return img.closest('picture, .tile__media, .card__media, .area__media, .spec__media, .hero__bg, .hero__emerge, .hero__shot, .hero__poster, .mach__film, .mach__shot, .model-strip__shot, .stud-stage__media, .stud-svc__shot, .showcase-intro__media, .about-intro__media, .proof__media, .stud-partner__media, .split__media, .why__media, .comp__media, .logos__item, .client-wall li') || img.parentElement || img;
    }
    function firstHeroImg() {
      if (!st.doc) return null;
      var imgs = st.doc.querySelectorAll('[data-cms-img]');
      for (var i = 0; i < imgs.length; i++) if (isHeroImg(imgs[i])) return imgs[i];
      return st.doc.querySelector('.hero img');
    }
    function firstCropTarget() {
      return st.cropImg || firstHeroImg() || (st.doc && st.doc.querySelector('[data-cms-img]')) || null;
    }
    function readCrop(img) {
      var raw = img.getAttribute('data-st-crop');
      if (raw) {
        var p3 = raw.split(',');
        return { x: clamp(parseFloat(p3[0]) || 50, 0, 100), y: clamp(parseFloat(p3[1]) || 50, 0, 100), z: clamp(parseFloat(p3[2]) || 1, 1, 3) };
      }
      var cs = st.win.getComputedStyle(img);
      var pos = String(cs.objectPosition || '50% 50%').split(/\s+/);
      var x = parseFloat(pos[0]); if (isNaN(x)) x = 50;
      var y = parseFloat(pos[1] || pos[0]); if (isNaN(y)) y = 50;
      var z = 1;
      var tr = cs.transform;
      if (tr && tr !== 'none') {
        var mm = tr.match(/matrix\(([^)]+)\)/);
        if (mm) z = Math.abs(parseFloat(mm[1].split(',')[0])) || 1;
      }
      return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), z: clamp(z, 1, 3) };
    }
    function paintCrop(img, c) {
      img.style.setProperty('--st-x', c.x + '%');
      img.style.setProperty('--st-y', c.y + '%');
      img.style.setProperty('--st-z', String(c.z));
      img.style.objectFit = 'cover';
      img.style.objectPosition = c.x + '% ' + c.y + '%';
      img.style.transform = 'scale(' + c.z + ')';
      img.style.transformOrigin = c.x + '% ' + c.y + '%';
      img.setAttribute('data-st-crop', fmtCrop(c));
    }
    function syncCropUi(c) {
      var rng = el.querySelector('#hero-zoom');
      var lab = el.querySelector('#hero-zoom-val');
      if (rng) rng.value = String(Math.round((c.z || 1) * 100));
      if (lab) lab.textContent = Math.round((c.z || 1) * 100) + '%';
    }
    function setCrop(c, dirty) {
      if (!st.cropImg) return;
      st.crop = { x: clamp(c.x, 0, 100), y: clamp(c.y, 0, 100), z: clamp(c.z, 1, 2.5) };
      paintCrop(st.cropImg, st.crop);
      syncCropUi(st.crop);
      if (dirty) {
        st.crops[st.cropIdx] = st.crop;
        st.cropImg.classList.add('cms-changed');
        updateCount();
      }
    }
    function armCrop(img) {
      if (!img || !img.getAttribute || !img.hasAttribute('data-cms-img')) return;
      if (st.cropImg && st.cropImg !== img) st.cropImg.classList.remove('cms-crop-on');
      st.cropImg = img;
      st.cropIdx = +img.getAttribute('data-cms-img');
      st.crop = st.crops[st.cropIdx] || readCrop(img);
      paintCrop(img, st.crop);
      img.classList.add('cms-crop-on');
      var frame = cropFrame(img);
      if (frame && frame !== img) frame.style.overflow = 'hidden';
      syncCropUi(st.crop);
      var idx = st.cropIdx;
      var im = (p.images || [])[idx] || {};
      var title = el.querySelector('#photo-crop-title');
      if (title) title.textContent = photoLabel(im, idx);
      var card = el.querySelector('#hero-crop-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function bindImageUrl(img, url) {
      if (!img || !url) return;
      img.removeAttribute('srcset');
      img.src = url;
      var pic = img.closest('picture');
      if (pic) pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
      img.classList.add('cms-changed');
      var idx = img.getAttribute('data-cms-img');
      if (idx != null && idx !== '') st.images[idx] = url;
      var art = img.closest('[data-cms-mach]');
      if (art && img.classList.contains('mach__pic')) {
        var row = machRowOf(art.getAttribute('data-cms-mach'));
        if (row) { var imgIn = row.querySelector('input[name^="m-image-"]'); if (imgIn) imgIn.value = url; }
        st.machDirty = true;
      }
    }
    function applyHeroUrl(url) {
      var img = firstCropTarget();
      if (!img) { flash(t('Kliknij najpierw zdjęcie na stronie, które chcesz podmienić.')); return; }
      bindImageUrl(img, url);
      armCrop(img);
      setCrop({ x: 50, y: 50, z: 1.15 }, true);
      updateCount();
      flash(t('Zdjęcie wstawione. Przeciągnij i przybliż, żeby wypełniło pole, potem zapisz.'));
    }

    function replaceImage(img) {
      if (!img) return;
      armCrop(img);
      uploadFile(applyHeroUrl);
    }

    var tip = null;
    function hideTip() { if (tip) tip.classList.remove('is-on'); }
    function showTip(node) {
      if (!tip) return;
      var html = tipHtml(node);
      if (!html) { hideTip(); return; }
      tip.innerHTML = html;
      var r = node.getBoundingClientRect();
      var top = r.top - 36;
      if (top < 6) top = Math.min(r.bottom + 8, st.win.innerHeight - 40);
      tip.style.top = top + 'px';
      tip.style.left = Math.max(6, Math.min(r.left, st.win.innerWidth - 310)) + 'px';
      tip.classList.add('is-on');
    }

    function buildToc() {
      var toc = el.querySelector('#vis-toc');
      if (!toc || !st.doc) return;
      var items = [];
      var hero = st.doc.querySelector('.hero');
      if (hero) items.push({ label: t('Góra strony'), node: hero });
      st.doc.querySelectorAll('[data-cms-copy]').forEach(function (n) {
        var c = (p.copy || [])[+n.getAttribute('data-cms-copy')] || {};
        if (c.kind === 'h2') items.push({ label: normTxt(n.textContent), node: n });
      });
      if (st.doc.querySelector('[data-cms-mach]')) items.push({ label: t('Produkty'), node: st.doc.querySelector('[data-cms-mach]') });
      if (st.doc.querySelector('[data-cms-faq]')) items.push({ label: t('Pytania i odpowiedzi'), node: st.doc.querySelector('[data-cms-faq]') });
      if (st.doc.querySelector('[data-cms-person]')) items.push({ label: t('Osoby do kontaktu'), node: st.doc.querySelector('[data-cms-person]') });
      var formNode = st.doc.querySelector('[data-cms-shared^="form:"]');
      if (formNode) items.push({ label: t('Formularz zapytania (wspólny)'), node: formNode });
      var ftrNode = st.doc.querySelector('[data-cms-shared^="ftr:"]');
      if (ftrNode) items.push({ label: t('Stopka — dane firmy (wspólna)'), node: ftrNode });
      if (!items.length) { el.querySelector('#vis-toc-card').hidden = true; return; }
      toc.innerHTML = '';
      items.forEach(function (it, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'vis__toc-i';
        b.innerHTML = '<span class="vis__toc-n">' + (i + 1) + '</span><span></span>';
        b.lastChild.textContent = it.label;
        b.addEventListener('click', function () {
          var target = it.node.closest('section, footer') || it.node;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          it.node.classList.remove('cms-flash');
          void it.node.offsetWidth;
          it.node.classList.add('cms-flash');
        });
        toc.appendChild(b);
      });
    }

    function paintPl(r, en) {
      en = String(en || '').replace(/кВА/g, 'kVA');
      r.pl = en;
      if (r.node) setNodeText(r.node, en);
      else if (r.el && r.attr) r.el.setAttribute(r.attr, en);
      else if (r.title) {
        var d = r.nodeDoc || st.doc;
        d.title = en;
      }
      if (en && r.uk && en !== r.uk) st.dict[r.uk] = en;
    }

    // Preview is served in Ukrainian; show it in the editing language (English), remembering the source per text node.
    function hydrateFrame(done) {
      var doc = st.doc;
      var pending = [];
      var ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-title', 'data-ask-topic'];

      function queue(uk, rec) {
        rec.uk = uk;
        rec.pl = uk;
        if (!looksUk(uk)) {
          if (uk.indexOf('кВА') !== -1) paintPl(rec, uk);
          return;
        }
        var en = enLabel(uk);
        if (en && !looksUk(en)) { paintPl(rec, en); return; }
        pending.push(rec);
      }

      doc.querySelectorAll(TEXT_SEL).forEach(function (node) {
        var key = keyOf(node);
        var recs = [];
        textNodes(node).forEach(function (n) {
          var uk = normTxt(n.nodeValue);
          var rec = { node: n };
          recs.push(rec);
          queue(uk, rec);
        });
        st.orig[key] = recs;
      });

      function spreadUkToEn(recs, en) {
        en = normTxt(en);
        if (!en || looksUk(en) || !recs || recs.length < 2) return false;
        var uks = recs.map(function (r) { return r.uk || ''; });
        var U = uks.join('');
        var lead = (U.match(/^\s*/) || [''])[0].length;
        var trail = (U.match(/\s*$/) || [''])[0].length;
        var core = Math.max(1, U.length - lead - trail);
        var cuts = [0], pos = 0, i, j;
        for (i = 0; i < uks.length - 1; i++) {
          pos += uks[i].length;
          var frac = (pos - lead) / core;
          var prev = cuts[cuts.length - 1];
          var best;
          if (frac <= 0) best = 0;
          else if (frac >= 1) best = en.length;
          else {
            var want = frac * en.length, bestD = Infinity;
            best = -1;
            for (j = prev + 1; j < en.length; j++) {
              if (en.charAt(j) !== ' ') continue;
              var d = Math.abs(j - want);
              if (d < bestD) { bestD = d; best = j; }
            }
            if (best < 0) best = Math.min(en.length, Math.max(prev, Math.round(want)));
          }
          cuts.push(Math.max(prev, best));
        }
        cuts.push(en.length);
        recs.forEach(function (r, k) {
          paintPl(r, normTxt(en.slice(cuts[k], cuts[k + 1])) || en.slice(cuts[k], cuts[k + 1]));
          var ix = pending.indexOf(r);
          if (ix >= 0) pending.splice(ix, 1);
        });
        return true;
      }
      doc.querySelectorAll(TEXT_SEL).forEach(function (node) {
        var recs = st.orig[keyOf(node)];
        if (!recs || recs.length < 2) return;
        if (!recs.some(function (r) { return pending.indexOf(r) >= 0; })) return;
        var en = enLabel(normTxt(recs.map(function (r) { return r.uk; }).join('')));
        if (en && !looksUk(en)) spreadUkToEn(recs, en);
      });

      textNodes(doc.body).forEach(function (n) {
        var el2 = n.parentNode;
        if (!el2) return;
        if (el2.closest && (el2.closest('#cms-tip') || el2.closest(TEXT_SEL))) return;
        queue(normTxt(n.nodeValue), { node: n });
      });

      doc.querySelectorAll(ATTRS.map(function (a) { return '[' + a + ']'; }).join(',')).forEach(function (el2) {
        if (el2.id === 'cms-tip' || (el2.closest && el2.closest('#cms-tip'))) return;
        ATTRS.forEach(function (a) {
          if (!el2.hasAttribute(a)) return;
          var uk = normTxt(el2.getAttribute(a));
          if (!uk) return;
          queue(uk, { el: el2, attr: a });
        });
      });

      var ttl = normTxt(doc.title || '');
      if (looksUk(ttl) || ttl.indexOf('кВА') !== -1) queue(ttl, { title: true, nodeDoc: doc });

      var finish = function () {
        doc.documentElement.setAttribute('lang', EDIT_LANG);
        doc.documentElement.setAttribute('data-lang', EDIT_LANG);
        doc.querySelectorAll(TEXT_SEL).forEach(function (node) {
          rememberSnap(node);
        });
        refreshRowHeads();
        renumberMach();
        done();
      };
      if (!pending.length) { finish(); return; }
      var applyMap = function (list, map) {
        var left = [];
        list.forEach(function (r) {
          var en = mapHit(map, r.uk);
          if (en && en !== r.uk && !looksUk(en)) paintPl(r, en);
          else left.push(r);
        });
        return left;
      };
      var ask = function (list) {
        return api({ action: 'cms.translate', sl: 'uk', tl: EDIT_LANG, texts: uniq(list.map(function (r) { return r.uk; })) })
          .then(function (res) { return applyMap(list, (res && res.map) || {}); });
      };
      var askGroups = function (list) {
        var groups = [];
        doc.querySelectorAll(TEXT_SEL).forEach(function (node) {
          var recs = (st.orig[keyOf(node)] || []).filter(function (r) { return list.indexOf(r) >= 0; });
          if (recs.length > 1) groups.push(recs);
        });
        if (!groups.length) return Promise.resolve(list);
        return api({
          action: 'cms.translate', sl: 'uk', tl: EDIT_LANG,
          texts: uniq(groups.map(function (g) { return normTxt(g.map(function (r) { return r.uk; }).join('')); }))
        }).then(function (res) {
          var map = (res && res.map) || {};
          groups.forEach(function (g) {
            var en = mapHit(map, normTxt(g.map(function (r) { return r.uk; }).join('')));
            if (en && !looksUk(en)) spreadUkToEn(g, en);
          });
          return list.filter(function (r) { return pending.indexOf(r) >= 0; });
        });
      };
      askGroups(pending).then(function (list) {
        if (!list.length) return list;
        return ask(list);
      }).then(function (left) {
        if (!left.length) return left;
        return new Promise(function (resolve) { setTimeout(resolve, 1500); }).then(function () { return ask(left); });
      }).then(finish, finish);
    }

    function wireFrame() {
      var doc = st.doc, win = st.win;
      var style = doc.createElement('style');
      style.id = 'cms-style';
      style.textContent = VIS_CSS;
      doc.head.appendChild(style);
      convertModelStrip();
      (function tagLooseImages() {
        var next = (p.images || []).length;
        doc.querySelectorAll('img').forEach(function (img) {
          if (img.hasAttribute('data-cms-img')) return;
          if (img.closest('.hdr, .ftr, .mbar, .yt, video')) return;
          var src = (img.getAttribute('src') || '').split('?')[0];
          var low = src.toLowerCase();
          if (low.indexOf('/assets/img/') === -1) return;
          if (/\/yt\/|favicon|apple-touch|icon-192|icon-512/.test(low)) return;
          img.setAttribute('data-cms-img', String(next));
          p.images = p.images || [];
          p.images.push({
            i: next,
            kind: 'photo',
            src: src,
            alt: img.getAttribute('alt') || '',
            crop: img.getAttribute('data-st-crop') || ''
          });
          next += 1;
        });
      })();
      doc.documentElement.classList.toggle('cms-show-all', el.querySelector('#vis-outline').checked);
      tip = doc.createElement('div');
      tip.id = 'cms-tip';
      doc.body.appendChild(tip);
      doc.querySelectorAll('[data-cms-faq]').forEach(function (d) { d.open = true; });
      // Empty media slots of product cards are clickable placeholders.
      doc.querySelectorAll('[data-cms-mach]').forEach(function (a) {
        var f = a.querySelector('.mach__film--empty');
        if (f) { f.setAttribute('data-cms-mach-media', a.getAttribute('data-cms-mach')); f.removeAttribute('aria-hidden'); f.textContent = t('Brak filmu ani zdjęcia — kliknij tutaj, żeby wybrać zdjęcie, albo wklej link YouTube w panelu obok.'); }
      });
      (function placeHops() {
        var CARD_SEL = '.tile, .choice__card, .area, .card, .spec, .group-card, .film-rail__i';
        function makeBtn(pg, kind) {
          var b = doc.createElement('button');
          b.type = 'button';
          b.className = 'cms-hop cms-hop--' + kind;
          b.setAttribute('data-cms-hop', pg.id);
          var label = t('Otwórz w panelu') + ': ' + plLabel(pg.name || pg.title || '');
          b.setAttribute('title', label);
          b.setAttribute('aria-label', label);
          b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M8 5H5v14h14v-3"/><path d="M10 14L20 4"/><path d="M13 4h7v7"/></svg>';
          return b;
        }
        function place(host, kind, pg) {
          if (!host || !pg) return;
          host._cmsHops = host._cmsHops || {};
          if (host._cmsHops[pg.id]) return;
          host._cmsHops[pg.id] = 1;
          host.classList.add('cms-hop-host', 'cms-hop-host--' + kind);
          var b = makeBtn(pg, kind);
          if (kind === 'card') {
            host._cmsHopN = host._cmsHopN || 0;
            if (host._cmsHopN) b.style.top = (10 + host._cmsHopN * 40) + 'px';
            host._cmsHopN += 1;
          }
          host.appendChild(b);
        }
        doc.querySelectorAll('a[href]').forEach(function (a) {
          if (a.closest('.hdr, .ftr, .mbar, nav.nav, .crumbs, .lang')) return;
          if (a.hasAttribute('data-st-link') || (a.parentElement && a.parentElement.closest(TEXT_SEL))) return;
          var href = a.getAttribute('href') || '';
          if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
          var pg = pageByUrl(href);
          if (!pg || pg.id === p.id) return;
          if (a.closest('.area__menu')) {
            place(a.closest('li') || a, 'row', pg);
            return;
          }
          var card = a.closest(CARD_SEL);
          if (card) {
            place(card, 'card', pg);
            return;
          }
          place(a, 'cta', pg);
        });
      })();

      function inChrome(el) {
        return !!(el && el.closest && el.closest(CHROME_SEL));
      }

      function setDrawer(open) {
        var drawer = doc.getElementById('drawer');
        var burger = doc.getElementById('burger');
        if (!drawer) return;
        drawer.classList.toggle('is-open', !!open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        doc.body.classList.toggle('is-locked', !!open);
      }

      function followChromeHref(href, a) {
        href = String(href || '');
        if (!href || href === '#') return true;
        if (/^(mailto:|tel:)/i.test(href)) return false;
        var pg = pageByUrl(href);
        if (pg) {
          if (st.editing) commit(st.editing);
          if (pg.id === p.id) {
            var hash = '';
            try { hash = (new URL(href, 'https://smoltech.com.ua')).hash || ''; } catch (err) {}
            if (hash) {
              var dest = doc.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
              if (dest && dest.scrollIntoView) dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return true;
          }
          hopTo(pg.id);
          return true;
        }
        if (a && a.getAttribute('target') === '_blank') return false;
        return true;
      }

      // Editable element under the pointer — also when a decorative overlay sits on top of it.
      function pick(e) {
        var tgt = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
        if (inChrome(tgt)) return null;
        if (tgt && tgt.closest) {
          var directCopy = tgt.closest(TEXT_SEL);
          if (directCopy && !inChrome(directCopy)) return directCopy;
          var directImg = tgt.closest('[data-cms-img]');
          if (directImg && !inChrome(directImg)) return directImg;
        }
        if (typeof e.clientX === 'number' && doc.elementsFromPoint) {
          var stack = doc.elementsFromPoint(e.clientX, e.clientY) || [];
          var img = null, copy = null, other = null;
          for (var i = 0; i < stack.length; i++) {
            var n = stack[i];
            if (!n.matches) continue;
            if (inChrome(n)) continue;
            if (n.matches(TEXT_SEL) && !copy) copy = n;
            else if (n.matches('[data-cms-img]') && !img) img = n;
            else if (n.matches('[data-cms-mach],[data-cms-faq],[data-cms-person]') && !other) other = n;
          }
          if (img) return img;
          return copy || other;
        }
        return null;
      }

      doc.addEventListener('click', function (e) {
        var tgt = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
        if (!tgt) return;
        if (lnk.pop && !lnk.pop.hidden) {
          lnk.pop.hidden = true;
          lnk.a = null;
          lnk.range = null;
          st.fmtBusy = false;
        }
        var hopBtn = tgt.closest && tgt.closest('[data-cms-hop]');
        if (hopBtn) {
          e.preventDefault();
          e.stopPropagation();
          if (st.editing) commit(st.editing);
          hopTo(hopBtn.getAttribute('data-cms-hop'));
          return;
        }
        if (inChrome(tgt)) {
          if (tgt.closest('.burger')) {
            e.preventDefault();
            e.stopPropagation();
            var drawer = doc.getElementById('drawer');
            setDrawer(!(drawer && drawer.classList.contains('is-open')));
            return;
          }
          if (tgt.closest('#drawer-close, .drawer__close')) {
            e.preventDefault();
            e.stopPropagation();
            setDrawer(false);
            return;
          }
          var drawerTog = tgt.closest('.drawer__toggle');
          if (drawerTog) {
            e.preventDefault();
            e.stopPropagation();
            var panel = doc.getElementById(drawerTog.getAttribute('aria-controls'));
            if (panel) {
              var open = drawerTog.getAttribute('aria-expanded') === 'true';
              drawerTog.setAttribute('aria-expanded', open ? 'false' : 'true');
              panel.classList.toggle('is-open', !open);
            }
            return;
          }
          if (tgt.closest('.lang')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          var a = tgt.closest('a[href]');
          if (!a) return;
          var href = a.getAttribute('href') || '';
          if (!href || href.charAt(0) === '#') {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (/^(mailto:|tel:)/i.test(href)) return;
          if (a.getAttribute('target') === '_blank' && !pageByUrl(href)) return;
          e.preventDefault();
          e.stopPropagation();
          followChromeHref(href, a);
          return;
        }
        e.preventDefault();
        if (st.editing && st.editing.contains(tgt)) {
          var inLink = tgt.closest('a');
          if (inLink && inLink !== st.editing && st.editing.contains(inLink) && !linkBlocked(st.editing)) setTimeout(function () { openLink(inLink); }, 0);
          return;
        }
        e.stopPropagation();
        // media slot of a product card (video / photo / empty placeholder)
        var film = tgt.closest && tgt.closest('.mach__film');
        if (film && !(tgt.closest('[data-cms-img]'))) {
          var artx = film.closest('[data-cms-mach]');
          if (artx) {
            if (st.editing) commit(st.editing);
            var mk = artx.getAttribute('data-cms-mach');
            if (film.classList.contains('mach__film--empty') || film.classList.contains('mach__film--img')) pickMachImage(mk);
            else focusAside('mach', mk);
            return;
          }
        }
        var shot = tgt.closest && tgt.closest('.model-strip__shot');
        if (shot && !tgt.closest('[data-cms-img]') && !shot.querySelector('[data-cms-img]')) {
          if (st.editing) commit(st.editing);
          uploadFile(function (url) {
            shot.classList.remove('model-strip__shot--empty');
            shot.removeAttribute('data-cms-model-media');
            shot.textContent = '';
            var pic = st.doc.createElement('picture');
            var im = st.doc.createElement('img');
            im.src = url; im.alt = ''; im.width = 311; im.height = 262;
            var next = (p.images || []).length;
            im.setAttribute('data-cms-img', String(next));
            p.images = p.images || [];
            p.images.push({ i: next, kind: 'photo', src: url, alt: '', crop: '' });
            pic.appendChild(im);
            shot.appendChild(pic);
            st.images[next] = url;
            st.modelsDirty = true;
            updateCount();
            armCrop(im);
            flash(t('Zdjęcie wstawione do modelu. Przeciągnij i przybliż, potem zapisz.'));
          });
          return;
        }
        var colDel = tgt.closest && tgt.closest('.cms-col-del');
        if (colDel) {
          if (st.editing) commit(st.editing);
          var col = 0;
          var headDel = colDel.closest('.param-matrix__head[data-col]');
          if (headDel) col = parseInt(headDel.getAttribute('data-col'), 10) || 0;
          else {
            var stripDel = colDel.closest('.model-strip__btn');
            if (stripDel) col = parseInt(stripDel.getAttribute('data-model'), 10) || 0;
          }
          removeModelCol(col);
          return;
        }
        var stripBtn = tgt.closest && tgt.closest('.model-strip__btn');
        if (stripBtn) {
          var nameHit = stripBtn.querySelector('.model-strip__name');
          if (nameHit) { startEdit(nameHit); return; }
        }
        var emptyFilm = tgt.closest && tgt.closest('.film-rail__empty');
        if (emptyFilm) {
          if (st.editing) commit(st.editing);
          var det = el.querySelector('#film-wrap');
          if (det) det.open = true;
          var arts = st.doc.querySelectorAll('.film-rail__i');
          var idx = Array.prototype.indexOf.call(arts, emptyFilm.closest('.film-rail__i'));
          var box = el.querySelector('#films');
          var row = box && box.querySelectorAll('.repeat__i')[idx];
          var inp = row && row.querySelector('input');
          if (inp) { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          flash(t('Wklej link YouTube w polu obok.'));
          return;
        }
        var hit = pick(e);
        if (!hit) { if (st.editing) commit(st.editing); return; }
        if (hit.matches(TEXT_SEL)) { startEdit(hit); return; }
        if (st.editing) commit(st.editing);
        if (hit.hasAttribute('data-cms-img')) {
          armCrop(hit);
          return;
        }
        if (hit.hasAttribute('data-cms-mach')) { focusAside('mach', hit.getAttribute('data-cms-mach')); return; }
        if (hit.hasAttribute('data-cms-faq')) { focusAside('faq', hit.getAttribute('data-cms-faq')); return; }
        if (hit.hasAttribute('data-cms-person')) { focusAside('people', hit.getAttribute('data-cms-person')); return; }
      }, true);
      doc.addEventListener('submit', function (e) { e.preventDefault(); }, true);
      doc.addEventListener('selectionchange', function () { if (st.editing && !st.fmtBusy) snapshotFmtSel(); });
      doc.addEventListener('mouseup', function () { if (st.editing && !st.fmtBusy) { st.holdColor = ''; st.colorWrap = null; snapshotFmtSel({ allowCollapsed: true }); } });
      doc.addEventListener('keyup', function () { if (st.editing && !st.fmtBusy) { st.holdColor = ''; st.colorWrap = null; snapshotFmtSel({ allowCollapsed: true }); } });
      doc.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's') { e.preventDefault(); save(); return; }
        if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          var seqK = hopSequence();
          if (seqK.length < 2) return;
          var atK = seqK.length - 1;
          if (e.key === 'ArrowLeft' && atK > 0) hopTo(seqK[atK - 1].id);
          return;
        }
        if (!st.editing) return;
        if ((e.ctrlKey || e.metaKey) && /^[biu]$/i.test(String(e.key))) {
          // browser shortcuts for bold/italic/underline are fine — just mark the change
          setTimeout(function () { if (st.editing) { markChanged(st.editing); syncFmtUi(); } }, 0);
          return;
        }
        if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
          e.preventDefault();
          if (!linkBlocked(st.editing)) { snapshotFmtSel({ allowCollapsed: true }); openLink(); }
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); st.editing.blur(); return; }
        if (e.key === 'Enter') {
          var kind = kindOf(st.editing);
          if (kind === 'rich') return; // native behaviour: new paragraph
          e.preventDefault();
          if (!e.shiftKey && st.editing.tagName === 'LI' && blockOk(st.editing) && caretAtEnd(st.editing)) {
            addBlockAfter(st.editing);
            return;
          }
          if (e.shiftKey || MULTILINE_KINDS.indexOf(kind) !== -1) doc.execCommand('insertLineBreak');
          else st.editing.blur();
        }
      });
      doc.addEventListener('selectionchange', function () {
        if (!st.editing || st.fmtBusy) return;
        clearTimeout(st._selT);
        st._selT = setTimeout(function () {
          if (st.fmtBusy || !st.editing) return;
          syncFmtUi();
        }, 80);
      });
      doc.addEventListener('paste', function (e) {
        var cd = e.clipboardData || win.clipboardData;
        var items = cd && cd.items;
        if (items) {
          for (var i = 0; i < items.length; i++) {
            if (String(items[i].type || '').indexOf('image/') === 0) {
              var file = items[i].getAsFile();
              if (file) {
                e.preventDefault();
                sendFile(file, applyHeroUrl);
                return;
              }
            }
          }
        }
        if (!st.editing) return;
        e.preventDefault();
        var txt = String((cd ? cd.getData('text/plain') : '') || '');
        if (kindOf(st.editing) === 'rich') {
          var parts = txt.split(/\r?\n\s*\r?\n/);
          parts.forEach(function (pt, i) {
            if (i) doc.execCommand('insertParagraph');
            doc.execCommand('insertText', false, pt.replace(/\r?\n+/g, ' ').trim());
          });
          return;
        }
        var lines = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        if (lines.length > 1 && MULTILINE_KINDS.indexOf(kindOf(st.editing)) !== -1) {
          lines.forEach(function (ln, i) {
            if (i) doc.execCommand('insertLineBreak');
            if (ln) doc.execCommand('insertText', false, ln);
          });
          return;
        }
        doc.execCommand('insertText', false, txt.replace(/\r?\n+/g, ' '));
      });
      var drag = null;
      doc.addEventListener('dragstart', function (e) {
        if (e.target && e.target.closest && e.target.closest('[data-cms-img]')) e.preventDefault();
      });
      doc.addEventListener('dblclick', function (e) {
        if (st.editing) return;
        var hit = pick(e);
        if (!hit || !hit.hasAttribute('data-cms-img')) return;
        e.preventDefault();
        replaceImage(hit);
      }, true);
      doc.addEventListener('mousedown', function (e) {
        if (e.button !== 0 || st.editing) return;
        if (e.target && e.target.closest && e.target.closest('[data-cms-hop]')) return;
        var hit = pick(e);
        if (!hit || !hit.hasAttribute('data-cms-img')) return;
        armCrop(hit);
        drag = { x: e.clientX, y: e.clientY, crop: { x: st.crop.x, y: st.crop.y, z: st.crop.z }, moved: false };
        hit.classList.add('cms-cropping');
      });
      doc.addEventListener('mousemove', function (e) {
        if (!drag || !st.cropImg) return;
        if (!drag.moved) {
          if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 4) return;
          drag.moved = true;
        }
        var box = cropFrame(st.cropImg);
        var r = box.getBoundingClientRect();
        var z = drag.crop.z || 1;
        var nx = drag.crop.x - ((e.clientX - drag.x) / Math.max(r.width, 1)) * 100 / z;
        var ny = drag.crop.y - ((e.clientY - drag.y) / Math.max(r.height, 1)) * 100 / z;
        setCrop({ x: nx, y: ny, z: z }, true);
      });
      doc.addEventListener('mouseup', function () {
        if (st.cropImg) st.cropImg.classList.remove('cms-cropping');
        drag = null;
      });
      win.addEventListener('mouseup', function () {
        if (st.cropImg) st.cropImg.classList.remove('cms-cropping');
        drag = null;
      });
      win.addEventListener('blur', function () {
        if (st.editing) snapshotFmtSel();
        if (st.cropImg) st.cropImg.classList.remove('cms-cropping');
        drag = null;
      });
      doc.addEventListener('wheel', function (e) {
        if (st.editing) return;
        var hit = pick(e);
        if (hit && hit.hasAttribute('data-cms-img')) {
          if (st.cropImg !== hit) armCrop(hit);
        } else if (st.cropImg) {
          var box = cropFrame(st.cropImg);
          if (!box || !box.contains(e.target)) return;
        } else {
          return;
        }
        e.preventDefault();
        var z = clamp(st.crop.z * (e.deltaY > 0 ? 0.95 : 1.05), 1, 2.5);
        setCrop({ x: st.crop.x, y: st.crop.y, z: z }, true);
      }, { passive: false });
      var hoverNode = null;
      doc.addEventListener('mousemove', function (e) {
        var node = pick(e);
        if (node === st.editing) node = null;
        if (node === hoverNode) return;
        if (hoverNode) hoverNode.classList.remove('cms-hover');
        hoverNode = node;
        if (!node) { hideTip(); return; }
        node.classList.add('cms-hover');
        showTip(node);
      }, { passive: true });
      doc.addEventListener('mouseleave', function () {
        if (hoverNode) hoverNode.classList.remove('cms-hover');
        hoverNode = null;
        hideTip();
      });
      win.addEventListener('scroll', hideTip, { passive: true });
      doc.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }

    frame.onload = function () {
      st.doc = frame.contentDocument;
      st.win = frame.contentWindow;
      if (!st.doc || !st.doc.body) { loading.textContent = t('Nie udało się wczytać podglądu.'); return; }
      wireFrame();
      loading.textContent = t('Przygotowuję podgląd po angielsku…');
      hydrateFrame(function () {
        decorateModels();
        refreshModelList();
        loading.hidden = true;
        buildToc();
        armCrop(firstCropTarget());
        if (opts.scrollY) st.win.scrollTo(0, opts.scrollY);
      });
    };
    frame.srcdoc = previewHtml;

    /* ---- keep the editor on the version that is live on the server ---- */
    (function watchServer() {
      var told = '';
      var checking = false;
      var stop = function () {
        clearInterval(timer);
        window.removeEventListener('focus', check);
        document.removeEventListener('visibilitychange', check);
      };
      var check = function () {
        if (!form.isConnected) { stop(); return; }
        if (checking || st.busy || document.hidden || !p._stamp) return;
        checking = true;
        api({ action: 'cms.page.stamp', id: p.id }).then(function (res) {
          checking = false;
          if (!form.isConnected || st.busy || !res || !res.ok || !res.stamp || res.stamp === p._stamp) return;
          if (hasChanges() || st.editing) {
            if (told !== res.stamp) {
              told = res.stamp;
              flash(t('Na serwerze jest nowsza wersja tej strony. Zapisz albo cofnij swoje zmiany, a panel ją wczyta.'));
            }
            return;
          }
          stop();
          flash(t('Wczytuję aktualną wersję strony z serwera…'));
          openEditor(p.id, { scrollY: st.win ? st.win.scrollY : 0, trail: 'keep' });
        }, function () { checking = false; });
      };
      var timer = setInterval(check, 15000);
      window.addEventListener('focus', check);
      document.addEventListener('visibilitychange', check);
    })();

    /* ---- save: English in the editor → Ukrainian source (+ English overlay) ---- */
    function save() {
      if (st.busy) return;
      if (st.editing) commit(st.editing);
      var btns = el.querySelectorAll('#btn-save-page, #form-page button[type="submit"]');
      st.busy = true;
      btns.forEach(function (b) { b.disabled = true; });
      var fail = function (msg) {
        st.busy = false;
        btns.forEach(function (b) { b.disabled = false; });
        if (msg) flash(msg);
      };
      resolveContent(form, function () {
        var texts = [];
        function planNode(node, key) {
          var recs = (key != null && st.orig[key]) || [];
          var tn = textNodes(node);
          var nodes = tn.map(function (n) {
            var en = normTxt(n.nodeValue);
            var hit = null;
            recs.forEach(function (r) { if (!hit && r.pl === en) hit = r; });
            var uk = hit ? hit.uk : (looksUk(en) ? en : null);
            return { pl: en, uk: uk, raw: n.nodeValue };
          });
          var plan = { node: node, key: key, nodes: nodes };
          var enAll = normTxt(nodes.map(function (x) { return x.raw; }).join(''));
          var fresh = nodes.some(function (x) { return x.uk == null; });
          var squash = function (s) { return String(s || '').replace(/\s+/g, ''); };
          var origEn = recs.map(function (r) { return r.pl || ''; }).join(' ');
          var origUk = normTxt(recs.map(function (r) { return r.uk || ''; }).join(' '));
          var sameText = recs.length && squash(origEn) === squash(enAll) && recs.every(function (r) { return looksUk(r.uk); });
          if (fresh && nodes.length === 1 && sameText) {
            var one = nodes[0];
            one.uk = (one.raw.match(/^\s*/) || [''])[0] + origUk + (one.raw.match(/\s*$/) || [''])[0];
            one.set = true;
            return plan;
          }
          // Bold, italic, link or colour split the English into several text nodes.
          // Translate the whole sentence once, then cut the Ukrainian at the same
          // places — never translate "nes" or "experience" on its own.
          var inlineOk = fresh && nodes.length > 1 && tn.every(function (n) { return inlinePath(n, node); });
          if (inlineOk && /[A-Za-z]/.test(enAll) && !looksUk(enAll)) {
            plan.flow = { en: enAll, uk: sameText ? origUk : '' };
            if (sameText) {
              var segs = punctCuts(nodes.map(function (x) { return x.raw; }), origUk);
              if (segs) {
                nodes.forEach(function (x, k) { x.uk = segs[k]; x.set = true; });
                plan.flow.done = true;
              }
            }
            if (!plan.flow.uk && !plan.flow.done) texts.push(enAll);
            return plan;
          }
          nodes.forEach(function (x) { if (x.uk == null) texts.push(x.pl); });
          return plan;
        }
        function inlinePath(n, root) {
          for (var q = n.parentNode; q && q !== root; q = q.parentNode) {
            if (q.nodeType !== 1 || !/^(B|STRONG|I|EM|U|S|A|SPAN|SUB|SUP)$/.test(q.tagName)) return false;
          }
          return q === root;
        }
        // Split the Ukrainian sentence at the punctuation the English pieces start or end with
        // (" – ", ":", ","…). Null when the pieces are not cut at matching punctuation.
        function punctCuts(raws, U) {
          if (!U) return null;
          var E = raws.join('');
          var classes = [
            { re: /(^|\s)[-\u2013\u2014](?=\s)/g, at: function (s) { return /^[-\u2013\u2014]\s/.test(s); } },
            { re: /:/g, at: function (s) { return s.charAt(0) === ':'; } },
            { re: /;/g, at: function (s) { return s.charAt(0) === ';'; } },
            { re: /,/g, at: function (s) { return s.charAt(0) === ','; } },
            { re: /\./g, at: function (s) { return s.charAt(0) === '.'; } }
          ];
          function spots(s, c) {
            var out = [], m;
            c.re.lastIndex = 0;
            while ((m = c.re.exec(s))) out.push(m.index + (m[1] ? m[1].length : 0));
            return out;
          }
          var cuts = [0], pos = 0;
          for (var i = 0; i < raws.length - 1; i++) {
            pos += raws[i].length;
            var left = E.slice(0, pos).replace(/\s+$/, '');
            var right = E.slice(pos).replace(/^\s+/, '');
            var cut = -1;
            for (var c = 0; c < classes.length && cut < 0; c++) {
              var cl = classes[c];
              var eS = spots(E, cl), uS = spots(U, cl);
              if (!eS.length || eS.length !== uS.length) continue;
              if (cl.at(right)) {
                var k = eS.indexOf(E.length - right.length);
                if (k < 0) continue;
                cut = uS[k];
                if (/^\s/.test(E.slice(pos))) while (cut > 0 && U.charAt(cut - 1) === ' ') cut--;
              } else if (cl.at(left.slice(-1))) {
                var k2 = eS.indexOf(left.length - 1);
                if (k2 < 0) continue;
                cut = uS[k2] + 1;
                if (/\s$/.test(E.slice(0, pos))) while (cut < U.length && U.charAt(cut) === ' ') cut++;
              }
            }
            if (cut <= cuts[cuts.length - 1] || cut >= U.length) return null;
            cuts.push(cut);
          }
          cuts.push(U.length);
          var segs = [];
          for (var j = 0; j < raws.length; j++) {
            var seg = U.slice(cuts[j], cuts[j + 1]);
            if (j === 0) seg = (raws[j].match(/^\s*/) || [''])[0] + seg.replace(/^\s+/, '');
            if (j === raws.length - 1) seg = seg.replace(/\s+$/, '') + (raws[j].match(/\s*$/) || [''])[0];
            if (!normTxt(seg) && normTxt(raws[j])) return null;
            segs.push(seg);
          }
          return segs;
        }
        function colorOnlyPath(n, root) {
          for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
            if (p.nodeType !== 1 || p.tagName !== 'SPAN') return false;
            if (p.attributes.length !== 1 || !p.hasAttribute('style')) return false;
            if (!/^\s*color\s*:[^;]+;?\s*$/i.test(p.getAttribute('style') || '')) return false;
          }
          return p === root;
        }
        function spreadFlow(plan, map) {
          if (!plan || !plan.flow || plan.flow.done) return;
          var U = plan.flow.uk || mapHit(map, plan.flow.en) || '';
          U = normTxt(U);
          if (!looksUk(U)) { plan.flow = null; return; }
          plan.flow.uk = U;
          var raws = plan.nodes.map(function (x) { return x.raw || ''; });
          var E = raws.join('');
          var lead = (E.match(/^\s*/) || [''])[0].length;
          var trail = (E.match(/\s*$/) || [''])[0].length;
          var core = Math.max(1, E.length - lead - trail);
          var cuts = [0];
          var pos = 0;
          for (var i = 0; i < raws.length - 1; i++) {
            pos += raws[i].length;
            var frac = (pos - lead) / core;
            var prev = cuts[cuts.length - 1];
            var best;
            if (frac <= 0) best = 0;
            else if (frac >= 1) best = U.length;
            else {
              var want = frac * U.length;
              var bestD = Infinity;
              best = -1;
              for (var j = prev + 1; j < U.length; j++) {
                if (U.charAt(j) !== ' ') continue;
                var d = Math.abs(j - want);
                if (d < bestD) { bestD = d; best = j; }
              }
              if (best < 0) best = Math.min(U.length, Math.max(prev, Math.round(want)));
            }
            cuts.push(Math.max(prev, best));
          }
          cuts.push(U.length);
          plan.nodes.forEach(function (x, k) {
            var seg = U.slice(cuts[k], cuts[k + 1]);
            if (k === 0) seg = (x.raw.match(/^\s*/) || [''])[0] + seg;
            if (k === plan.nodes.length - 1) seg += (x.raw.match(/\s*$/) || [''])[0];
            x.uk = seg;
            x.set = true;
          });
        }
        var needs = [];
        var seenNeed = {};
        function addNeed(node, key) {
          if (!node || key == null || seenNeed[key]) return;
          seenNeed[key] = true;
          needs.push(planNode(node, key));
        }
        Object.keys(st.changed).forEach(function (key) {
          addNeed(nodeByKey(key), key);
        });
        if (st.doc) {
          st.doc.querySelectorAll('[data-cms-new]').forEach(function (node) {
            addNeed(node, keyOf(node));
          });
          st.doc.querySelectorAll('[data-cms-copy]').forEach(function (node) {
            var key = keyOf(node);
            if (key == null || !/^\d+$/.test(String(key))) return;
            if (seenNeed[key] || node.hasAttribute('data-cms-deleted')) return;
            if (/style\s*=/i.test(node.innerHTML) || markupChanged(node, key)) addNeed(node, key);
          });
        }
        // Product cards: every title / description needs its Ukrainian text, changed or not.
        var machPlan = [];
        if (machBox) Array.prototype.forEach.call(machBox.querySelectorAll('.repeat__i'), function (row) {
          var key = row.getAttribute('data-mach-key');
          var art = machArticle(key);
          if (!art) return;
          var h3 = art.querySelector('h3');
          var tx = art.querySelector('.mach__text');
          var ask = art.querySelector('.mach__links a[data-cms-copy]');
          machPlan.push({
            row: row, key: key, art: art,
            h3: h3 ? planNode(h3, keyOf(h3)) : null,
            tx: tx ? planNode(tx, keyOf(tx)) : null,
            ask: ask ? planNode(ask, keyOf(ask)) : null
          });
        });
        var modelRoot = st.doc.querySelector('[data-param-matrix]');
        var modelPlan = null;
        if (modelRoot) {
          var btns = modelRoot.querySelectorAll('.model-strip__btn');
          var cols = [];
          Array.prototype.forEach.call(btns, function (btn) {
            var nameEl = btn.querySelector('.model-strip__name') || btn;
            var img = btn.querySelector('img');
            cols.push({
              name: planNode(nameEl, keyOf(nameEl)),
              image: img ? (img.getAttribute('src') || '') : '',
              alt: img ? (img.getAttribute('alt') || '') : '',
              values: []
            });
          });
          var rowLabels = [];
          Array.prototype.forEach.call(modelRoot.querySelectorAll('.param-matrix__label[role="rowheader"]'), function (lab) {
            rowLabels.push({ label: planNode(lab, keyOf(lab)) });
          });
          Array.prototype.forEach.call(btns, function (btn, i) {
            var vals = modelRoot.querySelectorAll('.param-matrix__val[data-col="' + (i + 1) + '"]');
            cols[i].values = Array.prototype.map.call(vals, function (v) { return planNode(v, keyOf(v)); });
          });
          modelPlan = {
            hasShots: !!modelRoot.querySelector('.model-strip--shots'),
            wide: !!(modelRoot.querySelector('.param-matrix--wide')),
            rows: rowLabels,
            columns: cols
          };
        }
        var filmPlan = [];
        st.doc.querySelectorAll('.film-rail__i').forEach(function (art, idx) {
          var h3 = art.querySelector('h3');
          var yt = art.querySelector('.yt[data-vid]');
          var row = el.querySelector('#films') && el.querySelector('#films').querySelectorAll('.repeat__i')[idx];
          var inp = row && row.querySelector('input[name^="film-v-"]');
          filmPlan.push({
            title: h3 ? planNode(h3, keyOf(h3)) : null,
            video: (inp && parseYt(inp.value)) || (yt ? yt.getAttribute('data-vid') : '') || ''
          });
        });
        texts = uniq(texts);

        var STRIP_ATTRS = ['data-cms-copy', 'data-cms-shared', 'data-cms-img', 'data-cms-mach', 'data-cms-faq', 'data-cms-person', 'data-cms-kind', 'data-cms-label', 'data-cms-mach-media', 'data-cms-tile', 'data-cms-film', 'data-cms-model-media', 'data-cms-film-media', 'data-cms-new', 'data-cms-deleted', 'data-cms-list', 'contenteditable', 'spellcheck'];
        var ukClone = function (plan, map) {
          var clone = plan.node.cloneNode(true);
          clone.querySelectorAll('.cms-col-del, .cms-hop').forEach(function (d) { d.remove(); });
          var cn = textNodes(clone);
          plan.nodes.forEach(function (x, i) {
            if (!cn[i]) return;
            if (x.set) { cn[i].nodeValue = x.uk; return; }
            var uk = x.uk != null ? x.uk : mapHit(map, x.pl);
            if (uk && !looksUk(uk) && looksUk(x.pl)) uk = x.pl;
            if (!looksUk(String(uk || '')) && plan.node) {
              var recs = (plan.key != null && st.orig[plan.key]) || [];
              recs.forEach(function (r) {
                if (r && r.uk && looksUk(r.uk) && (r.pl === x.pl || r.uk === x.pl)) uk = r.uk;
              });
            }
            setNodeText(cn[i], uk != null ? uk : x.pl);
          });
          var all = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
          all.forEach(function (d) {
            STRIP_ATTRS.forEach(function (a) { d.removeAttribute(a); });
            ['cms-changed', 'cms-hover', 'cms-editing', 'cms-new-card', 'cms-crop-on', 'cms-hop-host', 'cms-hop-host--cta', 'cms-hop-host--row', 'cms-hop-host--card'].forEach(function (c) { d.classList.remove(c); });
            if (d.hasAttribute('class') && !d.getAttribute('class')) d.removeAttribute('class');
          });
          clone.querySelectorAll && clone.querySelectorAll('.stats__v[data-count]').forEach(function (el) {
            var n = String(el.textContent || '').replace(/\D+/g, '');
            if (n) el.setAttribute('data-count', n);
          });
          return clone;
        };

        var finish = function (map) {
          needs.forEach(function (nd) { spreadFlow(nd, map); });
          machPlan.forEach(function (m) { spreadFlow(m.h3, map); spreadFlow(m.tx, map); spreadFlow(m.ask, map); });
          filmPlan.forEach(function (f) { spreadFlow(f.title, map); });
          if (modelPlan) {
            modelPlan.rows.forEach(function (r) { spreadFlow(r.label, map); });
            modelPlan.columns.forEach(function (c) { spreadFlow(c.name, map); (c.values || []).forEach(function (v) { spreadFlow(v, map); }); });
          }
          var pairs = i18nPairBox();
          pairs.fromForm(form);
          needs.forEach(function (nd) { pairs.fromPlan(nd, map); });
          machPlan.forEach(function (m) {
            if (m.h3) pairs.fromPlan(m.h3, map);
            if (m.tx) pairs.fromPlan(m.tx, map);
            if (m.ask) pairs.fromPlan(m.ask, map);
          });
          if (modelPlan) {
            modelPlan.rows.forEach(function (r) { if (r.label) pairs.fromPlan(r.label, map); });
            modelPlan.columns.forEach(function (c) {
              if (c.name) pairs.fromPlan(c.name, map);
              (c.values || []).forEach(function (v) { pairs.fromPlan(v, map); });
            });
          }
          filmPlan.forEach(function (f) { if (f.title) pairs.fromPlan(f.title, map); });
          var copy = (p.copy || []).map(function (c) { return { kind: c.kind }; });
          var sh = p.shared || {};
          var shared = {
            form: (sh.form || []).map(function (c) { return { kind: c.kind }; }),
            ftr: (sh.ftr || []).map(function (c) { return { kind: c.kind }; })
          };
          var sharedDirty = false;
          var dumpHtml = function (nd) {
            var html = ukClone(nd, map).innerHTML.trim();
            var host = nd.node;
            if (host && host.style && host.style.color && !/color\s*:/i.test(html)) {
              html = '<span style="color:' + host.style.color + '">' + html + '</span>';
            }
            return html;
          };
          function dumpNodeHtml(node) {
            var key = keyOf(node);
            var plan = null;
            if (key != null) needs.forEach(function (nd) { if (!plan && String(nd.key) === String(key)) plan = nd; });
            if (plan) return dumpHtml(plan);
            var tmp = { node: node, key: key, nodes: [] };
            return ukClone(tmp, map).innerHTML.trim();
          }
          function madeListOf(node) {
            if (!node || !node.closest) return null;
            var made = node.closest('[data-cms-list]');
            return made && /^(UL|OL)$/.test(made.tagName) ? made : null;
          }
          function listItemHtmls(list, skip) {
            var out = [];
            Array.prototype.forEach.call(list.children, function (li) {
              if (li === skip || li.tagName !== 'LI' || li.hasAttribute('data-cms-deleted')) return;
              var html = dumpNodeHtml(li);
              if (hasWords(String(html || '').replace(/<[^>]*>/g, ' '))) out.push(html);
            });
            return out;
          }
          if (st.doc) {
            st.doc.querySelectorAll('[data-cms-copy]').forEach(function (node) {
              var key = String(keyOf(node) || '');
              if (!/^\d+$/.test(key)) return;
              var plan = null;
              needs.forEach(function (nd) { if (!plan && String(nd.key) === key) plan = nd; });
              if (!plan) return;
              var dumped = dumpHtml(plan);
              if (!dumped) return;
              copy[+key] = { kind: ((p.copy || [])[+key] || {}).kind || kindOf(node), html: dumped };
              var made = madeListOf(node);
              if (made && node.tagName === 'LI') {
                copy[+key].asList = (made.getAttribute('data-cms-list') === 'ol' || made.tagName === 'OL') ? 'ol' : 'ul';
                var extras = listItemHtmls(made, node);
                if (extras.length) copy[+key].after = extras;
              }
            });
            var slot = function (key) {
              if (!copy[key]) copy[key] = { kind: ((p.copy || [])[key] || {}).kind || '' };
              return copy[key];
            };
            st.doc.querySelectorAll('[data-cms-copy][data-cms-deleted]').forEach(function (node) {
              var key = String(keyOf(node) || '');
              if (/^\d+$/.test(key)) slot(+key).delete = true;
            });
            st.doc.querySelectorAll('[data-cms-new]').forEach(function (node) {
              var made = madeListOf(node);
              if (made) {
                if (made.querySelector('[data-cms-copy]')) return;
                var first = null;
                Array.prototype.forEach.call(made.children, function (li) {
                  if (!first && li.tagName === 'LI' && !li.hasAttribute('data-cms-deleted')) first = li;
                });
                if (node !== first) return;
              }
              var key = keyOf(node);
              var plan = null;
              needs.forEach(function (nd) { if (!plan && String(nd.key) === key) plan = nd; });
              if (!plan) return;
              var html = dumpHtml(plan);
              if (!hasWords(html.replace(/<[^>]*>/g, ' '))) return;
              var anchor = null, side = 'after', s;
              var from = made || node;
              for (s = from.previousElementSibling; s && !anchor; s = s.previousElementSibling) {
                if (s.hasAttribute('data-cms-copy')) anchor = s;
              }
              if (!anchor) {
                side = 'before';
                for (s = from.nextElementSibling; s && !anchor; s = s.nextElementSibling) {
                  if (s.hasAttribute('data-cms-copy')) anchor = s;
                }
              }
              if (!anchor) return;
              var box = slot(+keyOf(anchor));
              if (made) {
                (box[side] = box[side] || []).push({
                  asList: (made.getAttribute('data-cms-list') === 'ol' || made.tagName === 'OL') ? 'ol' : 'ul',
                  items: [html].concat(listItemHtmls(made, node))
                });
                return;
              }
              var cls = String(node.getAttribute('class') || '').split(/\s+/).filter(function (c) {
                return c && c.indexOf('cms-') !== 0;
              }).join(' ');
              (box[side] = box[side] || []).push({
                html: html,
                tag: (node.tagName || 'P').toLowerCase(),
                className: cls
              });
            });
          }
          needs.forEach(function (nd) {
            var key = String(nd.key);
            if (!/^(form|ftr):\d+$/.test(key)) return;
            var html = dumpHtml(nd);
            var sp = key.split(':');
            if (shared[sp[0]] && shared[sp[0]][+sp[1]]) {
              shared[sp[0]][+sp[1]] = { kind: shared[sp[0]][+sp[1]].kind, html: html };
              sharedDirty = true;
            }
          });

          var images = (p.images || []).map(function (im, i) {
            var shown = st.doc && st.doc.querySelector('[data-cms-img="' + i + '"]');
            var shownSrc = shown ? String(shown.getAttribute('src') || '').split('?')[0] : '';
            var row = { src: st.images[i] || shownSrc || im.src, kind: im.kind, alt: im.alt || '' };
            if (st.crops[i]) row.crop = fmtCrop(st.crops[i]);
            else if (im.crop) row.crop = im.crop;
            return row;
          });
          var heroChanged = null;
          (p.images || []).forEach(function (im, i) { if (im.kind === 'hero' && st.images[i]) heroChanged = st.images[i]; });

          var g = function (row, sel) { return packed(row.querySelector(sel)); };
          var payload = {
            action: 'cms.page.save',
            id: p.id,
            meta: { title: val(form, 'title'), desc: val(form, 'desc'), ogtitle: val(form, 'ogtitle'), og: val(form, 'og') },
            images: images,
            copy: copy,
            i18nPairs: pairs.list()
          };
          if (heroChanged) payload.hero = { image: heroChanged };
          if (sharedDirty) payload.shared = shared;
          if (modelPlan && st.modelsDirty) {
            payload.models = {
              hasShots: modelPlan.hasShots,
              wide: modelPlan.wide,
              rows: modelPlan.rows.map(function (r) { return { label: r.label ? normTxt(ukClone(r.label, map).textContent) : '' }; }),
              columns: modelPlan.columns.map(function (c) {
                return {
                  name: c.name ? normTxt(ukClone(c.name, map).textContent) : '',
                  image: c.image || '',
                  alt: c.alt || '',
                  values: c.values.map(function (v) { return ukClone(v, map).innerHTML.trim() || '—'; })
                };
              })
            };
          }
          if (filmPlan.length && st.filmsDirty) {
            payload.films = filmPlan.map(function (f) {
              return {
                title: f.title ? normTxt(ukClone(f.title, map).textContent) : '',
                video: f.video || ''
              };
            });
          }
          if (machBox && (st.machDirty || st.structDirty || needs.some(function (nd) { return String(nd.key).indexOf(':') >= 0; }))) {
            payload.mach = machPlan.map(function (m) {
              var title = m.h3 ? normTxt(ukClone(m.h3, map).textContent) : '';
              var html = m.tx ? ukClone(m.tx, map).innerHTML.trim() : '';
              var askT = m.ask ? normTxt(ukClone(m.ask, map).textContent) : '';
              var pic = m.art.querySelector('.mach__pic');
              var vidIn = m.row.querySelector('input[name^="m-video-"]');
              var ytBtn = m.art.querySelector('.yt[data-vid]');
              var video = vidIn ? parseYt(vidIn.value) : (ytBtn ? ytBtn.getAttribute('data-vid') : '');
              var image = video ? '' : ((pic && pic.getAttribute('src')) || g(m.row, 'input[name^="m-image-"]') || '');
              return {
                id: g(m.row, 'input[name^="m-id-"]') || m.art.id || '',
                title: title,
                videoTitle: title,
                html: html,
                ask: askT,
                topic: g(m.row, 'input[name^="m-topic-"]') || title,
                video: video || '',
                image: image
              };
            });
          }
          if (faqBox && st.structDirty) {
            payload.faq = [];
            Array.prototype.forEach.call(faqBox.querySelectorAll('.repeat__i'), function (row) {
              payload.faq.push({ q: g(row, 'input[name^="f-q-"]'), a: g(row, 'textarea[name^="f-a-"]') });
            });
          }
          var peopleBox = el.querySelector('#people');
          if (peopleBox && st.structDirty) {
            payload.people = [];
            Array.prototype.forEach.call(peopleBox.querySelectorAll('.repeat__i'), function (row) {
              payload.people.push({
                role: g(row, 'input[name^="p-role-"]'),
                name: g(row, 'input[name^="p-name-"]'),
                email: g(row, 'input[name^="p-email-"]'),
                phones: (g(row, 'textarea[name^="p-phones-"]') || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean)
              });
            });
          }
          flash(t('Zapisuję…'));
          api(payload).then(function (res) {
            if (!res.ok) { fail(res.error || t('Nie zapisano')); return; }
            var echo = res.copyEcho || {};
            var lost = [];
            var mark = function (html) {
              var s = '';
              if (/color\s*:/i.test(html)) s += 'c';
              if (/<(b|strong)\b/i.test(html)) s += 'b';
              if (/<(i|em)\b/i.test(html)) s += 'i';
              if (/<u\b/i.test(html)) s += 'u';
              if (/<a\b[^>]*href=/i.test(html)) s += 'a';
              return s;
            };
            (payload.copy || []).forEach(function (it, i) {
              if (!it || it.html == null) return;
              var want = mark(it.html);
              if (!want) return;
              var got = mark(String(echo[i] != null ? echo[i] : echo[String(i)] || ''));
              if (want.split('').some(function (ch) { return got.indexOf(ch) === -1; })) lost.push(i);
            });
            if (lost.length) {
              fail(t('Zapis nie utrwalił formatowania na serwerze. Nie przeładowuję panelu — spróbuj zapisać jeszcze raz.'));
              return;
            }
            st.busy = false;
            var n = (res.i18n && res.i18n.translated) || 0;
            var view = el.querySelector('#btn-view-live');
            var liveUrl = (p.url || (p.meta && p.meta.url) || '');
            if (view && liveUrl) view.href = liveUrl.replace(/\?.*$/, '') + '?_=' + Date.now();
            if (!res.built) {
              fail(t('Zapisano szkic, ale witryna się nie przebudowała. Spróbuj jeszcze raz.'));
              return;
            }
            flash(n ? tf('Zapisano na witrynie ({n} fraz). Kliknij „Zobacz na stronie”.', { n: n }) : t('Zapisano na witrynie. Kliknij „Zobacz na stronie”.'));
            openEditor(p.id, { scrollY: st.win ? st.win.scrollY : 0, trail: 'keep' });
          }).catch(function () { fail(t('Błąd połączenia — nie zapisano.')); });
        };

        if (!texts.length) { finish({}); return; }
        flash(t('Tłumaczę zmienione teksty na ukraiński…'));
        api({ action: 'cms.translate', sl: EDIT_LANG, tl: 'uk', texts: texts }).then(function (res) {
          finish((res && res.map) || {});
        }).catch(function () { finish({}); });
      });
    }
  }

  function loadVideos() {
    var el = document.getElementById('view-videos');
    el.innerHTML = '<p class="empty">' + esc(t('Ładuję katalog wideo…')) + '</p>';
    api({ action: 'cms.videos.get' }).then(function (data) {
      if (!data.ok) { el.innerHTML = '<p class="err">' + esc(data.error) + '</p>'; return; }
      videoState = data.categories || [];
      renderVideos(el);
    });
  }

  function allFlat(cats) {
    var out = [];
    cats.forEach(function (c) {
      (c.videos || []).forEach(function (v) {
        out.push({ id: v.id, title: v.title, cat: c.key, added: v.added || '', catLabel: c.label });
      });
    });
    out.sort(function (a, b) { return String(b.added).localeCompare(String(a.added)); });
    return out;
  }

  function uniqueVideos(cats) {
    var byId = {};
    var order = [];
    (cats || []).forEach(function (c) {
      (c.videos || []).forEach(function (v) {
        if (!v || !v.id) return;
        if (!byId[v.id]) {
          byId[v.id] = { id: v.id, title: v.title || '', added: v.added || '', cats: [] };
          order.push(v.id);
        }
        if (byId[v.id].cats.indexOf(c.key) === -1) byId[v.id].cats.push(c.key);
        if (v.title) byId[v.id].title = v.title;
        if (v.added && v.added > (byId[v.id].added || '')) byId[v.id].added = v.added;
      });
    });
    return order.map(function (id) { return byId[id]; });
  }

  function catChecks(name, selected, catOpts) {
    selected = selected || [];
    var picks = (catOpts || []).map(function (o) {
      var on = selected.indexOf(o.v) !== -1;
      return '<label class="cat-pick"><input type="checkbox" name="' + esc(name) + '" value="' + esc(o.v) + '"' + (on ? ' checked' : '') + '> ' + esc(o.l) + '</label>';
    }).join('');
    return '<div class="field cat-field"><span>' + esc(t('Kategorie')) + '</span><div class="cat-picks">' + picks + '</div></div>';
  }

  function checkedVals(root, name) {
    var out = [];
    if (!root) return out;
    Array.prototype.forEach.call(root.querySelectorAll('input[name="' + name + '"]:checked'), function (inp) {
      if (out.indexOf(inp.value) === -1) out.push(inp.value);
    });
    return out;
  }

  function renderVideos(el) {
    var cats = videoState || [];
    var catOpts = cats.map(function (c) { return { v: c.key, l: ct(c.label || c.key) }; });
    var html = '<form class="ed" id="form-videos" style="max-width:960px">' +
      '<div class="cms-head"><div><h1>' + esc(t('Wideo')) + '</h1><p>' + esc(t('Dodaj film z YouTube i przypisz jedną albo dwie kategorie. Tytuły wpisujesz po angielsku — zapis tłumaczy je na ukraiński.')) + '</p></div></div>' +
      '<p class="home-note">' + esc(t('Najnowszy film wchodzi na pierwsze miejsce w sekcji na stronie głównej. Piąty schodzi z siatki.')) + '</p>' +
      '<div class="ed-card"><h2>' + esc(t('Nowy film')) + '</h2><div class="vid-add">' +
      field(t('Link YouTube albo ID'), 'new-id', '', { skipI18n: true }) +
      field(t('Tytuł'), 'new-title', '', { content: true }) +
      '<button type="button" class="btn" id="btn-add-vid">' + esc(t('Dodaj')) + '</button>' +
      catChecks('new-cat', catOpts[0] ? [catOpts[0].v] : [], catOpts) +
      '</div></div>' +
      '<div class="ed-card"><div class="repeat__top"><h2>' + esc(t('Wszystkie filmy')) + '</h2></div><div class="vid-list" id="vid-list">';
    uniqueVideos(cats).forEach(function (row, i) {
      html += '<div class="vid-row" data-i="' + i + '">' +
        '<img src="' + esc(ytSrc(row.id)) + '" alt="" onerror="this.src=\'https://i.ytimg.com/vi/' + esc(row.id) + '/hqdefault.jpg\'">' +
        '<div class="fields">' +
          field(t('Tytuł'), 'vt-' + i, row.title, { content: true }) +
          catChecks('vc-' + i, row.cats, catOpts) +
          '<input type="hidden" name="vid-' + i + '" value="' + esc(row.id) + '">' +
          '<input type="hidden" name="va-' + i + '" value="' + esc(row.added || '') + '">' +
        '</div>' +
        '<button type="button" class="icon-btn danger js-del-vid">' + esc(t('Usuń')) + '</button></div>';
    });
    html += '</div></div>';
    html += '<div class="ed-card"><h2>' + esc(t('Kategorie')) + '</h2>';
    cats.forEach(function (c, ci) {
      html += field(t('Nazwa kategorii'), 'c-label-' + ci, c.label, { content: true }) +
        '<input type="hidden" name="c-key-' + ci + '" value="' + esc(c.key) + '">' +
        field(t('Opis'), 'c-desc-' + ci, c.desc, { area: true, content: true });
    });
    html += '</div><div class="ed-actions"><button class="btn" type="submit">' + esc(t('Zapisz')) + '</button></div></form>';
    el.innerHTML = html;
    hydrateEdit(el);

    el.querySelector('#btn-add-vid').addEventListener('click', function () {
      var form = el.querySelector('#form-videos');
      var id = parseYt(form.querySelector('[name="new-id"]').value);
      var title = form.querySelector('[name="new-title"]').value.trim();
      var picked = checkedVals(form, 'new-cat');
      if (!id) { flash(t('Wklej link YouTube albo ID filmu.')); return; }
      if (!title) { flash(t('Wpisz tytuł filmu.')); return; }
      if (!picked.length) { flash(t('Zaznacz przynajmniej jedną kategorię.')); return; }
      var now = new Date().toISOString().slice(0, 19);
      var added = false;
      videoState.forEach(function (c) {
        var keepOthers = (c.videos || []).filter(function (v) { return v.id !== id; });
        if (picked.indexOf(c.key) !== -1) {
          keepOthers.unshift({ id: id, title: title, cat: c.key, added: now });
          added = true;
        }
        c.videos = keepOthers;
      });
      if (!added && videoState[0]) videoState[0].videos.unshift({ id: id, title: title, added: now });
      renderVideos(el);
      flash(t('Film dodany — zapisz, żeby wszedł na stronę.'));
    });
    el.querySelectorAll('.js-del-vid').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.closest('.vid-row');
        var id = row.querySelector('input[name^="vid-"]').value;
        videoState.forEach(function (c) {
          c.videos = (c.videos || []).filter(function (v) { return v.id !== id; });
        });
        renderVideos(el);
      });
    });
    el.querySelector('#form-videos').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      resolveContent(form, function () {
        var byCat = {};
        videoState.forEach(function (c, ci) {
          byCat[c.key] = {
            key: packed(form.querySelector('[name="c-key-' + ci + '"]')) || c.key,
            label: packed(form.querySelector('[name="c-label-' + ci + '"]')) || c.label,
            desc: packed(form.querySelector('[name="c-desc-' + ci + '"]')) || c.desc,
            videos: []
          };
        });
        var missing = false;
        Array.prototype.forEach.call(form.querySelectorAll('.vid-row'), function (row, i) {
          var id = row.querySelector('input[name^="vid-"]').value;
          var title = packed(row.querySelector('input[name^="vt-"]'));
          var added = row.querySelector('input[name^="va-"]').value;
          var picked = checkedVals(row, 'vc-' + i);
          if (!picked.length) { missing = true; return; }
          picked.forEach(function (cat) {
            if (!byCat[cat]) return;
            byCat[cat].videos.push({ id: id, title: title, added: added });
          });
        });
        if (missing) {
          btn.disabled = false;
          flash(t('Każdy film musi mieć przynajmniej jedną kategorię.'));
          return;
        }
        var cats = videoState.map(function (c) { return byCat[c.key]; }).filter(Boolean);
        var pairs = i18nPairBox();
        pairs.fromForm(form);
        api({ action: 'cms.videos.save', categories: cats, i18nPairs: pairs.list() }).then(function (res) {
          btn.disabled = false;
          if (!res.ok) { flash(res.error || t('Błąd')); return; }
          videoState = (res.videos && res.videos.categories) || cats;
          flash(t('Zapisano. Katalog wideo jest już na witrynie.'));
          renderVideos(el);
        }).catch(function () { btn.disabled = false; });
      });
    });
  }

  function loadSettings() {
    var el = document.getElementById('view-settings');
    el.innerHTML = '<p class="empty">' + esc(t('Ładuję…')) + '</p>';
    api({ action: 'cms.settings.get' }).then(function (data) {
      if (!data.ok) { el.innerHTML = '<p class="err">' + esc(data.error) + '</p>'; return; }
      var s = data.settings || {};
      el.innerHTML = '<form class="ed" id="form-set"><div class="cms-head"><div><h1>' + esc(t('Ustawienia')) + '</h1><p>' + esc(t('Telefon, e-mail i social — w nagłówku, stopce i kontakcie. Teksty wpisujesz po angielsku.')) + '</p></div></div><div class="ed-card stack">' +
        field(t('Telefon (widoczny)'), 'phone', s.phone, { skipI18n: true }) +
        field(t('Telefon w linku tel:'), 'phoneTel', s.phoneTel, { skipI18n: true }) +
        field(t('E-mail'), 'email', s.email, { skipI18n: true }) +
        field(t('Adres krótki'), 'addressShort', s.addressShort, { content: true }) +
        field(t('Adres pełny'), 'addressLine', s.addressLine, { content: true }) +
        field(t('Firma'), 'company', s.company, { skipI18n: true }) +
        field('YouTube', 'youtube', s.youtube, { skipI18n: true }) +
        field('Instagram', 'instagram', s.instagram, { skipI18n: true }) +
        field(t('Tekst w stopce'), 'footer', s.footer, { area: true, content: true }) +
        '</div><div class="ed-actions"><button class="btn" type="submit">' + esc(t('Zapisz')) + '</button>' +
        '<button class="btn btn-ghost" type="button" id="go-media">' + esc(t('Biblioteka zdjęć')) + '</button></div></form>';
      hydrateEdit(el);
      el.querySelector('#go-media').addEventListener('click', function () { setView('media'); });
      el.querySelector('#form-set').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = e.target;
        var btn = f.querySelector('button[type="submit"]');
        btn.disabled = true;
        resolveContent(f, function () {
          var pairs = i18nPairBox();
          pairs.fromForm(f);
          api({
            action: 'cms.settings.save',
            i18nPairs: pairs.list(),
            settings: {
              phone: val(f, 'phone'), phoneTel: val(f, 'phoneTel'), email: val(f, 'email'),
              addressShort: val(f, 'addressShort'), addressLine: val(f, 'addressLine'),
              company: val(f, 'company'), youtube: val(f, 'youtube'), instagram: val(f, 'instagram'),
              footer: val(f, 'footer')
            }
          }).then(function (res) {
            btn.disabled = false;
            flash(res.ok ? t('Zapisano. Ustawienia są już na witrynie.') : (res.error || t('Błąd')));
          });
        });
      });
    });
  }

  function loadMedia() {
    var el = document.getElementById('view-media');
    if (!el) return;
    el.innerHTML = '<p class="empty">' + esc(t('Ładuję media…')) + '</p>';
    api({ action: 'cms.media.list' }).then(function (data) {
      if (!data.ok) { el.innerHTML = '<p class="err">' + esc(data.error) + '</p>'; return; }
      var html = '<div class="cms-head"><div><h1>' + esc(t('Zdjęcia')) + '</h1><p>' + esc(t('Wgraj plik, potem podmień zdjęcie na stronie.')) + '</p></div></div>' +
        '<label class="drop" id="drop">' + esc(t('Wybierz plik')) + '</label>' +
        '<div class="media-grid" id="media-grid" style="margin-top:1rem">';
      (data.media || []).forEach(function (m) {
        html += '<a href="' + esc(m.url) + '" target="_blank" rel="noopener"><img src="' + esc(m.url) + '" alt=""><span></span></a>';
      });
      html += '</div>';
      el.innerHTML = html;
      el.querySelectorAll('#media-grid span').forEach(function (s, i) {
        s.textContent = (data.media[i] && data.media[i].url) || '';
      });
      el.querySelector('#drop').addEventListener('click', function () {
        uploadFile(function (url) { flash(t('Wgrano') + ': ' + url); loadMedia(); });
      });
    });
  }

  function applyPayload(data) {
    if (data.csrf) csrf = data.csrf;
    if (data.items) items = data.items;
    if (typeof data.pages === 'number') overview.pages = data.pages;
    if (typeof data.machines === 'number') overview.machines = data.machines;
    if (typeof data.machItems === 'number') overview.machItems = data.machItems;
    if (typeof data.videos === 'number') overview.videos = data.videos;
    if (typeof data.pending === 'boolean') overview.pending = data.pending;
    if (data.step) show(data.step);
    if (data.step === 'app') {
      renderList();
      setView(currentView && currentView !== 'login' ? currentView : 'dash');
      syncPublishBtn();
    }
  }

  if (listEl) listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.item');
    if (btn && btn.dataset.id) openItem(btn.dataset.id);
  });
  side.addEventListener('click', function (e) {
    var btn = e.target.closest('.side__i');
    if (btn && btn.getAttribute('data-view')) setView(btn.getAttribute('data-view'));
  });
  document.getElementById('btn-side').addEventListener('click', function () {
    side.classList.toggle('is-open');
  });

  document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('login-err');
    err.hidden = true;
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    var form = e.target;
    var tryLogin = function (retried) {
      return api({ action: 'login', user: form.user.value, pass: form.pass.value }).then(function (data) {
        if (!data.ok && !retried && data.csrf) return tryLogin(true);
        btn.disabled = false;
        if (!data.ok) {
          err.hidden = false;
          err.textContent = data.error || t('Nie udało się zalogować.');
          return;
        }
        form.pass.value = '';
        applyPayload(data);
      });
    };
    tryLogin(false).catch(function () {
      btn.disabled = false;
      err.hidden = false;
      err.textContent = t('Brak połączenia z serwerem.');
    });
  });

  function otpValue() {
    return otpInputs.map(function (i) { return i.value.replace(/\D/g, ''); }).join('').slice(0, 6);
  }
  otpInputs.forEach(function (input, idx) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(-1);
      if (input.value && otpInputs[idx + 1]) otpInputs[idx + 1].focus();
      if (otpValue().length === 6) document.getElementById('form-totp').requestSubmit();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && otpInputs[idx - 1]) otpInputs[idx - 1].focus();
    });
    input.addEventListener('paste', function (e) {
      var text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!text) return;
      e.preventDefault();
      text.split('').forEach(function (ch, i) { if (otpInputs[i]) otpInputs[i].value = ch; });
      if (text.length === 6) document.getElementById('form-totp').requestSubmit();
    });
  });
  document.getElementById('form-totp').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('totp-err');
    err.hidden = true;
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    api({ action: 'totp', code: otpValue() }).then(function (data) {
      btn.disabled = false;
      if (!data.ok) {
        err.hidden = false;
        err.textContent = data.error || t('Nieprawidłowy kod.');
        otpInputs.forEach(function (i) { i.value = ''; });
        otpInputs[0].focus();
        return;
      }
      currentView = 'dash';
      applyPayload(data);
      api({ action: 'cms.overview' }).then(function (o) {
        if (o.ok) { overview = o; syncPublishBtn(); renderDash(); }
      });
    }).catch(function () {
      btn.disabled = false;
      err.hidden = false;
      err.textContent = t('Brak połączenia z serwerem.');
    });
  });

  document.getElementById('btn-back').addEventListener('click', function () {
    api({ action: 'logout' }).then(function () { show('login'); });
  });
  document.getElementById('btn-logout').addEventListener('click', function () {
    api({ action: 'logout' }).then(function () {
      items = [];
      activeId = '';
      show('login');
    });
  });
  document.getElementById('btn-publish').addEventListener('click', function () {
    if (!overview.pending) return;
    if (!confirm(t('Zatwierdzić zapisane zmiany na witrynie? Klienci zobaczą nową wersję strony.'))) return;
    var btn = document.getElementById('btn-publish');
    btn.disabled = true;
    flash(t('Publikuję na witrynie…'));
    api({ action: 'cms.publish' }).then(function (res) {
      if (!res.ok) {
        flash(res.error || t('Nie opublikowano'));
        syncPublishBtn();
        return;
      }
      overview.pending = false;
      syncPublishBtn();
      flash(t('Zatwierdzono. Witryna pokazuje zapisaną wersję.'));
      if (currentView === 'dash') renderDash();
      if (currentView === 'pages') loadPages();
    }).catch(function () {
      syncPublishBtn();
      flash(t('Błąd połączenia — nie opublikowano.'));
    });
  });
  if (q) q.addEventListener('input', renderList);
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
    tab.addEventListener('click', function () {
      filter = tab.getAttribute('data-filter');
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tb) {
        tb.classList.toggle('is-on', tb === tab);
      });
      renderList();
    });
  });

  api({ action: 'status' }).then(function (data) {
    if (!data.ok && data._status === 503) {
      show('login');
      var err = document.getElementById('login-err');
      err.hidden = false;
      err.textContent = data.error || t('Panel nie jest skonfigurowany.');
      return;
    }
    applyPayload(data);
    if (data.step === 'app') {
      api({ action: 'cms.overview' }).then(function (o) {
        if (o.ok) { overview = o; syncPublishBtn(); if (currentView === 'dash') renderDash(); }
      });
    }
  }).catch(function () {
    show('login');
  });

  setInterval(function () {
    if (!appView || appView.hidden) return;
    api({ action: 'status' }, true);
  }, 3 * 60 * 1000);
})();
