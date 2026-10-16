/* Shared editor rules: stale translation replies, history keys, colour, plain paste. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.STEdit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var PALETTE = ['#161616', '#5c5c5c', '#d10a11', '#c2410c', '#0f766e', '#1d4ed8', '#7c3aed'];

  function bump(gen) {
    return (gen | 0) + 1;
  }

  function isCurrent(started, now) {
    return started === now;
  }

  /* A late translation must not replace text the user has edited since the request started. */
  function applyIfCurrent(started, now, currentText, incoming) {
    if (started !== now) return currentText;
    return incoming;
  }

  /* A whole Ukrainian sentence may replace its English translation.
     It must not replace a short fragment left behind after a split (Undo, then Bold). */
  function canRevealSource(src, cur) {
    src = src == null ? '' : String(src);
    cur = cur == null ? '' : String(cur);
    if (!cur || src === cur) return true;
    if (/[\u0400-\u04FF]/.test(src) && !/[\u0400-\u04FF]/.test(cur) && src.length > cur.length * 1.6 && src.length - cur.length > 8) return false;
    return true;
  }

  function normalizeHex(raw) {
    var s = String(raw || '').trim().toLowerCase();
    if (!s) return '';
    if (/^[0-9a-f]{6}$/.test(s)) s = '#' + s;
    if (/^#[0-9a-f]{3}$/.test(s)) {
      s = '#' + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2) + s.charAt(3) + s.charAt(3);
    }
    if (!/^#[0-9a-f]{6}$/.test(s)) return '';
    return s;
  }

  function plainPaste(text) {
    var s = String(text == null ? '' : text);
    if (/<[a-z!/]/i.test(s)) {
      s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '');
      s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"');
    }
    return s.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /* Ctrl+Z / Ctrl+Y always drive the editor history, including while a paragraph is being edited.
     Fields that are real inputs keep the browser's own history. */
  function editorHistoryAction(e) {
    e = e || {};
    var tag = String(e.tag || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return '';
    if (!(e.ctrl || e.meta)) return '';
    var key = String(e.key || '');
    var z = key === 'z' || key === 'Z';
    var y = key === 'y' || key === 'Y';
    if (z && !e.shift) return 'undo';
    if (y || (z && e.shift)) return 'redo';
    return '';
  }

  return {
    PALETTE: PALETTE,
    bump: bump,
    isCurrent: isCurrent,
    applyIfCurrent: applyIfCurrent,
    canRevealSource: canRevealSource,
    normalizeHex: normalizeHex,
    plainPaste: plainPaste,
    editorHistoryAction: editorHistoryAction
  };
});
