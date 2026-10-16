<?php
declare(strict_types=1);

/**
 * Normalise coloured fragments: no empty, nested or duplicate paint spans,
 * and no spaces inserted inside a word.
 */

function st_paint_plain(string $html): string
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = str_replace("\xc2\xa0", ' ', $text);
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    return trim($text);
}

function st_paint_skeleton(string $html): string
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return preg_replace('/\s+/u', '', $text) ?? $text;
}

function st_paint_norm_color(string $value): string
{
    $value = trim($value);
    if (preg_match('/^#([0-9a-f]{3})$/i', $value, $m)) {
        $h = strtolower($m[1]);
        return '#' . $h[0] . $h[0] . $h[1] . $h[1] . $h[2] . $h[2];
    }
    if (preg_match('/^#([0-9a-f]{6})$/i', $value, $m)) return '#' . strtolower($m[1]);
    if (preg_match('/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i', $value, $m)) {
        $byte = static function (int $n): string {
            $n = max(0, min(255, $n));
            return str_pad(dechex($n), 2, '0', STR_PAD_LEFT);
        };
        return '#' . $byte((int) $m[1]) . $byte((int) $m[2]) . $byte((int) $m[3]);
    }
    return $value;
}

/** @return array<string, string> */
function st_paint_style_map(string $style): array
{
    $map = [];
    foreach (explode(';', $style) as $decl) {
        if (!str_contains($decl, ':')) continue;
        [$prop, $val] = explode(':', $decl, 2);
        $prop = strtolower(trim($prop));
        $val = trim($val);
        if ($prop === '' || $val === '' || $prop === '-webkit-text-fill-color') continue;
        if ($prop === 'color') $val = st_paint_norm_color($val);
        $map[$prop] = $val;
    }
    return $map;
}

function st_paint_style_string(array $map): string
{
    $parts = [];
    if (!empty($map['color'])) $parts[] = 'color:' . st_paint_norm_color((string) $map['color']);
    if (!empty($map['font-size'])) $parts[] = 'font-size:' . $map['font-size'];
    $keys = array_keys($map);
    sort($keys);
    foreach ($keys as $prop) {
        if ($prop === 'color' || $prop === 'font-size') continue;
        $parts[] = $prop . ':' . $map[$prop];
    }
    return implode(';', $parts);
}

function st_paint_ignore_attr(string $name): bool
{
    return in_array(strtolower($name), ['data-stb-paint', 'data-st-at', 'data-st-en-only', 'data-st-ru-only', 'data-stb-shared'], true);
}

/** @return array<string, string>|null */
function st_paint_map(DOMElement $el): ?array
{
    if (strtolower($el->tagName) !== 'span') return null;
    foreach ($el->attributes ?? [] as $attr) {
        $name = strtolower($attr->name);
        if (st_paint_ignore_attr($name)) continue;
        if ($name !== 'style') return null;
    }
    return st_paint_style_map($el->getAttribute('style'));
}

function st_paint_write_style(DOMElement $el, array $map): void
{
    $style = st_paint_style_string($map);
    if ($style === '') $el->removeAttribute('style');
    else $el->setAttribute('style', $style);
    foreach (['data-stb-paint', 'data-st-at', 'data-st-en-only', 'data-st-ru-only', 'data-stb-shared'] as $name) {
        if ($el->hasAttribute($name) && $style === '' && st_paint_map($el) === []) {
            /* drop editor marks when the span no longer carries paint */
        }
    }
}

function st_paint_unwrap(DOMElement $el): void
{
    $parent = $el->parentNode;
    if ($parent === null) return;
    while ($el->firstChild) $parent->insertBefore($el->firstChild, $el);
    $parent->removeChild($el);
}

function st_paint_only_element(DOMElement $parent): ?DOMNode
{
    $found = null;
    for ($c = $parent->firstChild; $c !== null; $c = $c->nextSibling) {
        if ($c->nodeType === XML_TEXT_NODE) {
            if (preg_match('/\S/u', (string) $c->nodeValue)) return null;
            continue;
        }
        if ($c->nodeType === XML_ELEMENT_NODE) {
            if ($found !== null) return null;
            $found = $c;
        }
    }
    return $found;
}

