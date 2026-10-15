<?php
declare(strict_types=1);

/** Visual page builder: edit the real Ukrainian HTML and publish it immediately. */

function st_builder_style(string $style): string
{
    $keep = [];
    foreach (explode(';', $style) as $decl) {
        if (!str_contains($decl, ':')) continue;
        [$prop, $val] = explode(':', $decl, 2);
        $prop = strtolower(trim($prop));
        $val = trim($val);
        if ($prop === 'text-decoration-line') $prop = 'text-decoration';
        if (!in_array($prop, ['color', 'text-align', 'font-weight', 'font-style', 'text-decoration', 'font-size', 'margin-left', 'object-position', 'background-position', '--st-x', '--st-y', '--st-z'], true)) continue;
        if (preg_match('/url\s*\(|expression|javascript/i', $val)) continue;
        $edge = '(?:left|center|right|top|bottom|(?:0|[1-9]\d?|100)(?:\.\d+)?%)';
        $pct = '(?:0|[1-9]\d?|100)(?:\.\d+)?%';
        $ok = match ($prop) {
            'color' => (bool) preg_match('/^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?(?:\s*,\s*[\d.]+%?){2,3}\s*\)|[a-z]{3,20})$/i', $val),
            'text-align' => in_array(strtolower($val), ['left', 'right', 'center', 'justify', 'start', 'end'], true),
            'font-weight' => (bool) preg_match('/^(normal|bold|bolder|lighter|[1-9]00)$/i', $val),
            'font-style' => in_array(strtolower($val), ['normal', 'italic', 'oblique'], true),
            'text-decoration' => (bool) preg_match('/^(none|underline|line-through|overline)(?:\s+(?:none|underline|line-through|overline))*$/i', $val),
            'font-size' => (bool) preg_match('/^(?:inherit|(?:0|[1-9]\d?)(?:\.\d+)?(?:px|rem|em|%))$/i', $val),
            'margin-left' => (bool) preg_match('/^(?:1\.5|3|4\.5|6)rem$/', $val),
            'object-position' => (bool) preg_match('/^' . $edge . '(?:\s+' . $edge . ')?$/i', $val),
            'background-position' => (bool) preg_match('/^' . $edge . '(?:\s+' . $edge . ')?$/i', $val),
            '--st-x', '--st-y' => (bool) preg_match('/^' . $pct . '$/i', $val),
            '--st-z' => (bool) preg_match('/^(?:1(?:\.\d+)?|[12](?:\.\d+)?|3(?:\.0+)?)$/', $val),
            default => false,
        };
        if ($ok) $keep[] = $prop . ':' . $val;
    }
    return implode(';', $keep);
}

function st_builder_url_ok(string $url): bool
{
    $url = trim($url);
    if ($url === '' || str_starts_with($url, '{{')) return $url === '' || (bool) preg_match('/^\{\{[A-Z0-9_]+\}\}$/', $url);
    if (preg_match('/^\s*javascript:/i', $url)) return false;
    if (preg_match('/[\x00-\x1f]/', $url)) return false;
    return (bool) preg_match('#^(https?:|mailto:|tel:|/|\#)#i', $url);
}

function st_builder_restore_nav(string $html): string
{
    return preg_replace_callback(
        '/<li\b[^>]*\bdata-st-nav="(company|machines|studs|video|contact)"[^>]*>/i',
        static function (array $m): string {
            $tag = $m[0];
            $key = $m[1];
            if (preg_match('/\bclass="([^"]*)"/i', $tag, $cm)) {
                $cls = trim((string) preg_replace('/\bis-active\b/', '', $cm[1]));
                $cls = trim((string) preg_replace('/\s+/', ' ', $cls));
            } else {
                $cls = 'nav__item';
            }
            $tag = preg_replace('/\s*\bdata-st-nav="[^"]*"/i', '', $tag, 1) ?? $tag;
            if (preg_match('/\bclass="/i', $tag)) {
                $tag = preg_replace('/\bclass="[^"]*"/i', 'class="' . $cls . '{{NAV_' . $key . '}}"', $tag, 1) ?? $tag;
            } else {
                $tag = preg_replace('/<li\b/i', '<li class="' . $cls . '{{NAV_' . $key . '}}"', $tag, 1) ?? $tag;
            }
            return $tag;
        },
        $html
    ) ?? $html;
}

