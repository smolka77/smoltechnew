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

function st_builder_menu_li(string $kind, string $url, string $label): string
{
    $u = htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = htmlspecialchars($label, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $ico = '<span class="mega__ico mega__ico--mark"><img src="/assets/img/mark-nav.png?v=20260914c" alt="" width="34" height="34" decoding="async"></span>';
    return match ($kind) {
        'top' => '<li class="nav__item"><a class="nav__link" href="' . $u . '">' . $t . '</a></li>',
        'mega' => '<li><a href="' . $u . '">' . $ico . '<span><span class="mega__tt">' . $t . '</span><span class="mega__ds">Сторінка SMOLTECH</span></span></a></li>',
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

function st_builder_menu_apply(string $html, string $url, string $slot, int $position, string $label): string
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
            st_builder_menu_li((string) $def['kind'], $url, $label)
        );
        if ($desired === $children) continue;
        $inner = "\n        " . implode("\n        ", $desired) . "\n      ";
        $html = substr($html, 0, $region['innerStart']) . $inner . substr($html, $region['innerEnd']);
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
            'parentName' => (string) ($p['parentName'] ?? ''),
            'parentUrl' => (string) ($p['parentUrl'] ?? ''),
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
    file_put_contents(ST_LAYOUT, $html);
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
                    file_put_contents($pp, st_cms_dump($pm, $moved));
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
    $meta = [
        'out' => $out,
        'url' => $url,
        'nav' => $nav,
        'title' => $titleUk . ' | SMOLTECH',
        'desc' => 'Короткий опис сторінки. Його можна змінити.',
        'ogtitle' => $titleUk,
        'crumbs' => $crumbs,
        'prio' => '0.6',
        'added' => '1',
        'label' => $adminName,
    ];
    file_put_contents(ST_PAGES . '/' . $newId . '.html', st_cms_dump($meta, st_builder_page_html($titleUk)));
    if ($parent) {
        $pp = ST_PAGES . '/' . $parent['id'] . '.html';
        [$pm, $pb] = st_cms_parse((string) file_get_contents($pp));
        $inserted = st_builder_insert_tile($pb, [
            'href' => $url,
            'title' => $titleUk,
            'tag' => 'SMOLTECH',
            'text' => 'Короткий опис сторінки. Його можна змінити.',
            'link' => $titleUk,
            'image' => '/assets/img/company-hall-1.jpg',
        ], $position);
        if ($inserted !== $pb) {
            file_put_contents($pp, st_cms_dump($pm, $inserted));
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
    $where = 'Created. It is in the ' . st_builder_menu_label((string) $place['menu'])
        . ' at position ' . (int) $place['position'] . '. Address: ' . $url . '.' . $cardNote . ' It is open for editing.';
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
    if ($url !== '') {
        $layout = (string) file_get_contents(ST_LAYOUT);
        $label = trim(strip_tags((string) ($meta['title'] ?? 'Сторінка')));
        $next = st_builder_menu_apply($layout, $url, 'hidden', 1, $label);
        if ($next !== $layout) st_builder_write_layout($next);
    }
    return st_cms_delete_page($id);
}
