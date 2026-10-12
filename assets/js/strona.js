/* SMOLTECH UA — progressive enhancement only. Nothing here is required to read the site. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  $$('.ticks li').forEach(function (li) {
    if (!String(li.textContent || '').replace(/\u00a0/g, ' ').trim()) li.hidden = true;
  });

  /* ---------------- mobile drawer ---------------- */
  var drawer = $('#drawer');
  var burger = $('#burger');

  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('is-locked', open);
    if (open) {
      var first = drawer.querySelector('a, button');
      if (first) first.focus({ preventScroll: true });
    } else {
      burger.focus({ preventScroll: true });
    }
  }

  if (burger) burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
  var closeBtn = $('#drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (drawer) {
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawer && drawer.classList.contains('is-open')) setDrawer(false);
    $$('.nav__item--has-menu').forEach(closeMegaItem);
  });

  /* drawer accordions */
  $$('.drawer__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.classList.toggle('is-open', !open);
    });
  });

  /* ---------------- desktop dropdowns (click/keyboard; hover is CSS) ---------------- */
  function collapseMegaSpot(scope) {
    var root = scope || document;
    $$('[data-mega-toggle]', root).forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var fly = btn.closest('.mega__fly');
      btn.setAttribute('aria-expanded', 'false');
      if (panel) panel.classList.remove('is-open');
      if (fly) fly.classList.remove('is-open');
    });
  }

  function closeMegaItem(item) {
    if (!item) return;
    item.classList.remove('is-open');
    collapseMegaSpot(item);
    /* Drop focus so CSS :focus-within does not keep the mega visible after mouseleave. */
    var ae = document.activeElement;
    if (ae && item.contains(ae) && typeof ae.blur === 'function') ae.blur();
  }

  $$('.nav__item--has-menu > .nav__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var item = link.parentNode;
      var href = link.getAttribute('href') || '';
      var hashOnly = href === '#' || href === '';
      var coarse = window.matchMedia('(hover: none)').matches;
      if (hashOnly) e.preventDefault();
      // Desktop + real URL: follow link (stud welding). Coarse / hash: tap-to-open.
      if (!coarse && !hashOnly) return;
      if (!coarse && hashOnly) return; // hover CSS opens the mega
      if (!item.classList.contains('is-open')) {
        e.preventDefault();
        $$('.nav__item.is-open').forEach(function (i) { if (i !== item) closeMegaItem(i); });
        item.classList.add('is-open');
      }
    });
  });

  $$('[data-mega-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var fly = btn.closest('.mega__fly');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.classList.toggle('is-open', !open);
      if (fly) fly.classList.toggle('is-open', !open);
    });
  });

  $$('.nav__item--has-menu').forEach(function (item) {
    item.addEventListener('mouseleave', function () {
      closeMegaItem(item);
    });
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.nav__item--has-menu')) return;
    $$('.nav__item--has-menu').forEach(closeMegaItem);
  });

  /* homepage area pick menus */
  $$('.area__pick-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      if (!menu) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.area__pick-btn[aria-expanded="true"]').forEach(function (other) {
        if (other === btn) return;
        other.setAttribute('aria-expanded', 'false');
        var m = document.getElementById(other.getAttribute('aria-controls'));
        if (m) m.hidden = true;
      });
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      menu.hidden = open;
    });
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.area__pick')) return;
    $$('.area__pick-btn[aria-expanded="true"]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var m = document.getElementById(btn.getAttribute('aria-controls'));
      if (m) m.hidden = true;
    });
  });

  /* ---------------- header shadow on scroll ---------------- */
  var hdr = $('.hdr');
  var totop = $('#totop');
  var lastY = -1;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y === lastY) return;
    lastY = y;
    if (hdr) hdr.classList.toggle('is-stuck', y > 12);
    if (totop) totop.classList.toggle('is-on', y > 700);
  }
  window.addEventListener('scroll', function () { window.requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  if (totop) {
    totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- reveal on scroll ----------------
     CSS keeps .rv hidden only while html.has-rv is set, so a script failure
     can never leave content invisible. */
  var rv = $$('.rv');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rv.length && !reduced) {
    root.classList.add('has-rv');
    var ticking = false;
    var sweep = function () {
      ticking = false;
      var limit = (window.innerHeight || 0) * 0.92;
      for (var i = 0; i < rv.length; ) {
        if (rv[i].getBoundingClientRect().top < limit) {
          rv[i].classList.add('is-in');
          rv.splice(i, 1);
        } else {
          i++;
        }
      }
      if (!rv.length) {
        removeEventListener('scroll', queue);
        removeEventListener('resize', queue);
      }
    };
    var queue = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sweep);
    };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    sweep();
  }

  /* ---------------- homepage hero video: muted inline autoplay (iOS/Safari) ---------------- */
  (function () {
    var v = $('.hero__video');
    if (!v) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    var tryPlay = function () {
      v.muted = true;
      v.playsInline = true;
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };
    if (v.readyState >= 2) tryPlay();
    else {
      v.addEventListener('loadedmetadata', tryPlay);
      v.addEventListener('canplay', tryPlay);
      v.addEventListener('loadeddata', tryPlay);
    }
    window.addEventListener('pageshow', tryPlay);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && v.paused) tryPlay();
    });
    var unlock = function () {
      tryPlay();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock);
  })();

  /* ---------------- homepage stats: count-up on first paint ---------------- */
  (function () {
    var box = $('.hero:not(.hero--page) .stats');
    if (!box) return;
    var vals = $$('.stats__v[data-count]', box);
    vals.forEach(function (el) {
      var digits = String(el.textContent || '').replace(/\D+/g, '');
      if (digits) el.setAttribute('data-count', digits);
    });
    if (reduced) {
      box.classList.add('is-in');
      return;
    }
    root.classList.add('has-stats');
    var anim = [];
    vals.forEach(function (el) {
      if (el.querySelector('[style*="color"], font[color]')) return;
      anim.push(el);
      el.textContent = '0';
    });

    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var count = function (el, to, dur) {
      var t0 = performance.now();
      var tick = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(ease(p) * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(function () {
      box.classList.add('is-in');
      anim.forEach(function (el, i) {
        var to = parseInt(el.getAttribute('data-count'), 10);
        if (!to) return;
        setTimeout(function () { count(el, to, 920); }, 70 + i * 110);
      });
    });
  })();

  /* ---------------- YouTube facade: exclusive playback (one at a time) ---------------- */
  $$('.yt').forEach(function (btn) {
    btn._ytFacade = btn.innerHTML;
    btn.addEventListener('click', function () {
      if (btn.querySelector('iframe')) return;
      var id = btn.getAttribute('data-vid');
      if (!id) return;

      $$('.yt').forEach(function (other) {
        if (other === btn) return;
        if (!other.querySelector('iframe')) return;
        if (other._ytFacade) other.innerHTML = other._ytFacade;
      });

      var fr = document.createElement('iframe');
      fr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      fr.title = btn.getAttribute('data-title') || (window.ST ? ST.t('SMOLTECH — відео') : 'SMOLTECH — відео');
      fr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      fr.setAttribute('allowfullscreen', '');
      fr.setAttribute('loading', 'lazy');
      btn.innerHTML = '';
      btn.appendChild(fr);
    });
  });

  /* ---------------- video category filter ---------------- */
  var chips = $$('[data-filter]');
  if (chips.length) {
    var items = $$('[data-cat]');
    var applyFilter = function (want) {
      chips.forEach(function (c) {
        c.setAttribute('aria-selected', c.getAttribute('data-filter') === want ? 'true' : 'false');
      });
      items.forEach(function (it) {
        var cats = ' ' + (it.getAttribute('data-cat') || '') + ' ';
        var show = want === 'all' || cats.indexOf(' ' + want + ' ') !== -1;
        it.hidden = !show;
        if (show) it.classList.add('is-in');
        if (!show) {
          $$('.yt', it).forEach(function (btn) {
            if (btn.querySelector('iframe') && btn._ytFacade) btn.innerHTML = btn._ytFacade;
          });
        }
      });
      var live = $('#filter-status');
      if (live) {
        var n = items.filter(function (it) { return !it.hidden; }).length;
        live.textContent = window.ST && ST.lang() === 'en'
          ? ('Showing ' + n + ' videos.')
          : ('Показано ' + n + ' відео.');
      }
    };
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        applyFilter(chip.getAttribute('data-filter'));
      });
    });
    var params = new URLSearchParams(location.search);
    var want = params.get('filter');
    if (want && chips.some(function (c) { return c.getAttribute('data-filter') === want; })) {
      applyFilter(want);
    }
    if (location.hash && /^#vid-/.test(location.hash)) {
      var target = document.getElementById(location.hash.slice(1));
      if (target && target.hasAttribute('data-cat')) {
        applyFilter((target.getAttribute('data-cat') || '').split(/\s+/)[0]);
        requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        });
      }
    }
  }

  /* ---------------- contact form ---------------- */
  var ASK_TOPIC_KEY = 'st-ask-topic';

  function setAskTopic(name) {
    if (!name) return;
    name = String(name).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (!name) return;
    if (name.length > 120) name = name.slice(0, 117) + '…';
    try { sessionStorage.setItem(ASK_TOPIC_KEY, name); } catch (e) {}
  }

  function applyAskTopic(form) {
    var name = '';
    try { name = sessionStorage.getItem(ASK_TOPIC_KEY) || ''; } catch (e) {}
    if (!name) return;
    try { sessionStorage.removeItem(ASK_TOPIC_KEY); } catch (e) {}
    var topic = (form || document).querySelector ? (form || document).querySelector('[name="topic"]') : null;
    if (!topic) topic = document.querySelector('#zapyt [name="topic"], form[data-ajax] [name="topic"]');
    if (!topic) return;
    topic.value = name;
    try { topic.dispatchEvent(new Event('input', { bubbles: true })); } catch (e2) {}
  }

  function machineTopic(mach) {
    var raw = mach.getAttribute('data-ask-topic');
    if (raw) return raw;
    var title = mach.querySelector('.mach__body h3, h3');
    if (!title) return '';
    var text = String(title.textContent || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    /* Drop the descriptive part after an em/en dash. */
    var cut = text.split(/\s+[—–]\s+/);
    if (cut.length > 1) text = cut[0].replace(/^\s+|\s+$/g, '');
    /* Prefer a model code when present (SW-51/5×200/MF, SP-8/4×75/AC/R, S-WPT…). */
    var code = text.match(/\b(?:S-WPT|[A-ZŁ]{1,4}-?[A-Z0-9]*(?:\/[A-Z0-9×x.\-]+)+)\b/);
    if (code) return code[0];
    return text;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#zapyt"], a[href*="#zapyt"]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#zapyt') === -1) return;
    var mach = a.closest('.mach');
    if (!mach) return;
    var topic = machineTopic(mach);
    if (!topic) return;
    setAskTopic(topic);
    /* Apply even when the hash is already #zapyt (no hashchange). */
    window.setTimeout(function () { applyAskTopic(); }, 0);
  });

  var PRIVACY_P =
    'Ваші персональні дані оброблятиме SMOLTECH Technika Zgrzewalnicza Sp. z o.o. з метою розгляду цього запиту. Докладніше — у нашій ' +
    '<a href="https://xtechart.com/polityka-konfidentsiynosti/" target="_blank" rel="noopener noreferrer">Політиці конфіденційності</a>.';

  var PRIVACY_HTML =
    '<div class="form-privacy">' +
      '<button type="button" class="form-privacy__i" aria-haspopup="dialog" aria-controls="form-privacy-dlg" aria-label="Інформація про обробку персональних даних">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<p class="form-privacy__text">' + PRIVACY_P + '</p>' +
    '</div>';

  function privacyDialog() {
    var dlg = document.getElementById('form-privacy-dlg');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'form-privacy-dlg';
    dlg.className = 'form-privacy__dlg';
    dlg.setAttribute('aria-label', 'Інформація про обробку персональних даних');
    dlg.innerHTML = '<button type="button" class="form-privacy__x" aria-label="Закрити">&times;</button><div class="form-privacy__dlg-body"></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('.form-privacy__x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    return dlg;
  }

  function applyPrivacyLang(p) {
    if (!p) return;
    p.innerHTML = PRIVACY_P;
    if (!window.ST || ST.lang() === 'uk') return;
    var plain = String(p.textContent || '').replace(/\s+/g, ' ').trim();
    var full = ST.t(plain);
    var linkT = ST.t('Політиці конфіденційності');
    var a = p.querySelector('a');
    if (!a || !full || full === plain) return;
    var at = full.lastIndexOf(linkT);
    if (at < 0) return;
    var first = p.firstChild;
    if (first && first.nodeType === 3) first.nodeValue = full.slice(0, at);
    a.textContent = linkT;
    if (a.nextSibling && a.nextSibling.nodeType === 3) a.nextSibling.nodeValue = full.slice(at + linkT.length);
  }

  function openPrivacyNotice(from) {
    var box = from.closest('.form-privacy');
    var src = box && box.querySelector('.form-privacy__text');
    if (!src) return;
    var dlg = privacyDialog();
    if (window.ST) {
      dlg.setAttribute('aria-label', ST.t('Інформація про обробку персональних даних'));
      dlg.querySelector('.form-privacy__x').setAttribute('aria-label', ST.t('Закрити'));
    }
    var body = dlg.querySelector('.form-privacy__dlg-body');
    body.innerHTML = src.innerHTML;
    $$('a', body).forEach(function (a) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    var y = window.scrollY || window.pageYOffset || 0;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    window.scrollTo(0, y);
  }

  function installFormPrivacy(form) {
    var consent = form.querySelector('label.consent');
    if (consent) consent.remove();
    if (!form.querySelector('.form-privacy')) {
      var wrap = document.createElement('div');
      wrap.innerHTML = PRIVACY_HTML;
      var node = wrap.firstElementChild;
      var submit = form.querySelector('button[type="submit"]');
      if (submit && submit.parentNode) submit.parentNode.after(node);
      else form.appendChild(node);
    }
    $$('.form-privacy__text', form).forEach(applyPrivacyLang);
    $$('.form-privacy__i', form).forEach(function (btn) {
      if (btn.getAttribute('data-st-privacy') === '1') return;
      btn.setAttribute('data-st-privacy', '1');
      if (window.ST) btn.setAttribute('aria-label', ST.t('Інформація про обробку персональних даних'));
      btn.addEventListener('click', function () { openPrivacyNotice(btn); });
    });
  }

  document.addEventListener('st:lang', function () {
    $$('.form-privacy__text').forEach(applyPrivacyLang);
  });

  $$('form[data-ajax]').forEach(function (form) {
    var msg = form.querySelector('.form__msg');
    var btn = form.querySelector('button[type="submit"]');
    var ts = form.querySelector('input[name="ts"]');
    var page = form.querySelector('input[name="page"]');
    installFormPrivacy(form);

    // The handler rejects submissions that arrive implausibly fast after load.
    function stamp() {
      if (ts) ts.value = String(Math.floor(Date.now() / 1000));
      if (page) page.value = location.pathname;
    }
    stamp();
    applyAskTopic(form);

    // Non-JS submissions land back here with ?sent=1
    if (/[?&]sent=1(&|$)/.test(location.search) && msg) {
      msg.className = 'form__msg is-ok';
      msg.textContent = window.ST ? ST.t('Дякуємо! Ваш запит надіслано — ми звʼяжемося з вами найближчим часом.') : 'Дякуємо! Ваш запит надіслано — ми звʼяжемося з вами найближчим часом.';
      history.replaceState(null, '', location.pathname + location.hash);
    }

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) return; // let the browser show its own hints
      e.preventDefault();
      if (msg) { msg.className = 'form__msg'; msg.textContent = ''; }
      if (btn) { btn.disabled = true; btn.textContent = window.ST ? ST.t('Надсилаємо…') : 'Надсилаємо…'; }

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (data) {
          if (data && data.ok) {
            form.reset();
            stamp();
            if (msg) {
              msg.className = 'form__msg is-ok';
              msg.textContent = window.ST ? ST.t('Дякуємо! Ваш запит надіслано — ми звʼяжемося з вами найближчим часом.') : 'Дякуємо! Ваш запит надіслано — ми звʼяжемося з вами найближчим часом.';
            }
          } else {
            throw new Error((data && data.error) || '');
          }
        })
        .catch(function (err) {
          if (msg) {
            var fail = window.ST ? ST.t('Не вдалося надіслати форму. ') : 'Не вдалося надіслати форму. ';
            var tail = window.ST ? ST.t('Напишіть нам на') : 'Напишіть нам на';
            var orCall = window.ST ? ST.t('або телефонуйте') : 'або телефонуйте';
            var reason = err && err.message ? err.message + ' ' : fail;
            msg.className = 'form__msg is-err';
            msg.innerHTML = reason + tail + ' <a href="mailto:biuro@smoltech.pl">biuro@smoltech.pl</a> ' + orCall + ' <a href="tel:+48713215427">+48 71 321 54 27</a>.';
          }
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = window.ST ? ST.t('Надіслати запит') : 'Надіслати запит'; }
        });
    });
  });

  window.addEventListener('hashchange', function () {
    if (location.hash === '#zapyt') applyAskTopic();
  });
  if (location.hash === '#zapyt') applyAskTopic();

  /* ---------------- param matrix model highlight ---------------- */
  $$('[data-param-matrix]').forEach(function (root) {
    var matrix = root.querySelector('.param-matrix');
    var buttons = $$('.model-strip__btn', root);
    if (!matrix || !buttons.length) return;

    function activate(n) {
      var i, max = Math.max(buttons.length, 24);
      for (i = 1; i <= max; i++) matrix.classList.remove('is-hl-' + i);
      matrix.classList.add('is-hl-' + n);
      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-model') === String(n);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var col = matrix.querySelector('.param-matrix__head[data-col="' + n + '"]');
      if (col && col.scrollIntoView) {
        try { col.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }); } catch (e) {}
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(parseInt(btn.getAttribute('data-model'), 10) || 1);
      });
    });
  });

  /* ---------------- client logo marquee ---------------- */
  $$('[data-marquee]').forEach(function (root) {
    var track = root.querySelector('.logos__track');
    if (!track || !track.children.length) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (node) {
      var copy = node.cloneNode(true);
      copy.classList.add('logos__item--clone');
      copy.setAttribute('aria-hidden', 'true');
      $$('img', copy).forEach(function (img) { img.alt = ''; });
      track.appendChild(copy);
    });
    track.style.setProperty('--logos-dur', Math.max(32, kids.length * 3.6) + 's');
    root.classList.add('is-marquee');
  });
})();