function st_builder_clean(string $html): string
{
    if (strlen($html) > 1600000) {
        throw new RuntimeException('Za duży fragment, żeby go zapisać.');
    }
    if (str_contains($html, '<?')) {
        throw new RuntimeException('Zapis odrzucony: w treści jest kod PHP.');
    }
    $html = st_builder_restore_nav($html);
    $html = preg_replace('/<style\b[^>]*data-stb-ui[^>]*>.*?<\/style>/is', '', $html) ?? $html;
    $html = preg_replace('/<foreignObject\b[^>]*>.*?<\/foreignObject>/is', '', $html) ?? $html;
    $html = preg_replace_callback('/<script\b([^>]*)>(.*?)<\/script>/is', static function (array $m): string {
        if (preg_match('/type\s*=\s*["\']application\/ld\+json["\']/i', $m[1])) return $m[0];
        return '';
    }, $html) ?? $html;
    $html = preg_replace_callback('/<iframe\b[^>]*>.*?<\/iframe>/is', static function (array $m): string {
        if (preg_match('/\ssrc\s*=\s*["\']https:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.[a-z.]+)/i', $m[0])) {
            return $m[0];
        }
        return '';
    }, $html) ?? $html;
    $html = preg_replace('/\s+on[a-z]+\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace('/\s+(?:contenteditable|spellcheck|draggable)\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace('/\s+data-stb-[\w:-]*\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace('/\s+data-st-(?:block|region|shared|dropped|builder)\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace('/\s(?:srcset)\s*=\s*(?:"\s*javascript:[^"]*"|\'\s*javascript:[^\']*\')/i', '', $html) ?? $html;
    $styleCb = static function (array $m): string {
        $clean = st_builder_style(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        return $clean === '' ? '' : ' style="' . htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
    };
    $html = preg_replace_callback('/\sstyle\s*=\s*"([^"]*)"/i', $styleCb, $html) ?? $html;
    $html = preg_replace_callback("/\sstyle\s*=\s*'([^']*)'/i", $styleCb, $html) ?? $html;
    $urlCb = static function (array $m): string {
        $url = html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if (!st_builder_url_ok($url)) return '';
        return ' ' . strtolower($m[1]) . '="' . htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
    };
    $html = preg_replace_callback('/\s(href|src|action|poster)\s*=\s*"([^"]*)"/i', $urlCb, $html) ?? $html;
    $html = preg_replace_callback("/\s(href|src|action|poster)\s*=\s*'([^']*)'/i", $urlCb, $html) ?? $html;
    $html = st_builder_strip_filled_slots($html);
    $html = preg_replace_callback('/\sclass\s*=\s*"([^"]*)"/i', static function (array $m): string {
        $cls = preg_replace('/\b(?:stb-ink-light|stb-ink-dark|stb-on|cms-editing|cms-changed|cms-hover|cms-new-card)\b/', '', $m[1]) ?? $m[1];
        $cls = trim((string) preg_replace('/\s+/', ' ', $cls));
        return $cls === '' ? '' : ' class="' . $cls . '"';
    }, $html) ?? $html;
    return st_builder_strip_link_paint($html);
}

/** A real photo must not keep the empty-slot frame, size or placeholder description. */
function st_builder_strip_filled_slots(string $html): string
{
    return preg_replace_callback('/<img\b[^>]*>/i', static function (array $m): string {
        $tag = $m[0];
        if (preg_match('/\bsrc\s*=\s*["\'][^"\']*slot\.svg/i', $tag)) return $tag;
        if (!preg_match('/\bis-slot\b/', $tag)) return $tag;
        $tag = preg_replace('/\bis-slot\b/', '', $tag) ?? $tag;
        $tag = preg_replace('/\s(?:width|height)\s*=\s*["\'](?:800|600)["\']/', '', $tag) ?? $tag;
        if (preg_match('/\balt\s*=\s*"([^"]*)"/u', $tag, $am)) {
            $alt = html_entity_decode($am[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $base = str_replace(["\u{200C}", "\u{200D}"], '', $alt);
            if (trim($base) === 'Фото' || preg_match('/[\x{200C}\x{200D}]/u', $alt)) {
                $tag = preg_replace('/\salt\s*=\s*"[^"]*"/u', ' alt=""', $tag, 1) ?? $tag;
            }
        }
        $tag = preg_replace('/\sclass\s*=\s*"\s*"/', '', $tag) ?? $tag;
        $tag = preg_replace('/\s{2,}/', ' ', $tag) ?? $tag;
        return $tag;
    }, $html) ?? $html;
}

/** Linked words take their colour from CSS. Drop the editor’s inline paint on those anchors. */
function st_builder_strip_link_paint(string $html): string
{
    return preg_replace_callback('/<a\b[^>]*>/i', static function (array $m): string {
        $tag = $m[0];
        if (!preg_match('/\b(?:data-st-link\b|class="[^"]*\bst-link\b)/i', $tag)) return $tag;
        if (!preg_match('/\sstyle="([^"]*)"/i', $tag, $sm)) return $tag;
        $keep = [];
        foreach (explode(';', html_entity_decode($sm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')) as $decl) {
            if (!str_contains($decl, ':')) continue;
            $prop = strtolower(trim(explode(':', $decl, 2)[0]));
            if (in_array($prop, ['color', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', '-webkit-text-fill-color'], true)) continue;
            $keep[] = trim($decl);
        }
        $style = st_builder_style(implode(';', $keep));
        if ($style === '') return preg_replace('/\sstyle="[^"]*"/i', '', $tag, 1) ?? $tag;
        return preg_replace('/\sstyle="[^"]*"/i', ' style="' . htmlspecialchars($style, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"', $tag, 1) ?? $tag;
    }, $html) ?? $html;
}

function st_builder_el_end(string $html, string $tag, int $innerStart): ?int
{
    $tag = strtolower($tag);
    $i = $innerStart;
    $depth = 1;
    $len = strlen($html);
    $openRe = '/<' . preg_quote($tag, '/') . '\b/i';
    $close = '</' . $tag . '>';
    $closeLen = strlen($close);
    while ($i < $len) {
        $openPos = null;
        if (preg_match($openRe, substr($html, $i), $mm, PREG_OFFSET_CAPTURE)) {
            $openPos = $i + (int) $mm[0][1];
        }
        $closePos = stripos($html, $close, $i);
        if ($closePos === false) return null;
        if ($openPos !== null && $openPos < $closePos) {
            $depth++;
            $i = $openPos + strlen($tag) + 1;
            continue;
        }
        $depth--;
        if ($depth === 0) return $closePos + $closeLen;
        $i = $closePos + $closeLen;
    }
    return null;
}

function st_builder_mark(string $html, string $needle, string $attr): string
{
    $p = strpos($html, $needle);
    if ($p === false) return $html;
    $gt = strpos($html, '>', $p);
    if ($gt === false) return $html;
    return substr($html, 0, $gt) . ' ' . $attr . substr($html, $gt);
}

function st_builder_page_info(string $id): array
{
    $info = ['role' => 'page', 'name' => $id, 'canDelete' => false, 'parentId' => ''];
    $rows = st_cms_pages();
    $parentUrl = '';
    foreach ($rows as $row) {
        if (($row['id'] ?? '') !== $id) continue;
        $info['role'] = (string) ($row['role'] ?? 'page');
        $info['name'] = (string) ($row['name'] ?? $id);
        $info['canDelete'] = !empty($row['canDelete']);
        $parentUrl = (string) ($row['parentUrl'] ?? '');
        break;
    }
    if ($parentUrl !== '') {
        foreach ($rows as $row) {
            if ((string) ($row['url'] ?? '') !== $parentUrl) continue;
            $info['parentId'] = (string) ($row['id'] ?? '');
            break;
        }
    }
    return $info;
}

function st_builder_preview(string $id): array
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    [$meta, $body] = st_cms_parse((string) file_get_contents($path));
    [$layout, $partials, $ld] = st_cms_render_ctx();
    $active = (string) ($meta['nav'] ?? '');
    foreach (['company', 'machines', 'studs', 'video', 'contact'] as $key) {
        $bit = ($key === $active ? ' is-active' : '') . '" data-st-nav="' . $key;
        $layout = str_replace('{{NAV_' . $key . '}}', $bit, $layout);
    }
    $html = st_cms_render_page($meta, $body, $layout, $partials, $ld, basename($path));
    $html = preg_replace('/<script\b[^>]*\bsrc="[^"]*strona\.js[^"]*"[^>]*>\s*<\/script>\s*/i', '', $html) ?? $html;
    $html = preg_replace('/<meta\b[^>]*http-equiv=["\']refresh["\'][^>]*>\s*/i', '', $html) ?? $html;
    $html = preg_replace_callback('/<video\b([^>]*)>/i', static function (array $m): string {
        $attrs = preg_replace('/\s+(?:autoplay|preload="[^"]*")/i', '', $m[1]) ?? $m[1];
        return '<video' . $attrs . ' preload="none">';
    }, $html) ?? $html;
    $html = st_builder_mark($html, '<div class="topbar"', 'data-st-region="topbar"');
    $html = st_builder_mark($html, '<header class="hdr"', 'data-st-region="header"');
    $html = st_builder_mark($html, '<div class="drawer"', 'data-st-region="drawer"');
    $html = st_builder_mark($html, '<main id="main"', 'data-st-region="main"');
    $html = st_builder_mark($html, '<footer class="ftr"', 'data-st-region="footer"');
    $html = st_builder_mark($html, '<nav class="mbar"', 'data-st-region="mbar"');
    $html = st_builder_mark($html, '<section class="sec cta" id="zapyt"', 'data-st-shared="form"');
    $p = strpos($html, '<html');
    if ($p !== false) {
        $html = substr_replace($html, '<html data-st-i18n="off" data-st-builder="1"', $p, strlen('<html'));
    }
    $info = st_builder_page_info($id);
    return [
        'ok' => true,
        'html' => $html,
        'id' => $id,
        'name' => $info['name'] !== '' ? $info['name'] : (string) ($meta['title'] ?? $id),
        'url' => (string) ($meta['url'] ?? ''),
        'title' => (string) ($meta['title'] ?? ''),
        'desc' => (string) ($meta['desc'] ?? ''),
        'ogtitle' => (string) ($meta['ogtitle'] ?? ($meta['title'] ?? '')),
        'hasForm' => str_contains($body, '{{FORMULARZ}}'),
        'role' => $info['role'],
        'canDelete' => $info['canDelete'],
        'parentId' => $info['parentId'],
        'pages' => st_builder_page_links(),
    ];
}

function st_builder_norm(string $html): string
{
    $html = preg_replace('/\s+/', ' ', $html) ?? $html;
    return trim($html);
}

function st_builder_restore_yt(string $main, string $original): string
{
    if (!str_contains($original, '{{YT_PLAY}}')) return $main;
    $path = ST_PARTIALS . '/yt-play.html';
    if (!is_file($path)) return $main;
    $yt = trim((string) file_get_contents($path));
    if ($yt === '') return $main;
    return str_replace($yt, '{{YT_PLAY}}', $main);
}

function st_builder_swap_form(string $main): string
{
    $open = '<section class="sec cta" id="zapyt"';
    $p = strpos($main, 'id="zapyt"');
    if ($p === false) return $main;
    $start = strrpos(substr($main, 0, $p), '<section');
    if ($start === false) return $main;
    $gt = strpos($main, '>', $start);
    if ($gt === false) return $main;
    $end = st_builder_el_end($main, 'section', $gt + 1);
    if ($end === null) return $main;
    return substr($main, 0, $start) . "\n{{FORMULARZ}}\n" . substr($main, $end);
}

function st_builder_replace_el(string $html, string $needle, string $tag, string $replacement): string
{
    $pos = strpos($html, $needle);
    if ($pos === false) throw new RuntimeException('Nie znaleziono fragmentu układu strony.');
    $gt = strpos($html, '>', $pos);
    if ($gt === false) throw new RuntimeException('Uszkodzony układ strony.');
    $end = st_builder_el_end($html, $tag, $gt + 1);
    if ($end === null) throw new RuntimeException('Nie domknięto fragmentu układu strony.');
    return substr($html, 0, $pos) . trim($replacement) . substr($html, $end);
}

function st_builder_apply_chrome(array $chrome): void
{
    $layout = (string) file_get_contents(ST_LAYOUT);
    $map = [
        'topbar' => ['<div class="topbar"', 'div'],
        'header' => ['<header class="hdr"', 'header'],
        'drawer' => ['<div class="drawer"', 'div'],
        'footer' => ['<footer class="ftr"', 'footer'],
        'mbar' => ['<nav class="mbar"', 'nav'],
    ];
    foreach ($map as $key => [$needle, $tag]) {
        if (!isset($chrome[$key]) || !is_string($chrome[$key]) || trim($chrome[$key]) === '') continue;
        $clean = st_builder_clean($chrome[$key]);
        if (!preg_match('/^<' . preg_quote($tag, '/') . '\b/i', ltrim($clean))) {
            throw new RuntimeException('Fragment układu ma zły znacznik.');
        }
        $layout = st_builder_replace_el($layout, $needle, $tag, $clean);
    }
    if (!str_contains($layout, '{{NAV_company}}') || !str_contains($layout, '{{NAV_contact}}')) {
        throw new RuntimeException('Zapis menu usunąłby oznaczenia nawigacji. Nic nie zmieniono w układzie.');
    }
    st_cms_atomic_write(ST_LAYOUT, $layout, true);
}

function st_builder_plain_meta(string $value): string
{
    $value = trim(st_cms_strip($value));
    if (mb_strlen($value) > 300) $value = mb_substr($value, 0, 300);
    return $value;
}

function st_builder_commit(array $data): array
{
    $id = (string) ($data['id'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    if (!isset($data['main']) || !is_string($data['main'])) throw new RuntimeException('Brak treści strony.');
    [$meta, $original] = st_cms_parse((string) file_get_contents($path));
    $hadForm = str_contains($original, '{{FORMULARZ}}');
    $main = st_builder_clean($data['main']);
    $main = st_builder_restore_yt($main, $original);
    if (trim($main) === '') throw new RuntimeException('Pusta strona — nic nie zapisano.');

    $shared = false;
    $drop = !empty($data['dropForm']);
    $formIncoming = isset($data['form']) && is_string($data['form']) && trim($data['form']) !== '';
    $keepForm = $hadForm || $formIncoming || !empty($data['keepForm']);
    if ($drop) {
        $main = st_builder_swap_form($main);
        $main = str_replace('{{FORMULARZ}}', '', $main);
    } elseif ($keepForm) {
        if ($formIncoming) {
            $form = st_builder_clean($data['form']);
            if (!str_contains($form, 'id="zapyt"') || !str_contains($form, 'name="message"') || !str_contains($form, 'name="email"') || !str_contains($form, 'name="name"')) {
                throw new RuntimeException('Formularz musi zachować pola imienia, e-maila i wiadomości.');
            }
            if (!preg_match('/\baction="\/wyslij\.php"/', $form)) {
                throw new RuntimeException('Formularz musi nadal wysyłać się na /wyslij.php.');
            }
            $partialPath = ST_FORM_PARTIAL;
            $prev = is_file($partialPath) ? (string) file_get_contents($partialPath) : '';
            if (st_builder_norm($form) !== st_builder_norm($prev)) {
                if (!str_ends_with($form, "\n")) $form .= "\n";
                st_cms_atomic_write($partialPath, $form, true);
                $shared = true;
            }
        }
        if (str_contains($main, 'id="zapyt"')) $main = st_builder_swap_form($main);
        if (!str_contains($main, '{{FORMULARZ}}')) $main = rtrim($main) . "\n\n{{FORMULARZ}}\n";
    } else {
        $main = str_replace('{{FORMULARZ}}', '', $main);
    }

    $authored = 0;
    $i18nNote = '';
    $i18nPending = 0;
    require_once __DIR__ . '/tlumacz.php';
    $docs = ['main' => $main];
    if (isset($data['chrome']) && is_array($data['chrome'])) {
        foreach ($data['chrome'] as $key => $html) {
            if (is_string($html) && is_string($key)) $docs['chrome:' . $key] = $html;
        }
    }
    $metaIn = (isset($data['meta']) && is_array($data['meta'])) ? $data['meta'] : null;
    $metaLang = (string) ($data['metaLang'] ?? 'en');
    $metaUk = (isset($data['metaUk']) && is_array($data['metaUk'])) ? $data['metaUk'] : [];
    $pairs = is_array($data['i18nPairs'] ?? null) ? $data['i18nPairs'] : [];
    $marked = str_contains($main, 'data-st-untranslated');
    if (!$marked && isset($data['chrome']) && is_array($data['chrome'])) {
        foreach ($data['chrome'] as $html) {
            if (is_string($html) && str_contains($html, 'data-st-untranslated')) {
                $marked = true;
                break;
            }
        }
    }
    if ($pairs !== [] || $metaIn !== null || $marked) {
        $applied = st_i18n_apply_documents($docs, $pairs, $metaIn, $metaLang, $metaUk);
        $docs = $applied['docs'];
        $main = (string) ($docs['main'] ?? $main);
        if (isset($data['chrome']) && is_array($data['chrome'])) {
            foreach ($data['chrome'] as $key => $_) {
                if (isset($docs['chrome:' . $key])) $data['chrome'][$key] = $docs['chrome:' . $key];
            }
        }
        if (is_array($applied['meta'] ?? null)) {
            foreach (['title', 'desc', 'ogtitle'] as $key) {
                if (!empty($applied['meta'][$key])) $meta[$key] = st_builder_plain_meta((string) $applied['meta'][$key]);
            }
        }
        $authored = (int) ($applied['translated'] ?? 0) + (int) ($applied['locked'] ?? 0);
        $i18nNote = (string) ($applied['note'] ?? '');
        $i18nPending = (int) ($applied['pending'] ?? 0);
    }

    if (isset($data['chrome']) && is_array($data['chrome'])) {
        st_builder_apply_chrome($data['chrome']);
        $shared = true;
    }

    if (!str_ends_with($main, "\n")) $main .= "\n";
    st_cms_atomic_write($path, st_cms_dump($meta, $main), true);
    $navSynced = false;
    if (function_exists('st_builder_sync_tile_nav')) {
        $navSynced = st_builder_sync_tile_nav($id);
    }
    $live = st_cms_publish_page($id, $shared || $navSynced);
    return [
        'ok' => true,
        'built' => $live['built'] ?? [],
        'url' => (string) ($meta['url'] ?? ''),
        'shared' => $shared,
        'i18n' => $authored,
        'i18nPending' => $i18nPending,
        'i18nNote' => $i18nNote,
    ];
}

function st_builder_esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function st_builder_retitle_vcards(string $body, array $titles): string
{
    return preg_replace_callback(
        '/<article\b[^>]*\bclass="[^"]*\bvcard\b[^"]*"[^>]*>.*?<\/article>/s',
        static function (array $m) use ($titles): string {
            $art = $m[0];
            if (!preg_match('/\bdata-vid="([\w-]{11})"/', $art, $idm)) return $art;
            $id = $idm[1];
            $new = trim((string) ($titles[$id] ?? ''));
            if ($new === '') return $art;
            $old = '';
            if (preg_match('/\bdata-title="([^"]*)"/', $art, $tm)) {
                $old = html_entity_decode($tm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            $esc = st_builder_esc($new);
            $art = preg_replace('/\bdata-title="[^"]*"/', 'data-title="' . $esc . '"', $art) ?? $art;
            if ($old !== '' && $old !== $new) {
                $oldEsc = st_builder_esc($old);
                $art = preg_replace(
                    '/(<h3\b[^>]*>)\s*' . preg_quote($oldEsc, '/') . '\s*(<\/h3>)/',
                    '$1' . $esc . '$2',
                    $art,
                    1
                ) ?? $art;
                $art = str_replace('alt="' . $oldEsc . '"', 'alt="' . $esc . '"', $art);
                $art = preg_replace_callback('/\baria-label="([^"]*)"/', static function (array $am) use ($old, $new): string {
                    $label = html_entity_decode($am[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    if (!str_contains($label, $old)) return $am[0];
                    return 'aria-label="' . st_builder_esc(str_replace($old, $new, $label)) . '"';
                }, $art) ?? $art;
            }
            return $art;
        },
        $body
    ) ?? $body;
}

function st_builder_vcard(string $id, string $title, string $cat, string $label): string
{
    $esc = st_builder_esc($title);
    $catEsc = st_builder_esc($cat !== '' ? $cat : 'spot');
    $labelEsc = st_builder_esc($label !== '' ? $label : $title);
    $local = ST_ROOT . '/assets/img/yt/' . $id . '.jpg';
    $src = is_file($local) ? '/assets/img/yt/' . $id . '.jpg' : 'https://i.ytimg.com/vi/' . $id . '/hqdefault.jpg';
    $play = '{{YT_PLAY}}';
    $playPath = ST_PARTIALS . '/yt-play.html';
    if (is_file($playPath)) $play = trim((string) file_get_contents($playPath));
    return '<article class="vcard rv" data-cat="' . $catEsc . '">' . "\n"
        . '        <button class="yt" type="button" data-vid="' . $id . '" data-title="' . $esc . '" aria-label="' . st_builder_esc('Дивитись відео: ' . $title) . '">' . "\n"
        . '          <img src="' . $src . '" alt="' . $esc . '" width="640" height="360" loading="lazy" decoding="async">' . "\n"
        . '          ' . $play . "\n"
        . '        </button>' . "\n"
        . '        <div class="vcard__body">' . "\n"
        . '          <span class="vcard__kind">' . $labelEsc . '</span>' . "\n"
        . '          <h3>' . $esc . '</h3>' . "\n"
        . '        </div>' . "\n"
        . '      </article>';
}

function st_builder_sync_video_grid(string $body, array $titles, array $meta): string
{
    if ($titles === []) return $body;
    if (!preg_match('/<div class="grid g-3">/', $body, $m, PREG_OFFSET_CAPTURE)) return $body;
    $start = (int) $m[0][1];
    $openLen = strlen($m[0][0]);
    $end = st_builder_el_end($body, 'div', $start + $openLen);
    if ($end === null) return $body;
    $innerStart = $start + $openLen;
    $innerEnd = $end - strlen('</div>');
    $inner = substr($body, $innerStart, $innerEnd - $innerStart);
    if (!preg_match_all('/<article\b[^>]*\bclass="[^"]*\bvcard\b[^"]*"[^>]*>.*?<\/article>/s', $inner, $arts)) {
        $arts = [0 => []];
    }
    $present = [];
    foreach ($arts[0] as $art) {
        if (preg_match('/\bdata-vid="([\w-]{11})"/', $art, $idm)) $present[$idm[1]] = true;
    }
    $missing = [];
    foreach ($titles as $id => $_) {
        if (!isset($present[$id])) $missing[] = $id;
    }
    $extra = false;
    foreach ($present as $id => $_) {
        if (!isset($titles[$id])) { $extra = true; break; }
    }
    if ($missing === [] && !$extra) return $body;
    $kept = [];
    foreach ($arts[0] as $art) {
        if (!preg_match('/\bdata-vid="([\w-]{11})"/', $art, $idm)) {
            $kept[] = $art;
            continue;
        }
        if (!isset($titles[$idm[1]])) continue;
        $kept[] = $art;
    }
    foreach ($missing as $id) {
        $row = $meta[$id] ?? ['key' => 'spot', 'label' => ''];
        $kept[] = st_builder_vcard($id, (string) $titles[$id], (string) $row['key'], (string) $row['label']);
    }
    $newInner = "\n      " . implode("\n      ", $kept) . "\n    ";
    return substr($body, 0, $innerStart) . $newInner . substr($body, $innerEnd);
}

function st_builder_sync_catalog(): void
{
    if (!function_exists('st_cms_yt_id')) require_once __DIR__ . '/katalog.php';
    $videos = st_cms_videos();
    $titles = [];
    $meta = [];
    foreach ($videos['categories'] ?? [] as $cat) {
        if (!is_array($cat)) continue;
        $key = (string) ($cat['key'] ?? '');
        $label = (string) ($cat['label'] ?? '');
        foreach ($cat['videos'] ?? [] as $video) {
            if (!is_array($video)) continue;
            $id = st_cms_yt_id((string) ($video['id'] ?? ''));
            $title = trim((string) ($video['title'] ?? ''));
            if ($id === '' || $title === '') continue;
            $titles[$id] = $title;
            if (!isset($meta[$id])) $meta[$id] = ['key' => $key, 'label' => $label];
        }
    }
    foreach (glob(ST_PAGES . '/*.html') ?: [] as $file) {
        [$pageMeta, $body] = st_cms_parse((string) file_get_contents($file));
        $next = st_builder_retitle_vcards($body, $titles);
        if (basename($file) === '50-video.html') $next = st_builder_sync_video_grid($next, $titles, $meta);
        if ($next !== $body) file_put_contents($file, st_cms_dump($pageMeta, $next));
    }
}

require_once __DIR__ . '/builder-menu.php';
