<?php
declare(strict_types=1);

/** Add-page dialog: create a page and place its link in the real header and drawer. */

function st_builder_page_links(): array
{
    $out = [];
    foreach (st_cms_pages() as $p) {
        $out[] = [
            'id' => (string) ($p['id'] ?? ''),
            'url' => (string) ($p['url'] ?? ''),
            'name' => (string) ($p['name'] ?? ''),
            'parentUrl' => (string) ($p['parentUrl'] ?? ''),
            'canDelete' => !empty($p['canDelete']),
        ];
    }
    return $out;
}

function st_builder_norm_url(string $href): string
{
    $h = trim(html_entity_decode($href, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    if ($h === '' || $h === '#' || preg_match('/^(?:mailto:|tel:|javascript:)/i', $h)) return '';
    $h = preg_replace('/[?#].*$/', '', $h) ?? $h;
    if (preg_match('#^https?://#i', $h)) {
        $path = (string) (parse_url($h, PHP_URL_PATH) ?? '');
        $h = $path;
    }
    if ($h === '' || !str_starts_with($h, '/')) return '';
    if ($h !== '/') $h = rtrim($h, '/') . '/';
    return $h;
}

function st_builder_menu_defs(): array
{
    return [
        ['slot' => 'top', 'kind' => 'top', 'needle' => '<ul class="nav__list">', 'which' => 1, 'desktop' => true],
        ['slot' => 'top', 'kind' => 'drawer', 'needle' => '<ul class="drawer__list">', 'which' => 1, 'desktop' => false],
        ['slot' => 'machines', 'kind' => 'mega', 'needle' => '<ul class="mega mega--wide">', 'which' => 1, 'desktop' => true],
        ['slot' => 'machines', 'kind' => 'sub', 'needle' => 'id="dm-machines"', 'which' => 1, 'desktop' => false],
        ['slot' => 'spot', 'kind' => 'fly', 'needle' => 'id="mega-spot-subs"', 'which' => 1, 'desktop' => true],
        ['slot' => 'spot', 'kind' => 'sub', 'needle' => 'id="dm-spot"', 'which' => 1, 'desktop' => false],
        ['slot' => 'studs', 'kind' => 'mega', 'needle' => '<ul class="mega mega--wide">', 'which' => 2, 'desktop' => true],
        ['slot' => 'studs', 'kind' => 'sub', 'needle' => 'id="dm-studs"', 'which' => 1, 'desktop' => false],
    ];
}

function st_builder_menu_label(string $slot): string
{
    return match ($slot) {
        'top' => 'Top navigation bar',
        'machines' => 'Machines dropdown',
        'spot' => 'Spot welding submenu',
        'studs' => 'Stud welding dropdown',
        default => 'Hidden from the menu',
    };
}

function st_builder_find_region(string $html, array $def): ?array
{
    $offset = 0;
    $pos = false;
    $which = max(1, (int) ($def['which'] ?? 1));
    for ($n = 0; $n < $which; $n++) {
        $pos = strpos($html, (string) $def['needle'], $offset);
        if ($pos === false) return null;
        $offset = $pos + strlen((string) $def['needle']);
    }
    if (str_starts_with((string) $def['needle'], '<ul')) {
        $start = (int) $pos;
    } else {
        $start = strrpos(substr($html, 0, (int) $pos), '<ul');
    }
    if ($start === false) return null;
    $gt = strpos($html, '>', $start);
    if ($gt === false) return null;
    $end = st_builder_el_end($html, 'ul', $gt + 1);
    if ($end === null) return null;
    return [
        'slot' => (string) $def['slot'],
        'kind' => (string) $def['kind'],
        'desktop' => !empty($def['desktop']),
        'start' => $start,
        'end' => $end,
        'innerStart' => $gt + 1,
        'innerEnd' => $end - strlen('</ul>'),
    ];
}

function st_builder_direct_children(string $html, int $from, int $to): array
{
    $out = [];
    $i = $from;
    $voids = ['br' => true, 'img' => true, 'hr' => true, 'meta' => true, 'link' => true, 'input' => true, 'source' => true];
    while ($i < $to) {
        $rel = strpos($html, '<', $i);
        if ($rel === false || $rel >= $to) break;
        $i = $rel;
        if (str_starts_with(substr($html, $i, 4), '</')) break;
        if (str_starts_with(substr($html, $i, 4), '<!--')) {
            $c = strpos($html, '-->', $i);
            $i = $c === false ? $to : $c + 3;
            continue;
        }
        if (!preg_match('/^<([a-zA-Z0-9]+)/', substr($html, $i, 24), $m)) {
            $i++;
            continue;
        }
        $tag = strtolower($m[1]);
        $gt = strpos($html, '>', $i);
        if ($gt === false || $gt >= $to) break;
        $self = isset($voids[$tag]) || ($html[$gt - 1] === '/');
        if ($self) {
            $out[] = substr($html, $i, $gt + 1 - $i);
            $i = $gt + 1;
            continue;
        }
        $end = st_builder_el_end($html, $tag, $gt + 1);
        if ($end === null || $end > $to) break;
        $out[] = substr($html, $i, $end - $i);
        $i = $end;
    }
    return $out;
}

function st_builder_own_href(string $el): string
{
    $cut = $el;
    $ul = stripos($el, '<ul');
    $ol = stripos($el, '<ol');
    $at = false;
    if ($ul !== false) $at = $ul;
    if ($ol !== false && ($at === false || $ol < $at)) $at = $ol;
    if ($at !== false) $cut = substr($el, 0, $at);
    if (!preg_match('/<a\b[^>]*\bhref="([^"]*)"/i', $cut, $m)) return '';
    return st_builder_norm_url($m[1]);
}

function st_builder_li_hidden(string $el): bool
{
    return (bool) preg_match('/^<li\b[^>]*\shidden\b/i', $el);
}

function st_builder_with_hidden(string $el, bool $on): string
{
    if (!preg_match('/^<li\b([^>]*)>/i', $el, $m)) return $el;
    $attrs = $m[1];
    $has = (bool) preg_match('/(?:^|\s)hidden(?:\s|=|$)/i', $attrs);
    if ($on && !$has) $attrs .= ' hidden';
    if (!$on && $has) $attrs = preg_replace('/(?:^|\s)hidden(?:=(?:"[^"]*"|\'[^\']*\'|\S+))?/i', '', $attrs) ?? $attrs;
    $attrs = trim((string) preg_replace('/\s+/', ' ', $attrs));
    $open = '<li' . ($attrs !== '' ? ' ' . $attrs : '') . '>';
    return preg_replace('/^<li\b[^>]*>/i', $open, $el, 1) ?? $el;
}

function st_builder_menu_li(string $kind, string $url, string $label, string $subtitle = ''): string
{
    $u = htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = htmlspecialchars($label, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $ico = '<span class="mega__ico mega__ico--mark"><img src="/assets/img/mark-nav.png?v=20260914c" alt="" width="34" height="34" decoding="async"></span>';
    $sub = trim($subtitle);
    $ds = $sub !== '' ? '<span class="mega__ds">' . htmlspecialchars($sub, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '</span>' : '';
    return match ($kind) {
        'top' => '<li class="nav__item"><a class="nav__link" href="' . $u . '">' . $t . '</a></li>',
        'mega' => '<li><a href="' . $u . '">' . $ico . '<span><span class="mega__tt">' . $t . '</span>' . $ds . '</span></a></li>',
        'drawer' => '<li><a class="drawer__link" href="' . $u . '">' . $t . '</a></li>',
        default => '<li><a href="' . $u . '">' . $t . '</a></li>',
    };
}

function st_builder_desired_items(array $children, bool $active, string $url, int $position, string $newLi): array
{
    $rest = [];
    $kept = null;
    foreach ($children as $el) {
        if (st_builder_own_href($el) !== $url) {
            $rest[] = $el;
            continue;
        }
        if ($kept === null) $kept = $el;
    }
    if (!$active) {
        $out = [];
        foreach ($children as $el) {
            if (st_builder_own_href($el) !== $url) {
                $out[] = $el;
                continue;
            }
            if (str_contains($el, '{{NAV_')) $out[] = st_builder_with_hidden($el, true);
        }
        return $out;
    }
    if ($kept !== null) $kept = st_builder_with_hidden($kept, false);
    else $kept = $newLi;
    $position = max(1, min($position, count($rest) + 1));
    array_splice($rest, $position - 1, 0, [$kept]);
    return $rest;
}

function st_builder_menu_apply(string $html, string $url, string $slot, int $position, string $label, string $subtitle = ''): string
{
    $url = st_builder_norm_url($url);
    if ($url === '') throw new RuntimeException('This page has no address to put in the menu.');
    $allowed = ['top', 'machines', 'spot', 'studs', 'hidden'];
    if (!in_array($slot, $allowed, true)) throw new RuntimeException('Choose where the page appears in the menu.');
    if ($label === '') $label = 'Сторінка';
    foreach (st_builder_menu_defs() as $def) {
        $region = st_builder_find_region($html, $def);
        if ($region === null) throw new RuntimeException('The site menu is missing a list, so the link was not changed.');
        $children = st_builder_direct_children($html, $region['innerStart'], $region['innerEnd']);
        $desired = st_builder_desired_items(
            $children,
            $def['slot'] === $slot,
            $url,
            $position,
            st_builder_menu_li((string) $def['kind'], $url, $label, $subtitle)
        );
        if ($desired === $children) continue;
        $html = st_builder_splice_children($html, $region, $desired);
    }
    if (!str_contains($html, '{{NAV_company}}') || !str_contains($html, '{{NAV_contact}}')) {
        throw new RuntimeException('That menu change would remove a built-in navigation marker. Nothing was saved.');
    }
    return $html;
}

function st_builder_menu_find(string $html, string $url): array
{
    $url = st_builder_norm_url($url);
    $foundHidden = false;
    foreach (st_builder_menu_defs() as $def) {
        if (empty($def['desktop'])) continue;
        $region = st_builder_find_region($html, $def);
        if ($region === null) continue;
        $children = st_builder_direct_children($html, $region['innerStart'], $region['innerEnd']);
        $i = 0;
        foreach ($children as $el) {
            $i++;
            if (st_builder_own_href($el) !== $url) continue;
            if (st_builder_li_hidden($el)) {
                $foundHidden = true;
                continue;
            }
            return ['menu' => (string) $def['slot'], 'position' => $i];
        }
    }
    return ['menu' => 'hidden', 'position' => 1, 'wasHidden' => $foundHidden];
}

function st_builder_uk_title(string $title): array
{
    $title = trim(preg_replace('/\s+/', ' ', $title) ?? $title);
    if ($title === '') throw new RuntimeException('Enter a page title.');
    if (mb_strlen($title) > 140) $title = mb_substr($title, 0, 140);
    if (preg_match('/\p{Cyrillic}/u', $title)) return [$title, ''];
    $uk = $title;
    try {
        require_once __DIR__ . '/tlumacz.php';
        if (function_exists('st_i18n_many')) {
            $map = st_i18n_many([$title], 'en', 'uk');
            $got = trim((string) ($map[$title] ?? ''));
            if ($got !== '') $uk = $got;
        }
    } catch (Throwable) {
        $uk = $title;
    }
    $en = ($uk !== $title) ? $title : '';
    return [$uk, $en];
}

function st_builder_slug(string $raw, string $fallbackTitle): string
{
    $raw = trim($raw);
    $base = $raw !== '' ? $raw : $fallbackTitle;
    if (preg_match('/\p{Cyrillic}/u', $base)) $base = st_cms_lat($base);
    $slug = st_cms_slugify($base);
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        throw new RuntimeException('The address slug can use only letters, numbers and hyphens.');
    }
    if (in_array($slug, ['panel', 'assets', 'wyslij', 'index', 'build'], true)) {
        throw new RuntimeException('That address is reserved. Choose another slug.');
    }
    return $slug;
}

function st_builder_parents(): array
{
    $out = [];
    foreach (st_cms_pages() as $p) {
        if (($p['role'] ?? '') !== 'group') continue;
        $out[] = [
            'id' => (string) $p['id'],
            'name' => (string) $p['name'],
            'url' => (string) $p['url'],
        ];
    }
    return $out;
}

function st_builder_catalog(): array
{
    $layout = (string) file_get_contents(ST_LAYOUT);
    $pages = [];
    foreach (st_cms_pages() as $p) {
        $url = (string) ($p['url'] ?? '');
        $place = st_builder_menu_find($layout, $url);
        $pages[] = [
            'id' => (string) $p['id'],
            'name' => (string) $p['name'],
            'url' => $url,
            'role' => (string) ($p['role'] ?? ''),
            'kindLabel' => (string) ($p['kindLabel'] ?? ''),
            'parentName' => (string) ($p['parentName'] ?? ''),
            'parentUrl' => (string) ($p['parentUrl'] ?? ''),
            'thumb' => (string) ($p['image'] ?? ''),
            'added' => !empty($p['added']),
            'canDelete' => !empty($p['canDelete']),
            'menu' => (string) $place['menu'],
            'menuLabel' => st_builder_menu_label((string) $place['menu']),
            'position' => (int) $place['position'],
        ];
    }
    return [
        'ok' => true,
        'pages' => $pages,
        'parents' => st_builder_parents(),
        'menus' => [
            ['id' => 'top', 'label' => st_builder_menu_label('top')],
            ['id' => 'machines', 'label' => st_builder_menu_label('machines')],
            ['id' => 'spot', 'label' => st_builder_menu_label('spot')],
            ['id' => 'studs', 'label' => st_builder_menu_label('studs')],
            ['id' => 'hidden', 'label' => st_builder_menu_label('hidden')],
        ],
    ];
}

function st_builder_page_html(string $titleUk): string
{
    $t = htmlspecialchars($titleUk, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return '<section class="hero hero--page hero--short">' . "\n"
        . '  <div class="hero__bg">' . "\n"
        . '    <picture>' . "\n"
        . '      <source srcset="/assets/img/company-hall-1.webp" type="image/webp">' . "\n"
        . '      <img src="/assets/img/company-hall-1.jpg" alt="" width="1600" height="869" fetchpriority="high" decoding="async">' . "\n"
        . '    </picture>' . "\n"
        . '  </div>' . "\n"
        . '  <div class="wrap hero__in">' . "\n"
        . '    <div class="hero__max">' . "\n"
        . '      <p class="eyebrow">SMOLTECH</p>' . "\n"
        . '      <h1 class="h-xl">' . $t . '</h1>' . "\n"
        . '      <p class="hero__sub">Короткий опис сторінки. Його можна змінити.</p>' . "\n"
        . '      <div class="hero__btns">' . "\n"
        . '        <a class="btn" href="/kontakty/#zapyt">Отримати пропозицію</a>' . "\n"
        . '      </div>' . "\n"
        . '    </div>' . "\n"
        . '  </div>' . "\n"
        . '  <span class="spark" aria-hidden="true"></span>' . "\n"
        . '</section>' . "\n\n"
        . '<section class="sec">' . "\n"
        . '  <div class="wrap">' . "\n"
        . '    <p class="eyebrow">Розділ</p>' . "\n"
        . '    <h2 class="h-lg">Заголовок</h2>' . "\n"
        . '    <p>Текст, який можна змінити.</p>' . "\n"
        . '  </div>' . "\n"
        . '</section>' . "\n\n"
        . "{{FORMULARZ}}\n";
}

function st_builder_insert_tile(string $body, array $item, int $position): string
{
    if (!preg_match_all('/<a class="tile\b[^"]*"[^>]*>.*?<\/a>/s', $body, $mm, PREG_OFFSET_CAPTURE)) return $body;
    $n = count($mm[0]);
    $position = max(1, min($position, $n + 1));
    $html = st_cms_fill_tile($mm[0][$n - 1][0], $item, max(0, $position - 1));
    if ($position > $n) {
        $last = $mm[0][$n - 1];
        $at = (int) $last[1] + strlen($last[0]);
        $body = substr($body, 0, $at) . "\n      " . $html . substr($body, $at);
    } else {
        $at = (int) $mm[0][$position - 1][1];
        $body = substr($body, 0, $at) . $html . "\n      " . substr($body, $at);
    }
    $body = st_cms_renumber_tiles($body);
    return st_cms_set_tile_grid($body, $n + 1);
}

function st_builder_move_tile(string $body, string $url, int $position): string
{
    if (!preg_match_all('/<a class="tile\b[^"]*"[^>]*>.*?<\/a>/s', $body, $mm, PREG_OFFSET_CAPTURE)) return $body;
    $want = st_builder_norm_url($url);
    $hit = null;
    $rest = [];
    foreach ($mm[0] as $row) {
        $html = $row[0];
        preg_match('/href="([^"]+)"/', $html, $hm);
        if ($hit === null && st_builder_norm_url((string) ($hm[1] ?? '')) === $want) $hit = $html;
        else $rest[] = $html;
    }
    if ($hit === null) return $body;
    $position = max(1, min($position, count($rest) + 1));
    array_splice($rest, $position - 1, 0, [$hit]);
    $start = (int) $mm[0][0][1];
    $last = $mm[0][count($mm[0]) - 1];
    $end = (int) $last[1] + strlen($last[0]);
    $body = substr($body, 0, $start) . implode("\n      ", $rest) . substr($body, $end);
    return st_cms_renumber_tiles($body);
}

function st_builder_write_layout(string $html): void
{
    if (!str_contains($html, '{{CONTENT}}') || !str_contains($html, '{{NAV_company}}') || !str_contains($html, '{{NAV_contact}}')) {
        throw new RuntimeException('The menu file no longer looks like the site layout. Nothing was saved.');
    }
    st_cms_atomic_write(ST_LAYOUT, $html, true);
}

function st_builder_clip(string $text, int $max): string
{
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($text) <= $max) return $text;
        return rtrim(mb_substr($text, 0, max(1, $max - 1))) . '…';
    }
    if (strlen($text) <= $max) return $text;
    return rtrim(substr($text, 0, max(1, $max - 1))) . '...';
}

function st_builder_set_h1(string $html, string $title): string
{
    $safe = htmlspecialchars($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $next = preg_replace('/<h1\b([^>]*)>.*?<\/h1>/is', '<h1$1>' . $safe . '</h1>', $html, 1);
    return is_string($next) ? $next : $html;
}

/** Point links that targeted the template page itself at the new address. Child paths stay put. */
function st_builder_retarget_links(string $html, string $oldUrl, string $newUrl): string
{
    $old = st_builder_norm_url($oldUrl);
    $new = st_builder_norm_url($newUrl);
    if ($old === '' || $old === '/' || $old === $new) return $html;
    $oldPath = rtrim($old, '/');
    $end = "[?#\"'\\s>]|\$";
    $re = "~(?<=['\"=\\s])((?:https?://(?:www\\.)?smoltech\\.ua)?)" . preg_quote($oldPath, '~') . "(?:/(?=" . $end . ")|(?=" . $end . "))~i";
    $next = preg_replace_callback($re, static function (array $m) use ($new): string {
        return $m[1] . $new;
    }, $html);
    return is_string($next) ? $next : $html;
}

function st_builder_place(array $data): array
{
    $menu = (string) ($data['menu'] ?? 'hidden');
    $position = (int) ($data['position'] ?? 1);
    if ($position < 1) $position = 1;
    if ($position > 40) $position = 40;
    $id = trim((string) ($data['id'] ?? ''));
    $layout = (string) file_get_contents(ST_LAYOUT);
    $cardNote = '';

    if ($id !== '') {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Unknown page.');
        $path = ST_PAGES . '/' . $id . '.html';
        if (!is_file($path)) throw new RuntimeException('That page was not found.');
        [$meta, $body] = st_cms_parse((string) file_get_contents($path));
        $url = (string) ($meta['url'] ?? '');
        $label = trim((string) ($meta['crumbs'] ?? ''));
        if (str_contains($label, '|')) $label = trim((string) preg_replace('/^.*\|\s*/', '', $label));
        if ($label === '') $label = trim(strip_tags((string) ($meta['title'] ?? 'Сторінка')));
        $label = trim(explode('|', $label)[0]);
        if (mb_strlen($label) > 80) $label = mb_substr($label, 0, 80);
        $next = st_builder_menu_apply($layout, $url, $menu, $position, $label);
        $layoutChanged = $next !== $layout;
        if ($layoutChanged) st_builder_write_layout($next);
        $tileChanged = false;
        $parentUrl = '';
        foreach (st_cms_pages() as $p) {
            if (($p['id'] ?? '') === $id) { $parentUrl = (string) ($p['parentUrl'] ?? ''); break; }
        }
        if ($parentUrl !== '') {
            foreach (st_cms_pages() as $p) {
                if ((string) ($p['url'] ?? '') !== $parentUrl) continue;
                $pp = ST_PAGES . '/' . $p['id'] . '.html';
                if (!is_file($pp)) break;
                [$pm, $pb] = st_cms_parse((string) file_get_contents($pp));
                $moved = st_builder_move_tile($pb, $url, $position);
                if ($moved !== $pb) {
                    st_cms_atomic_write($pp, st_cms_dump($pm, $moved), true);
                    $tileChanged = true;
                    $cardNote = ' Its card on "' . $p['name'] . '" was moved to position ' . $position . '.';
                }
                break;
            }
        }
        $place = st_builder_menu_find((string) file_get_contents(ST_LAYOUT), $url);
        if ($layoutChanged || $tileChanged) st_cms_publish_page($id, true);
        $where = 'This page is in the ' . st_builder_menu_label((string) $place['menu']) . ' at position ' . (int) $place['position'] . '. Address: ' . $url . '.' . $cardNote;
        return [
            'ok' => true,
            'id' => $id,
            'url' => $url,
            'menu' => $place['menu'],
            'position' => (int) $place['position'],
            'where' => $where,
            'created' => false,
        ];
    }

    [$titleUk, $titleEn] = st_builder_uk_title((string) ($data['title'] ?? ''));
    $slug = st_builder_slug((string) ($data['slug'] ?? ''), $titleEn !== '' ? $titleEn : $titleUk);
    $parentId = trim((string) ($data['parent'] ?? ''));
    $parent = null;
    if ($parentId !== '') {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $parentId)) throw new RuntimeException('Unknown category.');
        foreach (st_cms_pages() as $p) {
            if (($p['id'] ?? '') === $parentId && ($p['role'] ?? '') === 'group') { $parent = $p; break; }
        }
        if ($parent === null) throw new RuntimeException('Choose a category that is a group page, or leave it as top level.');
    }
    $pages = st_cms_pages();
    $usedId = [];
    $usedUrl = [];
    foreach ($pages as $p) {
        $usedId[(string) $p['id']] = true;
        $usedUrl[st_builder_norm_url((string) ($p['url'] ?? ''))] = true;
    }
    $purl = $parent ? rtrim((string) $parent['url'], '/') : '';
    $url = ($purl !== '' ? $purl : '') . '/' . $slug . '/';
    $url = preg_replace('#/+#', '/', $url) ?? $url;
    if (!str_starts_with($url, '/')) $url = '/' . $url;
    $baseUrl = $url;
    $n = 2;
    while (isset($usedUrl[st_builder_norm_url($url)])) {
        $url = rtrim($baseUrl, '/') . '-' . $n . '/';
        $n++;
    }
    $nums = [];
    foreach ($pages as $p) {
        if (preg_match('/^(\d+)/', (string) $p['id'], $nm)) $nums[] = (int) $nm[1];
    }
    $nxt = $nums !== [] ? max($nums) + 1 : 80;
    $idSlug = $slug;
    $extra = 0;
    do {
        $newId = $nxt . '-' . $idSlug;
        if (!isset($usedId[$newId]) && !is_file(ST_PAGES . '/' . $newId . '.html')) break;
        $extra++;
        $idSlug = $slug . '-' . ($extra + 1);
    } while ($extra < 30);
    $out = trim($url, '/') . '/index.html';
    $nav = $parent ? (string) ($parent['nav'] ?? '') : match ($menu) {
        'machines', 'spot' => 'machines',
        'studs' => 'studs',
        default => '',
    };
    $parentCrumb = '';
    if ($parent) {
        $ppath = ST_PAGES . '/' . $parent['id'] . '.html';
        if (is_file($ppath)) {
            [$pm] = st_cms_parse((string) file_get_contents($ppath));
            $parentCrumb = trim((string) ($pm['crumbs'] ?? ''));
            if (str_contains($parentCrumb, '|')) {
                $parentCrumb = trim((string) preg_replace('/^.*\|\s*/u', '', $parentCrumb));
            }
            if (str_contains($parentCrumb, '>>')) $parentCrumb = trim(explode('>>', $parentCrumb, 2)[0]);
        }
        if ($parentCrumb === '') $parentCrumb = $titleUk;
    }
    $crumbs = $parent
        ? ($parentCrumb . '>>' . (string) $parent['url'] . ' | ' . $titleUk)
        : $titleUk;
    $adminName = $titleEn !== '' ? $titleEn : $titleUk;
    $desc = 'Короткий опис сторінки. Його можна змінити.';
    $og = '';
    $bodyHtml = st_builder_page_html($titleUk);
    $tileImage = '/assets/img/company-hall-1.jpg';
    $tileText = $desc;
    $tileTag = 'SMOLTECH';
    $fromNote = '';
    $templateId = trim((string) ($data['template'] ?? ''));
    if ($templateId !== '') {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $templateId)) throw new RuntimeException('Unknown template.');
        $tpath = ST_PAGES . '/' . $templateId . '.html';
        if (!is_file($tpath)) throw new RuntimeException('That template page was not found.');
        [$tm, $tbody] = st_cms_parse((string) file_get_contents($tpath));
        $bodyHtml = st_builder_retarget_links(st_builder_set_h1($tbody, $titleUk), (string) ($tm['url'] ?? ''), $url);
        $og = trim((string) ($tm['og'] ?? ''));
        $desc = $titleUk . '. Опис для пошуку можна змінити.';
        $hero = st_cms_hero($bodyHtml);
        if ($hero['image'] !== '') $tileImage = $hero['image'];
        if ($hero['sub'] !== '') $tileText = st_builder_clip(st_cms_strip($hero['sub']), 180);
        if ($hero['eyebrow'] !== '') $tileTag = st_builder_clip(st_cms_strip($hero['eyebrow']), 40);
        $fromName = '';
        foreach ($pages as $p) {
            if ((string) ($p['id'] ?? '') === $templateId) { $fromName = (string) $p['name']; break; }
        }
        $fromNote = ' Based on "' . ($fromName !== '' ? $fromName : $templateId) . '".';
    }
    $meta = [
        'out' => $out,
        'url' => $url,
        'nav' => $nav,
        'title' => $titleUk . ' | SMOLTECH',
        'desc' => $desc,
        'ogtitle' => $titleUk,
        'crumbs' => $crumbs,
        'prio' => '0.6',
        'added' => '1',
        'label' => $adminName,
    ];
    if ($og !== '') $meta['og'] = $og;
    st_cms_atomic_write(ST_PAGES . '/' . $newId . '.html', st_cms_dump($meta, $bodyHtml), true);
    if ($parent) {
        $pp = ST_PAGES . '/' . $parent['id'] . '.html';
        [$pm, $pb] = st_cms_parse((string) file_get_contents($pp));
        $inserted = st_builder_insert_tile($pb, [
            'href' => $url,
            'title' => $titleUk,
            'tag' => $tileTag,
            'text' => $tileText,
            'link' => $titleUk,
            'image' => $tileImage,
        ], $position);
        if ($inserted !== $pb) {
            st_cms_atomic_write($pp, st_cms_dump($pm, $inserted), true);
            $cardNote = ' A card was added on "' . $parent['name'] . '" at position ' . $position . '.';
        } else {
            $cardNote = ' "' . $parent['name'] . '" has no card grid, so no card was added there. The address is still under that category.';
        }
    }
    $next = st_builder_menu_apply($layout, $url, $menu, $position, $titleUk);
    if ($next !== $layout) st_builder_write_layout($next);
    if ($titleEn !== '') {
        require_once __DIR__ . '/tlumacz.php';
        st_i18n_author_pairs([['uk' => $titleUk, 'en' => $titleEn]]);
    }
    $place = st_builder_menu_find((string) file_get_contents(ST_LAYOUT), $url);
    st_cms_publish_page($newId, true);
    $slugNote = st_builder_norm_url($url) !== st_builder_norm_url($baseUrl)
        ? ' That address was already used, so this page is at ' . $url . '.'
        : '';
    $where = 'Created.' . $fromNote . ' It is in the ' . st_builder_menu_label((string) $place['menu'])
        . ' at position ' . (int) $place['position'] . '. Address: ' . $url . '.' . $slugNote . $cardNote . ' It is open for editing.';
    return [
        'ok' => true,
        'id' => $newId,
        'url' => $url,
        'name' => $adminName,
        'menu' => $place['menu'],
        'position' => (int) $place['position'],
        'where' => $where,
        'created' => true,
    ];
}

