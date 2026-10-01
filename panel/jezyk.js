(function () {
  'use strict';

  function t(key) {
    return key || '';
  }

  function tf(key, vars) {
    var s = t(key);
    Object.keys(vars || {}).forEach(function (k) {
      s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
    return s;
  }

  function apply(root) {
    root = root || document;
    document.documentElement.setAttribute('lang', 'pl');
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
  }

  window.STAdmin = {
    t: t,
    tf: tf,
    lang: function () { return 'pl'; },
    setLang: function () { apply(); },
    apply: apply
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(); });
  } else {
    apply();
  }
})();