function st_paint_changed_normalize(DOMElement $root): bool
{
    $changed = false;
    $doc = $root->ownerDocument;
    if ($doc === null) return false;
    for ($guard = 0; $guard < 12; $guard++) {
        $pass = false;
        $spans = [];
        foreach ($root->getElementsByTagName('span') as $sp) $spans[] = $sp;
        foreach ($spans as $sp) {
            if (!$sp instanceof DOMElement) continue;
            foreach (['data-stb-paint', 'data-st-at', 'data-st-en-only', 'data-st-ru-only', 'data-stb-shared'] as $name) {
                if ($sp->hasAttribute($name)) {
                    $sp->removeAttribute($name);
                    $pass = true;
                }
            }
            $style = $sp->getAttribute('style');
            if ($style !== '' && (stripos($style, 'webkit-text-fill-color') !== false || st_paint_map($sp) !== null)) {
                $next = st_paint_style_string(st_paint_style_map($style));
                if ($next !== $style) {
                    if ($next === '') $sp->removeAttribute('style');
                    else $sp->setAttribute('style', $next);
                    $pass = true;
                }
            }
        }
        $spans = [];
        foreach ($root->getElementsByTagName('span') as $sp) $spans[] = $sp;
        for ($i = count($spans) - 1; $i >= 0; $i--) {
            $sp = $spans[$i];
            if (!$sp->parentNode) continue;
            if ($sp->getElementsByTagName('img')->length || $sp->getElementsByTagName('svg')->length || $sp->getElementsByTagName('br')->length) continue;
            if (trim((string) $sp->textContent) === '' && $sp->textContent === '') {
                $sp->parentNode->removeChild($sp);
                $pass = true;
            }
        }
        $spans = [];
        foreach ($root->getElementsByTagName('span') as $sp) $spans[] = $sp;
        for ($i = count($spans) - 1; $i >= 0; $i--) {
            $sp = $spans[$i];
            if (!$sp->parentNode) continue;
            $map = st_paint_map($sp);
            if ($map === null || $map !== []) continue;
            st_paint_unwrap($sp);
            $pass = true;
        }
        $spans = [];
        foreach ($root->getElementsByTagName('span') as $sp) $spans[] = $sp;
        for ($i = count($spans) - 1; $i >= 0; $i--) {
            $sp = $spans[$i];
            $parent = $sp->parentNode;
            if (!$parent instanceof DOMElement || strtolower($parent->tagName) !== 'span') continue;
            $outer = st_paint_map($parent);
            $inner = st_paint_map($sp);
            if ($outer === null || $inner === null) continue;
            if (st_paint_only_element($parent) !== $sp) continue;
            if (empty($inner['color']) && !empty($outer['color'])) $inner['color'] = $outer['color'];
            if (empty($inner['font-size']) && !empty($outer['font-size'])) $inner['font-size'] = $outer['font-size'];
            st_paint_write_style($sp, $inner);
            st_paint_unwrap($parent);
            $pass = true;
        }
        for ($merge = 0; $merge < 40; $merge++) {
            $moved = false;
            $spans = [];
            foreach ($root->getElementsByTagName('span') as $sp) $spans[] = $sp;
            foreach ($spans as $sp) {
                if (!$sp->parentNode) continue;
                $nx = $sp->nextSibling;
                if (!$nx instanceof DOMElement || strtolower($nx->tagName) !== 'span') continue;
                $a = st_paint_map($sp);
                $b = st_paint_map($nx);
                if ($a === null || $b === null) continue;
                if ($a === [] || $b === []) continue;
                if (($a['color'] ?? '') !== ($b['color'] ?? '') || ($a['font-size'] ?? '') !== ($b['font-size'] ?? '')) continue;
                if (($a['color'] ?? '') === '' && ($a['font-size'] ?? '') === '') continue;
                while ($nx->firstChild) $sp->appendChild($nx->firstChild);
                $nx->parentNode?->removeChild($nx);
                $moved = true;
                $pass = true;
                break;
            }
            if (!$moved) break;
        }
        $root->normalize();
        if (!$pass) break;
        $changed = true;
    }
    return $changed;
}