function st_builder_footer_region(string $html): ?array
{
    $pos = strpos($html, 'class="ftr__col ftr__col--prod"');
    if ($pos === false) return null;
    $ul = strpos($html, '<ul', $pos);
    if ($ul === false) return null;
    $gt = strpos($html, '>', $ul);
    if ($gt === false) return null;
    $end = st_builder_el_end($html, 'ul', $gt + 1);
    if ($end === null) return null;
    return [
        'start' => $ul,
        'end' => $end,
        'innerStart' => $gt + 1,
        'innerEnd' => $end - strlen('</ul>'),
    ];
}

function st_builder_footer_remove(string $html, string $url): string
{
    $region = st_builder_footer_region($html);
    if ($region === null) return $html;
    $want = st_builder_norm_url($url);
    if ($want === '') return $html;
    $children = st_builder_direct_children($html, $region['innerStart'], $region['innerEnd']);
    $kept = [];
    $changed = false;
    foreach ($children as $el) {
        if (st_builder_own_href($el) === $want) { $changed = true; continue; }
        $kept[] = $el;
    }
    if (!$changed) return $html;
    return st_builder_splice_children($html, $region, $kept);
}

/** Footer line is "tag — title". Each language needs its own pair or the tag stays glued to the Ukrainian name. */
function st_builder_footer_labels(string $tag, string $titleUk, string $titleEn, string $titleRu = ''): array
{
    $tag = trim($tag);
    $titleUk = trim($titleUk);
    $titleEn = trim($titleEn);
    $titleRu = trim($titleRu);
    $uk = $tag !== '' ? st_builder_clip($tag . ' — ' . $titleUk, 48) : st_builder_clip($titleUk, 48);
    $en = '';
    if ($titleEn !== '' && $titleEn !== $titleUk) {
        $en = $tag !== '' ? st_builder_clip($tag . ' — ' . $titleEn, 48) : st_builder_clip($titleEn, 48);
        if ($en === $uk) $en = '';
    }
    $ru = '';
    if ($titleRu !== '' && $titleRu !== $titleUk) {
        $ru = $tag !== '' ? st_builder_clip($tag . ' — ' . $titleRu, 48) : st_builder_clip($titleRu, 48);
        if ($ru === $uk) $ru = '';
    }
    return [$uk, $en, $ru];
}

