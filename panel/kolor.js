/**
 * Colour and font-size for a fragment of a sentence.
 * Splits text nodes only. Never inserts characters.
 * A cleared colour unwraps the span and joins the word again.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.STColor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var IGNORE = {
    'data-stb-paint': 1,
    'data-st-at': 1,
    'data-st-en-only': 1,
    'data-st-ru-only': 1,
    'data-stb-shared': 1
  };

  function normProp(prop) {
    if (prop === 'fontSize' || prop === 'font-size') return 'font-size';
    return 'color';
  }

  function hexByte(n) {
    var s = Math.max(0, Math.min(255, n | 0)).toString(16);
    return s.length === 1 ? '0' + s : s;
  }

  function normColor(v) {
    v = String(v || '').trim();
    var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (hex) {
      var h = hex[1].toLowerCase();
      if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
      return '#' + h;
    }
    var rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v);
    if (rgb) return '#' + hexByte(+rgb[1]) + hexByte(+rgb[2]) + hexByte(+rgb[3]);
    return v;
  }

  function normValue(prop, value) {
    value = String(value || '').trim();
    if (!value) return '';
    if (prop === 'color') return normColor(value);
    return value;
  }

  function collectText(root) {
    var out = [];
    if (!root) return out;
    var doc = root.ownerDocument;
    var tw = doc.createTreeWalker(root, 4, null);
    var n = tw.nextNode();
    while (n) {
      out.push(n);
      n = tw.nextNode();
    }
    return out;
  }

  function readStyle(el) {
    var map = {};
    String(el.getAttribute('style') || '').split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return;
      var p = decl.slice(0, i).trim().toLowerCase();
      var v = decl.slice(i + 1).trim();
      if (!p || !v || p === '-webkit-text-fill-color') return;
      if (p === 'color') v = normColor(v);
      map[p] = v;
    });
    return map;
  }

  function writeStyle(el, map) {
    var parts = [];
    if (map.color) parts.push('color:' + normColor(map.color));
    if (map['font-size']) parts.push('font-size:' + map['font-size']);
    Object.keys(map).sort().forEach(function (p) {
      if (p === 'color' || p === 'font-size') return;
      parts.push(p + ':' + map[p]);
    });
    if (!parts.length) el.removeAttribute('style');
    else el.setAttribute('style', parts.join(';'));
  }

  function paintMap(el) {
    if (!el || el.nodeType !== 1 || el.tagName !== 'SPAN') return null;
    var attrs = el.attributes;
    var i;
    for (i = 0; i < attrs.length; i++) {
      var name = String(attrs[i].name || '').toLowerCase();
      if (IGNORE[name]) continue;
      if (name !== 'style') return null;
    }
    return readStyle(el);
  }

  function unwrap(el) {
    var parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  function splitAround(parent, child) {
    if (!parent || !parent.parentNode || !child || child.parentNode !== parent) return;
    if (child.previousSibling) {
      var before = parent.cloneNode(false);
      while (parent.firstChild && parent.firstChild !== child) before.appendChild(parent.firstChild);
      parent.parentNode.insertBefore(before, parent);
    }
    if (child.nextSibling) {
      var after = parent.cloneNode(false);
      while (child.nextSibling) after.appendChild(child.nextSibling);
      parent.parentNode.insertBefore(after, parent.nextSibling);
    }
  }

  function isolateTo(span, node) {
    var cur = node;
    while (cur && cur.parentNode && cur.parentNode !== span) {
      splitAround(cur.parentNode, cur);
      cur = cur.parentNode;
    }
    if (cur && cur.parentNode === span) splitAround(span, cur);
  }

  function peelProp(textNode, root, prop) {
    var el = textNode.parentNode;
    while (el && el !== root) {
      var next = el.parentNode;
      if (el.nodeType === 1 && el.tagName === 'SPAN') {
        var map = readStyle(el);
        if (map[prop]) {
          isolateTo(el, textNode);
          delete map[prop];
          writeStyle(el, map);
          var left = paintMap(el);
          if (left && !left.color && !left['font-size'] && !Object.keys(left).length) unwrap(el);
          else if (paintMap(el) && !Object.keys(paintMap(el)).length) unwrap(el);
        }
      }
      el = next;
    }
  }

  function paintText(textNode, prop, value) {
    if (!textNode || !textNode.parentNode || !textNode.nodeValue) return;
    var parent = textNode.parentNode;
    if (parent.nodeType === 1 && parent.tagName === 'SPAN' && parent.childNodes.length === 1 && parent.firstChild === textNode) {
      var existing = paintMap(parent);
      if (existing) {
        existing[prop] = value;
        writeStyle(parent, existing);
        return;
      }
    }
    var span = textNode.ownerDocument.createElement('span');
    var map = {};
    map[prop] = value;
    writeStyle(span, map);
    parent.insertBefore(span, textNode);
    span.appendChild(textNode);
  }

  function splitBoundaries(root, start, end) {
    var nodes = collectText(root);
    var acc = 0;
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var len = n.nodeValue.length;
      var cuts = [];
      if (start > acc && start < acc + len) cuts.push(start - acc);
      if (end > acc && end < acc + len && end !== start) cuts.push(end - acc);
      cuts.sort(function (a, b) { return b - a; });
      cuts.forEach(function (at) {
        if (at > 0 && at < n.nodeValue.length) n.splitText(at);
      });
      acc += len;
    }
  }

  function nodesCovering(root, start, end) {
    var nodes = collectText(root);
    var acc = 0;
    var hit = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      var len = nodes[i].nodeValue.length;
      var a = acc;
      var b = acc + len;
      if (len && a >= start && b <= end) hit.push(nodes[i]);
      acc = b;
    }
    return hit;
  }

  function removeEmpty(root) {
    var changed = false;
    var spans = Array.prototype.slice.call(root.querySelectorAll('span'));
    var i;
    for (i = spans.length - 1; i >= 0; i--) {
      var sp = spans[i];
      if (!sp.parentNode || sp.querySelector('img, svg, br')) continue;
      if (!sp.textContent) {
        sp.parentNode.removeChild(sp);
        changed = true;
      }
    }
    return changed;
  }

  function unwrapBare(root) {
    var changed = false;
    var spans = Array.prototype.slice.call(root.querySelectorAll('span'));
    var i;
    for (i = spans.length - 1; i >= 0; i--) {
      var sp = spans[i];
      if (!sp.parentNode) continue;
      var map = paintMap(sp);
      if (!map) continue;
      if (map.color || map['font-size'] || Object.keys(map).length) continue;
      /* An authored wrapper such as <span>+</span> has no style. Only a span
         the editor just cleared (empty style, or a paint marker) is unwrapped. */
      var residue = sp.getAttribute('style') !== null;
      Object.keys(IGNORE).forEach(function (name) {
        if (sp.hasAttribute(name)) residue = true;
      });
      if (!residue) continue;
      unwrap(sp);
      changed = true;
    }
    return changed;
  }

  function onlyElementChild(parent) {
    var found = null;
    var c;
    for (c = parent.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        if (/\S/.test(c.nodeValue || '')) return null;
        continue;
      }
      if (c.nodeType === 1) {
        if (found) return null;
        found = c;
        continue;
      }
    }
    return found;
  }

  function collapseNested(root) {
    var changed = false;
    var spans = Array.prototype.slice.call(root.querySelectorAll('span'));
    var i;
    for (i = spans.length - 1; i >= 0; i--) {
      var sp = spans[i];
      var parent = sp.parentNode;
      if (!parent || parent.nodeType !== 1 || parent.tagName !== 'SPAN') continue;
      var outer = paintMap(parent);
      var inner = paintMap(sp);
      if (!outer || !inner) continue;
      if (onlyElementChild(parent) !== sp) continue;
      if (!inner.color && outer.color) inner.color = outer.color;
      if (!inner['font-size'] && outer['font-size']) inner['font-size'] = outer['font-size'];
      writeStyle(sp, inner);
      unwrap(parent);
      changed = true;
    }
    return changed;
  }

  function mergeAdjacent(root) {
    var changed = false;
    var guard = 0;
    while (guard++ < 40) {
      var spans = Array.prototype.slice.call(root.querySelectorAll('span'));
      var moved = false;
      var i;
      for (i = 0; i < spans.length; i++) {
        var sp = spans[i];
        if (!sp.parentNode) continue;
        var nx = sp.nextSibling;
        if (!nx || nx.nodeType !== 1 || nx.tagName !== 'SPAN') continue;
        var a = paintMap(sp);
        var b = paintMap(nx);
        if (!a || !b) continue;
        if (!(a.color || a['font-size']) || !(b.color || b['font-size'])) continue;
        if ((a.color || '') !== (b.color || '') || (a['font-size'] || '') !== (b['font-size'] || '')) continue;
        while (nx.firstChild) sp.appendChild(nx.firstChild);
        nx.parentNode.removeChild(nx);
        moved = true;
        changed = true;
        break;
      }
      if (!moved) break;
    }
    return changed;
  }

  function tidyMarks(root) {
    var changed = false;
    var spans = Array.prototype.slice.call(root.querySelectorAll('span'));
    spans.forEach(function (sp) {
      Object.keys(IGNORE).forEach(function (name) {
        if (sp.hasAttribute(name)) {
          sp.removeAttribute(name);
          changed = true;
        }
      });
      var style = sp.getAttribute('style') || '';
      if (!style) return;
      if (!/webkit-text-fill-color/i.test(style) && !paintMap(sp)) return;
      var before = style;
      writeStyle(sp, readStyle(sp));
      if ((sp.getAttribute('style') || '') !== before) changed = true;
    });
    return changed;
  }

  function normalize(root) {
    if (!root || !root.querySelectorAll) return root;
    var guard = 0;
    var changed = true;
    while (changed && guard++ < 12) {
      changed = false;
      if (tidyMarks(root)) changed = true;
      if (removeEmpty(root)) changed = true;
      if (unwrapBare(root)) changed = true;
      if (collapseNested(root)) changed = true;
      if (mergeAdjacent(root)) changed = true;
      if (root.normalize) root.normalize();
    }
    return root;
  }

  function offsetOf(root, container, offset) {
    var doc = root.ownerDocument;
    var r = doc.createRange();
    r.selectNodeContents(root);
    r.setEnd(container, offset);
    return r.toString().length;
  }

  function rangeAt(root, start, end) {
    if (!root || !(end > start)) return null;
    var doc = root.ownerDocument;
    var nodes = collectText(root);
    var r = doc.createRange();
    var acc = 0;
    var started = false;
    var i;
    for (i = 0; i < nodes.length; i++) {
      var L = nodes[i].nodeValue.length;
      if (!started && start < acc + L) {
        r.setStart(nodes[i], start - acc);
        started = true;
      }
      if (started && end <= acc + L) {
        r.setEnd(nodes[i], end - acc);
        return r;
      }
      acc += L;
    }
    return null;
  }

  function applyOffsets(root, start, end, prop, value) {
    prop = normProp(prop);
    value = normValue(prop, value);
    start = start | 0;
    end = end | 0;
    if (!root || !(end > start)) return { ok: false, start: start, end: end };
    var total = 0;
    collectText(root).forEach(function (n) { total += n.nodeValue.length; });
    if (start < 0 || end > total) return { ok: false, start: start, end: end };
    splitBoundaries(root, start, end);
    var nodes = nodesCovering(root, start, end);
    if (!nodes.length) return { ok: false, start: start, end: end };
    var i;
    for (i = nodes.length - 1; i >= 0; i--) {
      peelProp(nodes[i], root, prop);
      if (value) paintText(nodes[i], prop, value);
    }
    normalize(root);
    return { ok: true, start: start, end: end };
  }

  function apply(root, range, prop, value) {
    if (!root || !range) return { ok: false, start: 0, end: 0 };
    var start;
    var end;
    try {
      start = offsetOf(root, range.startContainer, range.startOffset);
      end = offsetOf(root, range.endContainer, range.endOffset);
    } catch (err) {
      return { ok: false, start: 0, end: 0 };
    }
    if (end < start) {
      var swap = start;
      start = end;
      end = swap;
    }
    return applyOffsets(root, start, end, prop, value);
  }

  function canon(html, doc) {
    if (!doc && typeof document !== 'undefined') doc = document;
    if (!doc) return String(html || '');
    var box = doc.createElement('div');
    box.innerHTML = html || '';
    normalize(box);
    return box.innerHTML;
  }

  function serialize(root) {
    normalize(root);
    return root && root.innerHTML ? root.innerHTML : '';
  }

  return {
    apply: apply,
    applyOffsets: applyOffsets,
    normalize: normalize,
    rangeAt: rangeAt,
    canon: canon,
    serialize: serialize
  };
});