function st_paint_fragment(string $html): array
{
    $doc = new DOMDocument();
    $prev = libxml_use_internal_errors(true);
    $wrap = '<div id="st-paint-root">' . $html . '</div>';
    $doc->loadHTML('<?xml encoding="UTF-8">' . $wrap, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($prev);
    $root = $doc->getElementById('st-paint-root');
    if (!$root instanceof DOMElement) return [$html, false];
    $changed = st_paint_changed_normalize($root);
    if (!$changed) return [$html, false];
    $out = '';
    foreach ($root->childNodes as $child) $out .= $doc->saveHTML($child);
    if (st_paint_skeleton($out) !== st_paint_skeleton($html)) return [$html, false];
    return [$out, true];
}

function st_paint_normalize(string $html): string
{
    if ($html === '' || stripos($html, '<span') === false) return $html;
    [$out] = st_paint_fragment($html);
    return $out;
}

function st_paint_span_end(string $html, int $openAt): ?int
{
    if (!preg_match('/^<span\b[^>]*>/i', substr($html, $openAt), $m)) return null;
    $i = $openAt + strlen($m[0]);
    $depth = 1;
    $len = strlen($html);
    while ($i < $len && $depth > 0) {
        $nextOpen = stripos($html, '<span', $i);
        $nextClose = stripos($html, '</span>', $i);
        if ($nextClose === false) return null;
        if ($nextOpen !== false && $nextOpen < $nextClose && preg_match('/^<span\b/i', substr($html, $nextOpen))) {
            $depth++;
            $i = $nextOpen + 5;
            continue;
        }
        $depth--;
        $i = $nextClose + 7;
    }
    return $depth === 0 ? $i : null;
}

function st_paint_rewrite_spans(string $html): string
{
    $out = '';
    $len = strlen($html);
    $i = 0;
    while ($i < $len) {
        $pos = stripos($html, '<span', $i);
        if ($pos === false) {
            $out .= substr($html, $i);
            break;
        }
        if (!preg_match('/^<span\b/i', substr($html, $pos))) {
            $out .= substr($html, $i, $pos - $i + 5);
            $i = $pos + 5;
            continue;
        }
        if (!preg_match('/^<span\b[^>]*>/i', substr($html, $pos), $openTag)) {
            $out .= substr($html, $i, $pos - $i + 5);
            $i = $pos + 5;
            continue;
        }
        if (!preg_match('/(?:color|font-size)\s*:/i', $openTag[0])) {
            $out .= substr($html, $i, $pos - $i + strlen($openTag[0]));
            $i = $pos + strlen($openTag[0]);
            continue;
        }
        $out .= substr($html, $i, $pos - $i);
        $end = st_paint_span_end($html, $pos);
        if ($end === null) {
            $out .= substr($html, $pos, 5);
            $i = $pos + 5;
            continue;
        }
        $j = $end;
        while ($j < $len && preg_match('/\G<span\b[^>]*>/i', $html, $mm, 0, $j)) {
            if (!preg_match('/(?:color|font-size)\s*:/i', $mm[0])) break;
            $e2 = st_paint_span_end($html, $j);
            if ($e2 === null) break;
            $j = $e2;
        }
        $chunk = substr($html, $pos, $j - $pos);
        [$norm] = st_paint_fragment($chunk);
        $out .= $norm;
        $i = $j;
    }
    return $out;
}

function st_paint_normalize_attrs(string $html): string
{
    return preg_replace_callback(
        '/\s(data-st-enhtml|data-st-ruhtml)\s*=\s*"([^"]*)"/i',
        static function (array $m): string {
            $decoded = html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $norm = st_paint_normalize($decoded);
            if ($norm === $decoded || st_paint_skeleton($norm) !== st_paint_skeleton($decoded)) return $m[0];
            return ' ' . strtolower($m[1]) . '="' . htmlspecialchars($norm, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
        },
        $html
    ) ?? $html;
}

function st_paint_normalize_document(string $html): string
{
    if ($html === '' || stripos($html, '<span') === false) return $html;
    $html = st_paint_normalize_attrs($html);
    $html = st_paint_rewrite_spans($html);
    return $html;
}