function st_builder_footer_insert(string $html, string $url, string $label, array $siblingUrls): string
{
    $region = st_builder_footer_region($html);
    if ($region === null) return $html;
    $want = st_builder_norm_url($url);
    if ($want === '') return $html;
    $sibs = [];
    foreach ($siblingUrls as $u) {
        $n = st_builder_norm_url((string) $u);
        if ($n !== '') $sibs[$n] = true;
    }
    $children = st_builder_direct_children($html, $region['innerStart'], $region['innerEnd']);
    $last = -1;
    foreach ($children as $i => $el) {
        $h = st_builder_own_href($el);
        if ($h === $want) return $html;
        if (isset($sibs[$h])) $last = $i;
    }
    if ($last < 0) return $html;
    $li = '<li><a href="' . htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '">'
        . htmlspecialchars($label, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '</a></li>';
    array_splice($children, $last + 1, 0, [$li]);
    return st_builder_splice_children($html, $region, $children);
}

function st_builder_reorder_list(string $html, array $region, array $urlsInOrder): string
{
    $children = st_builder_direct_children($html, $region['innerStart'], $region['innerEnd']);
    $want = [];
    foreach ($urlsInOrder as $u) {
        $n = st_builder_norm_url((string) $u);
        if ($n !== '') $want[$n] = true;
    }
    $hits = [];
    $indexes = [];
    foreach ($children as $i => $el) {
        $h = st_builder_own_href($el);
        if ($h !== '' && isset($want[$h]) && !isset($hits[$h])) {
            $hits[$h] = $el;
            $indexes[] = $i;
        }
    }
    if (count($indexes) < 2) return $html;
    $current = [];
    foreach ($indexes as $i) $current[] = st_builder_own_href($children[$i]);
    $desired = [];
    $block = [];
    foreach ($urlsInOrder as $u) {
        $n = st_builder_norm_url((string) $u);
        if (!isset($hits[$n])) continue;
        $desired[] = $n;
        $block[] = $hits[$n];
    }
    if ($block === [] || $current === $desired) return $html;
    $at = array_flip($indexes);
    $new = [];
    $placed = false;
    foreach ($children as $i => $el) {
        if (isset($at[$i])) {
            if (!$placed) {
                foreach ($block as $b) $new[] = $b;
                $placed = true;
            }
            continue;
        }
        $new[] = $el;
    }
    return st_builder_splice_children($html, $region, $new);
}

function st_builder_splice_children(string $html, array $region, array $desired): string
{
    $inner = substr($html, $region['innerStart'], $region['innerEnd'] - $region['innerStart']);
    $indent = "\n        ";
    $tail = "\n      ";
    if (preg_match('/\r?\n([ \t]*)<li\b/', $inner, $m)) $indent = "\n" . $m[1];
    if (preg_match('/\r?\n([ \t]*)$/', $inner, $tm)) $tail = "\n" . $tm[1];
    $joined = $indent . implode($indent, $desired) . $tail;
    if ($joined === $inner) return $html;
    return substr($html, 0, $region['innerStart']) . $joined . substr($html, $region['innerEnd']);
}

function st_builder_reorder_slot(string $html, string $slot, array $urls): string
{
    $regions = [];
    foreach (st_builder_menu_defs() as $def) {
        if (($def['slot'] ?? '') !== $slot) continue;
        $region = st_builder_find_region($html, $def);
        if ($region !== null) $regions[] = $region;
    }
    usort($regions, static fn(array $a, array $b): int => $b['start'] <=> $a['start']);
    foreach ($regions as $region) $html = st_builder_reorder_list($html, $region, $urls);
    return $html;
}

function st_builder_sync_tile_nav(string $id): bool
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) return false;
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) return false;
    [$meta, $body] = st_cms_parse((string) file_get_contents($path));
    $parentUrl = (string) ($meta['url'] ?? '');
    if ($parentUrl === '') return false;
    $ordered = [];
    foreach (st_cms_tiles($body) as $tile) {
        $u = st_builder_norm_url((string) ($tile['href'] ?? ''));
        if ($u === '' || in_array($u, $ordered, true)) continue;
        $ordered[] = $u;
    }
    if (count($ordered) < 2) return false;
    $child = [];
    foreach (st_cms_pages() as $p) {
        if ((string) ($p['parentUrl'] ?? '') === $parentUrl) $child[st_builder_norm_url((string) ($p['url'] ?? ''))] = true;
    }
    $urls = [];
    foreach ($ordered as $u) if (!empty($child[$u])) $urls[] = $u;
    if (count($urls) < 2) return false;
    $layout = (string) file_get_contents(ST_LAYOUT);
    $slot = 'hidden';
    $best = 0;
    foreach (st_builder_menu_defs() as $def) {
        if (empty($def['desktop'])) continue;
        $n = 0;
        foreach ($urls as $u) {
            $place = st_builder_menu_find($layout, $u);
            if ($place['menu'] === $def['slot']) $n++;
        }
        if ($n > $best) { $best = $n; $slot = (string) $def['slot']; }
    }
    $next = $layout;
    if ($slot !== 'hidden') $next = st_builder_reorder_slot($next, $slot, $urls);
    $region = st_builder_footer_region($next);
    if ($region !== null) $next = st_builder_reorder_list($next, $region, $urls);
    if ($next === $layout) return false;
    st_builder_write_layout($next);
    return true;
}

function st_builder_one_variant(string $body, string $name, string $image = ''): string
{
    $safe = htmlspecialchars($name !== '' ? $name : 'Модель 1', ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $img = htmlspecialchars($image, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $offset = 0;
    while (preg_match('/<ul class="model-strip\b[^"]*"[^>]*>/i', $body, $m, PREG_OFFSET_CAPTURE, $offset)) {
        $start = (int) $m[0][1];
        $open = $m[0][0];
        $gt = $start + strlen($open);
        $end = st_builder_el_end($body, 'ul', $gt);
        if ($end === null) break;
        $inner = substr($body, $gt, $end - strlen('</ul>') - $gt);
        if (!preg_match('/<li\b.*?<\/li>/s', $inner, $li)) { $offset = $end; continue; }
        $item = $li[0];
        $item = preg_replace('/\sclass="model-strip__btn[^"]*"/', ' class="model-strip__btn is-active"', $item, 1) ?? $item;
        $item = preg_replace('/data-model="\d+"/', 'data-model="1"', $item, 1) ?? $item;
        $item = preg_replace('/aria-pressed="(?:true|false)"/', 'aria-pressed="true"', $item, 1) ?? $item;
        $item = preg_replace('/(<span class="model-strip__name"[^>]*>).*?(<\/span>)/s', '$1' . $safe . '$2', $item, 1) ?? $item;
        if ($img !== '') {
            $item = preg_replace('/\s(src|srcset)="[^"]*"/', ' $1="' . $img . '"', $item) ?? $item;
        }
        $newOpen = $open;
        if (preg_match('/class="([^"]*)"/', $newOpen, $cm)) {
            $cls = st_cms_with_count($cm[1], 'model-strip', 1, 3);
            $newOpen = preg_replace('/class="[^"]*"/', 'class="' . $cls . '"', $newOpen, 1) ?? $newOpen;
        }
        if (preg_match('/aria-label="[^"]*"/', $newOpen)) {
            $newOpen = preg_replace('/aria-label="[^"]*"/', 'aria-label="' . $safe . '"', $newOpen, 1) ?? $newOpen;
        }
        if (str_contains($newOpen, 'model-strip--shots')) {
            if (preg_match('/style="/', $newOpen)) $newOpen = preg_replace('/style="[^"]*"/', 'style="--ms-cols:1"', $newOpen, 1) ?? $newOpen;
            else $newOpen = substr($newOpen, 0, -1) . ' style="--ms-cols:1">';
        }
        $newUl = $newOpen . "\n        " . $item . "\n      </ul>";
        $body = substr($body, 0, $start) . $newUl . substr($body, $end);
        $offset = $start + strlen($newUl);
    }
    $offset = 0;
    while (preg_match('/<div class="param-matrix\b/', $body, $m, PREG_OFFSET_CAPTURE, $offset)) {
        $start = (int) $m[0][1];
        $gt = strpos($body, '>', $start);
        if ($gt === false) break;
        $end = st_builder_el_end($body, 'div', $gt + 1);
        if ($end === null) break;
        $block = substr($body, $start, $end - $start);
        if (preg_match('/<div class="param-matrix__table"[^>]*>/', $block, $tm, PREG_OFFSET_CAPTURE)) {
            $tStart = (int) $tm[0][1];
            $tOpenLen = strlen($tm[0][0]);
            $tEnd = st_builder_el_end($block, 'div', $tStart + $tOpenLen);
            if ($tEnd !== null && preg_match_all('/<div class="param-matrix__cell\b[^"]*"[^>]*>.*?<\/div>/s', substr($block, $tStart + $tOpenLen, $tEnd - strlen('</div>') - ($tStart + $tOpenLen)), $cells)) {
                $kept = [];
                foreach ($cells[0] as $cell) {
                    if (preg_match('/data-col="(\d+)"/', $cell, $cm)) {
                        if ($cm[1] !== '1') continue;
                        if (str_contains($cell, 'param-matrix__head') && !str_contains($cell, 'param-matrix__label')) {
                            $cell = preg_replace('/(<div\b[^>]*>).*?(<\/div>)/s', '$1' . $safe . '$2', $cell, 1) ?? $cell;
                        } elseif (str_contains($cell, 'param-matrix__val')) {
                            $cell = preg_replace('/(<div\b[^>]*>).*?(<\/div>)/s', '$1—$2', $cell, 1) ?? $cell;
                        }
                    }
                    $kept[] = $cell;
                }
                $newTable = $tm[0][0] . "\n" . implode("\n", $kept) . "\n          </div>";
                $block = substr($block, 0, $tStart) . $newTable . substr($block, $tEnd);
            }
        }
        $block = preg_replace_callback('/<div class="(param-matrix\b[^"]*)"([^>]*)>/', static function (array $wm): string {
            $cls = preg_replace('/\bparam-matrix--\d+\b/', '', $wm[1]) ?? $wm[1];
            $cls = trim((string) preg_replace('/\s+/', ' ', $cls));
            if (!str_contains($cls, 'param-matrix--1')) $cls .= ' param-matrix--1';
            $attrs = preg_replace('/\sstyle="[^"]*"/', '', $wm[2]) ?? $wm[2];
            return '<div class="' . trim($cls) . '"' . $attrs . ' style="--pm-cols:1">';
        }, $block, 1) ?? $block;
        $body = substr($body, 0, $start) . $block . substr($body, $end);
        $offset = $start + strlen($block);
    }
    return $body;
}

function st_builder_norm_name(string $text): string
{
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    return function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
}

function st_builder_title_taken(string $title, array $tiles, array $children): bool
{
    $want = st_builder_norm_name($title);
    if ($want === '') return false;
    foreach ($tiles as $tile) {
        if (st_builder_norm_name((string) ($tile['title'] ?? '')) === $want) return true;
    }
    foreach ($children as $ch) {
        foreach (['name', 'title', 'label'] as $key) {
            $have = st_builder_norm_name((string) ($ch[$key] ?? ''));
            if ($have !== '' && $have === $want) return true;
        }
    }
    return false;
}

function st_builder_remove_blocks(string $html, string $tag, string $class): string
{
    $re = '/<' . preg_quote($tag, '/') . '\b[^>]*class="[^"]*\b' . preg_quote($class, '/') . '\b[^"]*"[^>]*>/i';
    $offset = 0;
    while (preg_match($re, $html, $m, PREG_OFFSET_CAPTURE, $offset)) {
        $start = (int) $m[0][1];
        $end = st_builder_el_end($html, $tag, $start + strlen($m[0][0]));
        if ($end === null) break;
        $html = substr($html, 0, $start) . substr($html, $end);
        $offset = $start;
    }
    return $html;
}

/** Keep every section from the sibling page. Replace its words and photos with empty slots. */
function st_builder_neutral_body(string $html, string $title, string $text): string
{
    $token = 'STFORMHOLD';
    $html = str_replace('{{FORMULARZ}}', '<div id="' . $token . '"></div>', $html);
    $html = str_replace('{{YT_PLAY}}', '', $html);
    $prev = libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $wrapped = '<?xml encoding="UTF-8"><div id="st-blank-root">' . $html . '</div>';
    $dom->loadHTML($wrapped, LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($prev);
    $root = $dom->getElementById('st-blank-root');
    if (!$root instanceof DOMElement) return str_replace('<div id="' . $token . '"></div>', '{{FORMULARZ}}', $html);
    $xp = new DOMXPath($dom);
    $slot = '/assets/img/slot.svg';
    foreach ($xp->query('.//img', $root) ?: [] as $img) {
        if (!$img instanceof DOMElement) continue;
        $img->setAttribute('src', $slot);
        $img->removeAttribute('srcset');
        $img->setAttribute('alt', 'Фото');
        $cls = trim($img->getAttribute('class') . ' is-slot');
        $img->setAttribute('class', preg_replace('/\s+/', ' ', $cls) ?? $cls);
    }
    $sources = [];
    foreach ($xp->query('.//source', $root) ?: [] as $src) $sources[] = $src;
    foreach ($sources as $src) {
        if (!$src instanceof DOMElement || !$src->parentNode) continue;
        $parent = $src->parentNode;
        $lifted = [];
        foreach (iterator_to_array($src->childNodes) as $child) {
            if ($child instanceof DOMElement && strtolower($child->tagName) === 'img') $lifted[] = $child;
        }
        foreach ($lifted as $img) $parent->insertBefore($img, $src);
        $parent->removeChild($src);
    }
    foreach ($xp->query('.//a[@href]', $root) ?: [] as $a) {
        if (!$a instanceof DOMElement) continue;
        $href = $a->getAttribute('href');
        if ($href === '' || str_starts_with($href, '#') || preg_match('/^(?:mailto:|tel:)/i', $href)) continue;
        if (preg_match('#^(?:https?:)?//#i', $href)) continue;
        $a->setAttribute('href', '#zapyt');
    }
    foreach ($xp->query('.//*[@data-vid]', $root) ?: [] as $btn) {
        if (!$btn instanceof DOMElement) continue;
        $btn->setAttribute('data-vid', '');
        $btn->setAttribute('data-title', 'Нове відео');
        if ($btn->hasAttribute('aria-label')) $btn->setAttribute('aria-label', 'Дивитись відео');
    }
    $nodes = [];
    foreach ($xp->query('.//text()', $root) ?: [] as $node) $nodes[] = $node;
    $filled = new SplObjectStorage();
    foreach ($nodes as $node) {
        if (!$node instanceof DOMText) continue;
        $parent = $node->parentNode;
        if (!$parent instanceof DOMElement) continue;
        if (st_builder_blank_skip($parent)) continue;
        $raw = trim(preg_replace('/\s+/u', ' ', $node->nodeValue) ?? '');
        if ($raw === '') continue;
        $host = st_builder_blank_host($parent);
        if (!$host instanceof DOMElement) continue;
        if ($filled->contains($host)) {
            $node->nodeValue = '';
            continue;
        }
        $label = st_builder_blank_label($host, $title, $text);
        if ($label === null) continue;
        $node->nodeValue = $label;
        $filled->attach($host);
    }
    $out = '';
    foreach ($root->childNodes as $child) $out .= $dom->saveHTML($child);
    $out = str_replace('<div id="' . $token . '"></div>', '{{FORMULARZ}}', $out);
    return $out;
}

function st_builder_blank_skip(DOMElement $el): bool
{
    for ($n = $el; $n instanceof DOMElement; $n = $n->parentNode instanceof DOMElement ? $n->parentNode : null) {
        $tag = strtolower($n->tagName);
        if ($tag === 'script' || $tag === 'style' || $tag === 'svg' || $tag === 'noscript') return true;
    }
    return false;
}

function st_builder_blank_host(DOMElement $el): ?DOMElement
{
    $n = $el;
    while ($n instanceof DOMElement) {
        $tag = strtolower($n->tagName);
        $cls = ' ' . $n->getAttribute('class') . ' ';
        if (str_contains($cls, ' model-strip__name ') || str_contains($cls, ' param-matrix__') || str_contains($cls, ' eyebrow ')
            || str_contains($cls, ' hero__sub ') || str_contains($cls, ' tag ') || str_contains($cls, ' vcard__kind ')
            || str_contains($cls, ' mach__idx ') || str_contains($cls, ' proof__n ') || str_contains($cls, ' proof__l ')) {
            return $n;
        }
        if (in_array($tag, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'figcaption', 'button', 'summary', 'td', 'th', 'a'], true)) return $n;
        if ($tag === 'div' && preg_match('/\bparam-matrix__/', $cls)) return $n;
        $n = $n->parentNode instanceof DOMElement ? $n->parentNode : null;
    }
    return null;
}

function st_builder_blank_label(DOMElement $el, string $title, string $text): ?string
{
    $tag = strtolower($el->tagName);
    $cls = ' ' . $el->getAttribute('class') . ' ';
    if ($tag === 'h1') return null;
    if (str_contains($cls, ' model-strip__name ')) return $title !== '' ? $title : 'Модель';
    if (str_contains($cls, ' param-matrix__val ')) return '—';
    if (str_contains($cls, ' param-matrix__label ')) return null;
    if (str_contains($cls, ' param-matrix__head ')) return $title !== '' ? $title : 'Модель';
    if (str_contains($cls, ' eyebrow ')) return 'Розділ';
    if (str_contains($cls, ' hero__sub ')) return $text !== '' ? $text : 'Короткий опис, який можна змінити.';
    if (str_contains($cls, ' lead ')) return 'Короткий опис, який можна змінити.';
    if (str_contains($cls, ' mach__idx ') || str_contains($cls, ' proof__n ')) return '—';
    if (str_contains($cls, ' tag ') || str_contains($cls, ' vcard__kind ')) return 'Позначка';
    if ($tag === 'h2' && st_builder_in_spec($el)) return 'Специфікація';
    if (in_array($tag, ['h2', 'h3', 'h4', 'h5', 'h6', 'summary'], true)) return 'Заголовок';
    if ($tag === 'figcaption') return 'Підпис';
    if ($tag === 'li') return 'Пункт';
    if ($tag === 'button' && str_contains($cls, ' yt ')) return 'Нове відео';
    if ($tag === 'a' && str_contains($cls, ' btn ')) return 'Запросити пропозицію';
    if ($tag === 'a') return 'Докладніше';
    if (in_array($tag, ['p', 'td', 'th', 'div', 'span', 'strong'], true)) return 'Текст, який можна змінити.';
    return null;
}

/** Placeholder wording, and the English the public site should show for that wording. */
function st_builder_slot_dict(): array
{
    return [
        'Розділ' => 'Section',
        'Заголовок' => 'Heading',
        'Специфікація' => 'Specification',
        'Короткий опис, який можна змінити.' => 'Short description you can change.',
        'Текст, який можна змінити.' => 'Text you can change.',
        'Пункт' => 'Item',
        'Позначка' => 'Label',
        'Підпис' => 'Caption',
        'Нове відео' => 'New video',
        'Запросити пропозицію' => 'Request a quote',
        'Докладніше' => 'Read more',
        'Питання' => 'Question',
        'Нова модель' => 'New model',
        'Модель' => 'Model',
        'Відео' => 'Video',
        'Дивитись відео' => 'Watch the video',
        'Партнери' => 'Partners',
        'Галерея' => 'Gallery',
        'Перелік' => 'List',
        'Цифри' => 'Figures',
        'Підбір' => 'Selection',
        'Наступний крок' => 'Next step',
        'Фото' => 'Photo',
        'Новий пункт' => 'New item',
    ];
}

/** Russian wording for the same placeholders. Identical strings are omitted. */
function st_builder_slot_ru(): array
{
    return [
        'Розділ' => 'Раздел',
        'Специфікація' => 'Спецификация',
        'Короткий опис, який можна змінити.' => 'Краткое описание, которое можно изменить.',
        'Текст, який можна змінити.' => 'Текст, который можно изменить.',
        'Позначка' => 'Метка',
        'Підпис' => 'Подпись',
        'Нове відео' => 'Новое видео',
        'Запросити пропозицію' => 'Запросить предложение',
        'Докладніше' => 'Подробнее',
        'Питання' => 'Вопрос',
        'Нова модель' => 'Новая модель',
        'Відео' => 'Видео',
        'Дивитись відео' => 'Смотреть видео',
        'Партнери' => 'Партнёры',
        'Галерея' => 'Галерея',
        'Перелік' => 'Список',
        'Цифри' => 'Цифры',
        'Підбір' => 'Подбор',
        'Наступний крок' => 'Следующий шаг',
        'Новий пункт' => 'Новый пункт',
    ];
}

/** Invisible per-instance mark so each placeholder has its own translation key. */
function st_builder_slot_mark(): string
{
    static $n = 0;
    $n++;
    $id = dechex($n) . bin2hex(random_bytes(4));
    $out = '';
    $len = strlen($id);
    for ($i = 0; $i < $len; $i++) {
        $c = ord($id[$i]);
        for ($b = 7; $b >= 0; $b--) $out .= (($c >> $b) & 1) ? "\u{200D}" : "\u{200C}";
    }
    return $out;
}

/**
 * Give every generic placeholder its own key and an English pair.
 * Real specification row names are left as written.
 *
 * @return array{0:string,1:list<array{uk:string,en:string}>}
 */
function st_builder_personal_slots(string $html): array
{
    $dict = st_builder_slot_dict();
    $ruDict = st_builder_slot_ru();
    $token = 'STFORMHOLD';
    $html = str_replace('{{FORMULARZ}}', '<div id="' . $token . '"></div>', $html);
    $prev = libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML('<?xml encoding="UTF-8"><div id="st-slot-root">' . $html . '</div>', LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($prev);
    $root = $dom->getElementById('st-slot-root');
    if (!$root instanceof DOMElement) {
        return [str_replace('<div id="' . $token . '"></div>', '{{FORMULARZ}}', $html), []];
    }
    $xp = new DOMXPath($dom);
    $pairs = [];
    foreach ($xp->query('.//text()', $root) ?: [] as $node) {
        if (!$node instanceof DOMText) continue;
        $parent = $node->parentNode;
        if ($parent instanceof DOMElement && in_array(strtolower($parent->tagName), ['script', 'style', 'svg'], true)) continue;
        $trim = trim(preg_replace('/\s+/u', ' ', $node->nodeValue) ?? '');
        $base = str_replace(["\u{200C}", "\u{200D}"], '', $trim);
        if (!isset($dict[$base])) continue;
        $key = $base . st_builder_slot_mark();
        $node->nodeValue = preg_replace('/' . preg_quote($trim, '/') . '/u', $key, $node->nodeValue, 1) ?? $key;
        $row = ['uk' => $key, 'en' => $dict[$base]];
        if (isset($ruDict[$base]) && $ruDict[$base] !== '' && $ruDict[$base] !== $base) $row['ru'] = $ruDict[$base];
        $pairs[] = $row;
    }
    foreach (['alt', 'aria-label', 'data-title', 'title'] as $attr) {
        foreach ($xp->query('.//*[@' . $attr . ']', $root) ?: [] as $el) {
            if (!$el instanceof DOMElement) continue;
            $trim = trim(preg_replace('/\s+/u', ' ', $el->getAttribute($attr)) ?? '');
            $base = str_replace(["\u{200C}", "\u{200D}"], '', $trim);
            if (!isset($dict[$base])) continue;
            $key = $base . st_builder_slot_mark();
            $el->setAttribute($attr, $key);
            $row = ['uk' => $key, 'en' => $dict[$base]];
            if (isset($ruDict[$base]) && $ruDict[$base] !== '' && $ruDict[$base] !== $base) $row['ru'] = $ruDict[$base];
            $pairs[] = $row;
        }
    }
    $out = '';
    foreach ($root->childNodes as $child) $out .= $dom->saveHTML($child);
    $out = str_replace('<div id="' . $token . '"></div>', '{{FORMULARZ}}', $out);
    return [$out, $pairs];
}

function st_builder_in_spec(DOMElement $el): bool
{
    for ($n = $el; $n instanceof DOMElement; $n = $n->parentNode instanceof DOMElement ? $n->parentNode : null) {
        if (strtolower($n->tagName) !== 'section') continue;
        $html = $n->ownerDocument ? $n->ownerDocument->saveHTML($n) : '';
        return str_contains($html, 'param-matrix') || str_contains($html, 'model-strip');
    }
    return false;
}

function st_builder_set_hero_kicker(string $html, string $tag): string
{
    if (!preg_match('/<section class="hero\b.*?<\/section>/s', $html, $m, PREG_OFFSET_CAPTURE)) return $html;
    $hero = $m[0][0];
    if ($tag !== '') {
        $safe = htmlspecialchars($tag, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if (preg_match('/<p class="eyebrow">/', $hero)) {
            $hero = preg_replace('/(<p class="eyebrow">).*?(<\/p>)/s', '$1' . $safe . '$2', $hero, 1) ?? $hero;
        }
    } else {
        $hero = preg_replace('/\s*<p class="eyebrow">.*?<\/p>/s', '', $hero, 1) ?? $hero;
    }
    return substr($html, 0, (int) $m[0][1]) . $hero . substr($html, (int) $m[0][1] + strlen($m[0][0]));
}

function st_builder_swap_hero_image(string $html, string $image): string
{
    if ($image === '' || !preg_match('/<section class="hero\b.*?<\/section>/s', $html, $m, PREG_OFFSET_CAPTURE)) return $html;
    $safe = htmlspecialchars($image, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $hero = preg_replace('/\s(src|srcset)="[^"]*"/', ' $1="' . $safe . '"', $m[0][0]) ?? $m[0][0];
    return substr($html, 0, (int) $m[0][1]) . $hero . substr($html, (int) $m[0][1] + strlen($m[0][0]));
}

function st_builder_type_children(string $parentUrl): array
{
    $out = [];
    foreach (st_cms_pages() as $p) {
        if ((string) ($p['parentUrl'] ?? '') === $parentUrl && (string) ($p['url'] ?? '') !== $parentUrl) $out[] = $p;
    }
    return $out;
}

function st_builder_nest_new(string $parentUrl, array $children, array $tiles): bool
{
    $base = st_builder_norm_url($parentUrl);
    $under = 0;
    $other = 0;
    $seen = [];
    foreach ($tiles as $tile) $seen[] = st_builder_norm_url((string) ($tile['href'] ?? ''));
    if ($seen === [] || $seen === ['']) {
        foreach ($children as $ch) $seen[] = st_builder_norm_url((string) ($ch['url'] ?? ''));
    }
    foreach ($seen as $h) {
        if ($h === '' || $h === $base) continue;
        if (str_starts_with($h, $base)) $under++;
        else $other++;
    }
    if ($under + $other === 0) return true;
    return $under >= $other;
}

function st_builder_type_template(array $children): ?string
{
    $strip = [];
    $matrix = [];
    $any = [];
    foreach ($children as $ch) {
        $path = ST_PAGES . '/' . $ch['id'] . '.html';
        if (!is_file($path)) continue;
        $raw = (string) file_get_contents($path);
        $any[] = $path;
        if (str_contains($raw, 'model-strip')) $strip[] = $path;
        elseif (str_contains($raw, 'param-matrix')) $matrix[] = $path;
    }
    if ($strip !== []) return $strip[array_key_last($strip)];
    if ($matrix !== []) return $matrix[array_key_last($matrix)];
    if ($any !== []) return $any[array_key_last($any)];
    return null;
}

function st_builder_add_machine(array $data): array
{
    $parentId = trim((string) ($data['parent'] ?? ''));
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $parentId)) throw new RuntimeException('Open a category page first.');
    $parentPath = ST_PAGES . '/' . $parentId . '.html';
    if (!is_file($parentPath)) throw new RuntimeException('That category was not found.');
    $parent = null;
    foreach (st_cms_pages() as $p) {
        if (($p['id'] ?? '') === $parentId) { $parent = $p; break; }
    }
    if ($parent === null) throw new RuntimeException('That category was not found.');
    $bare = !empty($data['bare']);
    [$pmeta, $pbody] = st_cms_parse((string) file_get_contents($parentPath));
    $tiles = st_cms_tiles($pbody);
    if ($tiles === [] && !$bare) throw new RuntimeException('This page has no machine-type cards. Open a category such as Stationary spot welders or Stud welding.');
    [$titleUk, $titleEn] = st_builder_uk_title((string) ($data['title'] ?? ''));
    if (mb_strlen($titleUk) < 2) throw new RuntimeException('Enter the machine type name.');
    $givenEn = trim((string) ($data['titleEn'] ?? ''));
    if ($givenEn !== '') $titleEn = $givenEn;
    $titleRu = trim((string) ($data['titleRu'] ?? ''));
    if (mb_strlen($titleRu) > 140) $titleRu = mb_substr($titleRu, 0, 140);
    $tagRaw = trim((string) ($data['tag'] ?? ''));
    $textRaw = trim((string) ($data['text'] ?? ''));
    $subUk = trim((string) ($data['subtitle'] ?? ''));
    $subEn = trim((string) ($data['subtitleEn'] ?? ''));
    $textEn = trim((string) ($data['textEn'] ?? ''));
    if (mb_strlen($titleEn) > 140) $titleEn = mb_substr($titleEn, 0, 140);
    if (mb_strlen($tagRaw) > 60) $tagRaw = mb_substr($tagRaw, 0, 60);
    if (mb_strlen($textRaw) > 400) $textRaw = mb_substr($textRaw, 0, 400);
    if (mb_strlen($textEn) > 400) $textEn = mb_substr($textEn, 0, 400);
    if (mb_strlen($subUk) > 80) $subUk = mb_substr($subUk, 0, 80);
    if (mb_strlen($subEn) > 80) $subEn = mb_substr($subEn, 0, 80);
    $image = trim((string) ($data['image'] ?? ''));
    if ($image === '') $image = '/assets/img/slot.svg';
    if (!preg_match('#^/assets/img/[A-Za-z0-9_./-]+$#', $image) || str_contains($image, '..') || !is_file(ST_ROOT . $image)) {
        throw new RuntimeException('Choose an image that was uploaded to the site.');
    }
    $parentUrl = (string) ($parent['url'] ?? ($pmeta['url'] ?? ''));
    $children = st_builder_type_children($parentUrl);
    if (st_builder_title_taken($titleUk, $tiles, $children) || ($titleEn !== '' && st_builder_title_taken($titleEn, $tiles, $children))) {
        throw new RuntimeException('A machine type with this name is already in the category. Choose a different name.');
    }
    $srcPath = st_builder_type_template($children);
    if ($srcPath === null) throw new RuntimeException('This category has no machine page to copy. Add the first subpage from Add page, then new types can copy it.');
    $slug = st_builder_slug((string) ($data['slug'] ?? ''), $titleEn !== '' ? $titleEn : $titleUk);
    $pages = st_cms_pages();
    $usedId = [];
    $usedUrl = [];
    foreach ($pages as $p) {
        $usedId[(string) $p['id']] = true;
        $usedUrl[st_builder_norm_url((string) ($p['url'] ?? ''))] = true;
    }
    $nest = st_builder_nest_new($parentUrl, $children, $tiles);
    $basePath = $nest ? rtrim($parentUrl, '/') . '/' . $slug . '/' : '/' . $slug . '/';
    $basePath = preg_replace('#/+#', '/', $basePath) ?? $basePath;
    if (!str_starts_with($basePath, '/')) $basePath = '/' . $basePath;
    $url = $basePath;
    $n = 2;
    while (isset($usedUrl[st_builder_norm_url($url)]) || is_file(ST_ROOT . '/' . trim($url, '/') . '/index.html')) {
        $url = rtrim($basePath, '/') . '-' . $n . '/';
        $n++;
        if ($n > 40) throw new RuntimeException('Could not find a free address for that name.');
    }
    $nums = [];
    foreach ($pages as $p) {
        if (preg_match('/^(\d+)/', (string) $p['id'], $nm)) $nums[] = (int) $nm[1];
    }
    $nxt = $nums !== [] ? max($nums) + 1 : 80;
    $idSlug = $slug;
    $extra = 0;
    do {
        $newId = $nxt . '-' . $idSlug;
        if (!isset($usedId[$newId]) && !is_file(ST_PAGES . '/' . $newId . '.html')) break;
        $extra++;
        $idSlug = $slug . '-' . ($extra + 1);
        if ($extra > 30) throw new RuntimeException('Could not find a free page id.');
    } while (true);
    [$tm, $tbody] = st_cms_parse((string) file_get_contents($srcPath));
    $tagUk = $tagRaw;
    $textUk = $textRaw;
    $linkUk = st_builder_clip('Дивитись ' . $titleUk, 48);
    if ($image === '') {
        $image = (string) ($tiles[array_key_last($tiles)]['image'] ?? '');
        if ($image === '') $image = (string) (st_cms_hero($tbody)['image'] ?? '/assets/img/company-hall-1.jpg');
    }
    $bodyHtml = st_builder_retarget_links(st_builder_set_h1($tbody, $titleUk), (string) ($tm['url'] ?? ''), $url);
    $bodyHtml = st_builder_neutral_body($bodyHtml, $titleUk, $textUk);
    $bodyHtml = st_builder_set_hero_kicker($bodyHtml, $tagUk);
    $bodyHtml = st_builder_swap_hero_image($bodyHtml, $image);
    $bodyHtml = st_builder_one_variant($bodyHtml, $titleUk, $image);
    [$bodyHtml, $slotPairs] = st_builder_personal_slots($bodyHtml);
    $parentCrumb = trim((string) ($pmeta['crumbs'] ?? ''));
    if (str_contains($parentCrumb, '|')) $parentCrumb = trim((string) preg_replace('/^.*\|\s*/u', '', $parentCrumb));
    if (str_contains($parentCrumb, '>>')) $parentCrumb = trim(explode('>>', $parentCrumb, 2)[0]);
    if ($parentCrumb === '') $parentCrumb = (string) ($parent['name'] ?? $titleUk);
    $meta = [
        'out' => trim($url, '/') . '/index.html',
        'url' => $url,
        'nav' => (string) ($parent['nav'] ?? ($pmeta['nav'] ?? '')),
        'title' => $titleUk . ' | SMOLTECH',
        'desc' => $textUk !== '' ? $textUk : $titleUk,
        'ogtitle' => $titleUk,
        'crumbs' => $parentCrumb . '>>' . $parentUrl . ' | ' . $titleUk,
        'prio' => '0.75',
        'added' => '1',
        'label' => $titleEn !== '' ? $titleEn : $titleUk,
    ];
    if (!empty($tm['og'])) $meta['og'] = (string) $tm['og'];
    $layoutOrig = (string) file_get_contents(ST_LAYOUT);
    $parentOrig = (string) file_get_contents($parentPath);
    $newPath = ST_PAGES . '/' . $newId . '.html';
    st_cms_atomic_write($newPath, st_cms_dump($meta, $bodyHtml), false);
    $layoutChanged = false;
    try {
        if (!$bare) {
            $inserted = st_builder_insert_tile($pbody, [
                'href' => $url,
                'title' => $titleUk,
                'tag' => $tagUk,
                'text' => $textUk,
                'link' => $linkUk,
                'image' => $image,
            ], count($tiles) + 1);
            if ($inserted === $pbody) throw new RuntimeException('The card could not be added to the category grid.');
            st_cms_atomic_write($parentPath, st_cms_dump($pmeta, $inserted), true);
        }
        $layout = $layoutOrig;
        $slot = 'hidden';
        $position = 1;
        $sibUrls = [];
        foreach ($children as $ch) {
            $cu = (string) ($ch['url'] ?? '');
            $sibUrls[] = $cu;
            $place = st_builder_menu_find($layoutOrig, $cu);
            if ($place['menu'] !== 'hidden' && (int) $place['position'] >= $position) {
                $slot = (string) $place['menu'];
                $position = (int) $place['position'] + 1;
            }
        }
        if ($slot !== 'hidden') $layout = st_builder_menu_apply($layout, $url, $slot, $position, $titleUk, $subUk);
        [$footUk, $footEn, $footRu] = st_builder_footer_labels($bare ? '' : $tagUk, $titleUk, $titleEn, $titleRu);
        $layout = st_builder_footer_insert($layout, $url, $footUk, $sibUrls);
        $layoutChanged = $layout !== $layoutOrig;
        if ($layoutChanged) st_builder_write_layout($layout);
        $pairs = [];
        if ($titleEn !== '' && $titleEn !== $titleUk) {
            $titlePair = ['uk' => $titleUk, 'en' => $titleEn];
            if ($titleRu !== '' && $titleRu !== $titleUk) $titlePair['ru'] = $titleRu;
            $pairs[] = $titlePair;
        } elseif ($titleRu !== '' && $titleRu !== $titleUk) {
            $pairs[] = ['uk' => $titleUk, 'ru' => $titleRu];
        }
        if ($textUk !== '' && $textEn !== '' && $textEn !== $textUk) $pairs[] = ['uk' => $textUk, 'en' => $textEn];
        if ($subUk !== '' && $subEn !== '' && $subEn !== $subUk) $pairs[] = ['uk' => $subUk, 'en' => $subEn];
        if ($titleEn !== '') $pairs[] = ['uk' => $linkUk, 'en' => st_builder_clip('See ' . $titleEn, 48)];
        if ($footEn !== '' || $footRu !== '') {
            $footPair = ['uk' => $footUk];
            if ($footEn !== '') $footPair['en'] = $footEn;
            if ($footRu !== '') $footPair['ru'] = $footRu;
            $pairs[] = $footPair;
        }
        $tabUk = $titleUk . ' | SMOLTECH';
        $tabPair = ['uk' => $tabUk];
        if ($titleEn !== '' && $titleEn !== $titleUk) $tabPair['en'] = $titleEn . ' | SMOLTECH';
        if ($titleRu !== '' && $titleRu !== $titleUk) $tabPair['ru'] = $titleRu . ' | SMOLTECH';
        if (isset($tabPair['en']) || isset($tabPair['ru'])) $pairs[] = $tabPair;
        foreach ($slotPairs as $row) $pairs[] = $row;
        if ($pairs !== []) {
            require_once __DIR__ . '/tlumacz.php';
            st_i18n_author_pairs($pairs);
        }
    } catch (Throwable $e) {
        if (is_file($newPath)) @unlink($newPath);
        if (is_file($parentPath) && (string) file_get_contents($parentPath) !== $parentOrig) {
            st_cms_atomic_write($parentPath, $parentOrig, false);
        }
        if ((string) file_get_contents(ST_LAYOUT) !== $layoutOrig) st_cms_atomic_write(ST_LAYOUT, $layoutOrig, false);
        throw $e;
    }
    $live = st_cms_publish_page($newId, !$bare || $layoutChanged);
    $where = $bare
        ? 'Created the page “' . $titleUk . '” at ' . $url . '. Save this page to publish the card that opens it.'
        : 'Added “' . $titleUk . '” as a new card. Its page is at ' . $url . '.';
    if ($slot !== 'hidden') $where .= ' It was added to the ' . st_builder_menu_label($slot) . '.';
    elseif ($layoutChanged) $where .= ' It was added to the footer.';
    else $where .= ' Sibling pages are not in the menu, so this one is in the sitemap only.';
    $where .= ' The new page has the same sections as the others in this category, with empty text and photo slots.';
    return $live + [
        'ok' => true,
        'id' => $newId,
        'url' => $url,
        'parent' => $parentId,
        'name' => $titleEn !== '' ? $titleEn : $titleUk,
        'nameUk' => $titleUk,
        'titleUk' => $titleUk,
        'nameEn' => $titleEn,
        'titleEn' => $titleEn,
        'nameRu' => $titleRu,
        'titleRu' => $titleRu,
        'where' => $where,
        'created' => true,
    ];
}

function st_builder_delete_page(string $id): array
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    $page = null;
    foreach (st_cms_pages() as $p) {
        if (($p['id'] ?? '') === $id) { $page = $p; break; }
    }
    if ($page === null) throw new RuntimeException('Nie znaleziono strony.');
    if (empty($page['canDelete'])) throw new RuntimeException('Tej strony nie można usunąć.');
    [$meta] = st_cms_parse((string) file_get_contents($path));
    $url = (string) ($meta['url'] ?? '');
    st_cms_backup_file($path);
    st_cms_backup_file(ST_LAYOUT);
    $out = trim((string) ($meta['out'] ?? ''));
    if ($out !== '') st_cms_backup_file(ST_ROOT . '/' . $out);
    if ($url !== '') {
        $layout = (string) file_get_contents(ST_LAYOUT);
        $label = trim(strip_tags((string) ($meta['title'] ?? 'Сторінка')));
        $next = st_builder_footer_remove($layout, $url);
        $next = st_builder_menu_apply($next, $url, 'hidden', 1, $label);
        if ($next !== $layout) st_builder_write_layout($next);
    }
    return st_cms_delete_page($id);
}
