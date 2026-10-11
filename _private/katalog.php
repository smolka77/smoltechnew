<?php
declare(strict_types=1);

function st_cms_yt_id(string $value): string
{
    $s = trim($value);
    if (preg_match('/^[\w-]{11}$/', $s)) return $s;
    if (preg_match('#(?:v=|/embed/|/shorts/|youtu\.be/)([\w-]{11})#', $s, $m)) return $m[1];
    return '';
}

function st_cms_with_count(string $cls, string $prefix, int $n, int $default = 3): string
{
    $cls = trim((string) preg_replace('/\b' . preg_quote($prefix, '/') . '--\d+\b/', '', $cls));
    $cls = trim((string) preg_replace('/\s+/', ' ', $cls));
    if ($n !== $default) $cls .= " {$prefix}--{$n}";
    return $cls;
}

function st_cms_lat(string $s): string
{
    $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'h', 'ґ' => 'g', 'д' => 'd', 'е' => 'e', 'є' => 'ie',
        'ж' => 'zh', 'з' => 'z', 'и' => 'y', 'і' => 'i', 'ї' => 'i', 'й' => 'i', 'к' => 'k', 'л' => 'l',
        'м' => 'm', 'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'kh', 'ц' => 'ts', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'shch', 'ь' => '', 'ю' => 'iu',
        'я' => 'ia', 'ы' => 'y', 'э' => 'e', 'ё' => 'e', 'ъ' => '',
        'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ź' => 'z', 'ż' => 'z',
    ];
    return strtr(mb_strtolower($s), $map);
}

function st_cms_slugify(string $s): string
{
    $s = mb_strtolower(html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    $s = str_replace(['–', '—', 'ø', '×'], ['-', '-', 'o', 'x'], $s);
    $s = (string) preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim($s, '-');
    if ($s === '') $s = 'nowa-grupa';
    return substr($s, 0, 70);
}

function st_cms_tiles(string $body): array
{
    $items = [];
    if (!preg_match_all('/<a class="tile\b[^"]*"([^>]*)>(.*?)<\/a>/s', $body, $mm, PREG_SET_ORDER)) return $items;
    foreach ($mm as $m) {
        $inner = $m[2];
        preg_match('/href="([^"]+)"/', $m[0], $href);
        preg_match('/<h3>(.*?)<\/h3>/s', $inner, $h3);
        preg_match('/<span class="tag">(.*?)<\/span>/s', $inner, $tag);
        preg_match('/<p>(.*?)<\/p>/s', $inner, $p);
        preg_match('/<img src="([^"]+)"/', $inner, $img);
        preg_match('/<(?:span|a) class="arrow-link"[^>]*>([^<]+)/s', $inner, $link);
        $src = $img[1] ?? '';
        $items[] = [
            'href' => $href[1] ?? '',
            'tag' => st_cms_strip($tag[1] ?? ''),
            'title' => st_cms_strip($h3[1] ?? ''),
            'text' => st_cms_strip($p[1] ?? ''),
            'link' => st_cms_strip($link[1] ?? ''),
            'image' => explode('?', $src)[0],
        ];
    }
    return $items;
}

function st_cms_extract_models(string $body): ?array
{
    if (!str_contains($body, 'param-matrix')) return null;
    if (!preg_match('/<div class="param-matrix__table"[^>]*>/', $body, $tm, PREG_OFFSET_CAPTURE)) return null;
    $tend = st_cms_div_end($body, (int) $tm[0][1] + strlen($tm[0][0]));
    if ($tend === null) return null;
    $tableInner = substr($body, (int) $tm[0][1] + strlen($tm[0][0]), $tend - strlen('</div>') - ((int) $tm[0][1] + strlen($tm[0][0])));
    $columns = [];
    $stripOpen = '';
    $stripInner = '';
    if (preg_match('/(<ul class="model-strip\b[^"]*"[^>]*>)(.*?)(<\/ul>)/s', $body, $sm)) {
        $stripOpen = $sm[1];
        $stripInner = $sm[2];
        if (preg_match_all('/<button class="model-strip__btn\b[^>]*>(.*?)<\/button>/s', $stripInner, $btns)) {
            foreach ($btns[1] as $inner) {
                preg_match('/<span class="model-strip__name"[^>]*>(.*?)<\/span>/s', $inner, $nm);
                preg_match('/<img src="([^"]+)"/', $inner, $img);
                preg_match('/<img [^>]*alt="([^"]*)"/', $inner, $alt);
                $src = $img[1] ?? '';
                $columns[] = [
                    'name' => st_cms_strip($nm[1] ?? ''),
                    'image' => explode('?', $src)[0],
                    'alt' => st_cms_strip($alt[1] ?? ''),
                ];
            }
        }
    }
    $heads = [];
    $rows = [];
    if (preg_match_all('/<div class="(param-matrix__cell[^"]*)"([^>]*)>(.*?)<\/div>/s', $tableInner, $cells, PREG_SET_ORDER)) {
        foreach ($cells as $cell) {
            $cls = $cell[1];
            $htmlIn = trim($cell[3]);
            $isHead = str_contains($cls, 'param-matrix__head');
            $isLabel = str_contains($cls, 'param-matrix__label');
            $isVal = str_contains($cls, 'param-matrix__val');
            if ($isHead && $isLabel) continue;
            if ($isHead) { $heads[] = st_cms_strip($htmlIn); continue; }
            if ($isLabel) { $rows[] = ['label' => st_cms_strip($htmlIn), 'values' => []]; continue; }
            if ($isVal && $rows !== []) $rows[array_key_last($rows)]['values'][] = $htmlIn;
        }
    }
    if ($heads !== [] && $columns === []) {
        foreach ($heads as $h) $columns[] = ['name' => $h, 'image' => '', 'alt' => ''];
    } else {
        foreach ($heads as $i => $h) {
            if (isset($columns[$i]) && $h !== '') $columns[$i]['name'] = $columns[$i]['name'] !== '' ? $columns[$i]['name'] : $h;
        }
    }
    foreach ($columns as $i => &$col) {
        $col['values'] = [];
        foreach ($rows as $row) {
            $col['values'][] = $row['values'][$i] ?? '—';
        }
    }
    unset($col);
    $wrapCls = 'param-matrix';
    if (preg_match('/<div class="(param-matrix\b[^"]*)"/', $body, $wm)) $wrapCls = $wm[1];
    $aria = '';
    if ($stripOpen !== '' && preg_match('/aria-label="([^"]*)"/', $stripOpen, $am)) $aria = $am[1];
    $rowOut = [];
    foreach ($rows as $r) $rowOut[] = ['label' => $r['label']];
    return [
        'hasShots' => str_contains($stripOpen, 'model-strip--shots'),
        'wide' => str_contains($wrapCls, 'param-matrix--wide'),
        'aria' => $aria,
        'rows' => $rowOut,
        'columns' => $columns,
    ];
}

function st_cms_render_strip_item(array $col, int $idx, bool $hasShots): string
{
    $n = $idx + 1;
    $name = st_cms_esc((string) ($col['name'] ?? '') !== '' ? $col['name'] : ('Model ' . $n));
    $active = $idx === 0 ? ' is-active' : '';
    $pressed = $idx === 0 ? 'true' : 'false';
    if (!$hasShots) {
        return '<li><button class="model-strip__btn' . $active . '" type="button" data-model="' . $n . '" aria-pressed="' . $pressed . '"><span class="model-strip__name">' . $name . '</span></button></li>';
    }
    $img = trim((string) ($col['image'] ?? ''));
    $alt = st_cms_esc((string) ($col['alt'] ?? $col['name'] ?? ''));
    if ($img !== '') {
        $webp = (string) preg_replace('/\.[^.]+$/', '.webp', $img);
        $webpFs = ST_ROOT . '/' . ltrim($webp, '/');
        $source = ($webp !== '' && is_file($webpFs)) ? '<source srcset="' . st_cms_esc($webp) . '" type="image/webp">' : '';
        $shot = '<span class="model-strip__shot"><picture>' . $source . '<img src="' . st_cms_esc($img) . '" alt="' . $alt . '" width="311" height="262" loading="lazy" decoding="async"></picture></span>';
    } else {
        $shot = '<span class="model-strip__shot model-strip__shot--empty" data-cms-model-media="1"></span>';
    }
    return '<li><button class="model-strip__btn' . $active . '" type="button" data-model="' . $n . '" aria-pressed="' . $pressed . '">' . $shot . '<span class="model-strip__name">' . $name . '</span></button></li>';
}

function st_cms_render_matrix_table(array $data): string
{
    $cols = $data['columns'] ?? [];
    $rows = $data['rows'] ?? [];
    $bits = ['<div class="param-matrix__cell param-matrix__head param-matrix__label" role="columnheader">Параметр</div>'];
    foreach ($cols as $i => $col) {
        $bits[] = '<div class="param-matrix__cell param-matrix__head" role="columnheader" data-col="' . ($i + 1) . '">' . st_cms_esc((string) ($col['name'] ?? '')) . '</div>';
    }
    foreach ($rows as $r => $row) {
        $bits[] = '<div class="param-matrix__cell param-matrix__label" role="rowheader">' . st_cms_esc((string) ($row['label'] ?? '')) . '</div>';
        foreach ($cols as $i => $col) {
            $vals = $col['values'] ?? [];
            $raw = $vals[$r] ?? '—';
            $inner = st_cms_clean_inline((string) $raw);
            if ($inner === '') $inner = '—';
            $bits[] = '<div class="param-matrix__cell param-matrix__val" data-col="' . ($i + 1) . '">' . $inner . '</div>';
        }
    }
    return implode("\n", $bits);
}

function st_cms_patch_models(string $body, ?array $data): string
{
    if (!is_array($data) || empty($data['columns']) || !is_array($data['columns'])) return $body;
    $current = st_cms_extract_models($body) ?? [];
    $cols = $data['columns'];
    $n = count($cols);
    $hasShots = array_key_exists('hasShots', $data) ? (bool) $data['hasShots'] : (bool) ($current['hasShots'] ?? false);
    $wide = array_key_exists('wide', $data) ? (bool) $data['wide'] : (bool) ($current['wide'] ?? false);
    if (preg_match('/(<ul class="model-strip\b[^"]*"[^>]*>)(.*?)(<\/ul>)/s', $body, $sm, PREG_OFFSET_CAPTURE)) {
        $openFull = $sm[1][0];
        $cls = 'model-strip';
        if (preg_match('/class="([^"]*)"/', $openFull, $cm)) $cls = $cm[1];
        $cls = st_cms_with_count($cls, 'model-strip', $n, 3);
        $items = '';
        foreach ($cols as $i => $col) $items .= st_cms_render_strip_item($col, $i, $hasShots);
        $newOpen = preg_replace('/class="[^"]*"/', 'class="' . $cls . '"', $openFull, 1) ?? $openFull;
        if ($hasShots && !str_contains($newOpen, 'style=')) $newOpen = substr($newOpen, 0, -1) . ' style="--ms-cols:' . $n . '">';
        elseif ($hasShots) $newOpen = preg_replace('/style="[^"]*"/', 'style="--ms-cols:' . $n . '"', $newOpen) ?? $newOpen;
        $newUl = $newOpen . $items . '</ul>';
        $body = substr($body, 0, (int) $sm[0][1]) . $newUl . substr($body, (int) $sm[0][1] + strlen($sm[0][0]));
    }
    $tableHtml = st_cms_render_matrix_table(['rows' => $data['rows'] ?? ($current['rows'] ?? []), 'columns' => $cols]);
    if (preg_match('/<div class="param-matrix__table"[^>]*>/', $body, $tm, PREG_OFFSET_CAPTURE)) {
        $startInner = (int) $tm[0][1] + strlen($tm[0][0]);
        $tend = st_cms_div_end($body, $startInner);
        if ($tend !== null) {
            $body = substr($body, 0, $startInner) . $tableHtml . substr($body, $tend - strlen('</div>'));
        }
    }
    if (preg_match('/<div class="(param-matrix\b[^"]*)"([^>]*)>/', $body, $wm, PREG_OFFSET_CAPTURE)) {
        $cls = st_cms_with_count($wm[1][0], 'param-matrix', $n, 3);
        if ($wide && !str_contains($cls, 'param-matrix--wide')) $cls .= ' param-matrix--wide';
        $attrs = $wm[2][0];
        $attrs = preg_replace('/\sstyle="[^"]*"/', '', $attrs) ?? $attrs;
        $new = '<div class="' . $cls . '"' . $attrs . ' style="--pm-cols:' . $n . '">';
        $body = substr($body, 0, (int) $wm[0][1]) . $new . substr($body, (int) $wm[0][1] + strlen($wm[0][0]));
    }
    return $body;
}

function st_cms_extract_films(string $body): array
{
    $items = [];
    if (!preg_match_all('/<article class="film-rail__i\b[^"]*">(.*?)<\/article>/s', $body, $mm)) return $items;
    foreach ($mm[1] as $inner) {
        preg_match('/data-vid="([^"]*)"/', $inner, $vid);
        preg_match('/<h3\b[^>]*>(.*?)<\/h3>/s', $inner, $h3);
        $items[] = ['video' => trim($vid[1] ?? ''), 'title' => st_cms_strip($h3[1] ?? '')];
    }
    return $items;
}

function st_cms_render_film(array $it): string
{
    $vid = st_cms_yt_id((string) ($it['video'] ?? ''));
    $title = trim((string) ($it['title'] ?? '')) ?: 'Нове інструктажне відео';
    if ($vid !== '') {
        $media = '<button class="yt" type="button" data-vid="' . st_cms_esc($vid) . '" data-title="' . st_cms_esc($title) . '" aria-label="Дивитись відео: ' . st_cms_esc($title) . '"><img src="/assets/img/yt/' . st_cms_esc($vid) . '.jpg" alt="" width="480" height="360" loading="lazy" decoding="async">{{YT_PLAY}}</button>';
    } else {
        $media = '<div class="film-rail__empty" data-cms-film-media="1"></div>';
    }
    return '<article class="film-rail__i">' . "\n        " . $media . "\n        <h3>" . st_cms_esc($title) . "</h3>\n      </article>";
}

function st_cms_patch_films(string $body, ?array $items): string
{
    if ($items === null) return $body;
    if (!preg_match('/<div class="film-rail\b[^"]*"[^>]*>/', $body, $m, PREG_OFFSET_CAPTURE)) return $body;
    $end = st_cms_div_end($body, (int) $m[0][1] + strlen($m[0][0]));
    if ($end === null) return $body;
    $n = count($items);
    $cls = 'film-rail';
    if (preg_match('/class="([^"]*)"/', $m[0][0], $cm)) $cls = $cm[1];
    $cls = st_cms_with_count($cls, 'film-rail', $n, 3);
    $inner = [];
    foreach ($items as $it) $inner[] = st_cms_render_film($it);
    $new = '<div class="' . $cls . '" style="--film-cols:' . $n . '">' . "\n      " . implode("\n      ", $inner) . "\n    </div>";
    return substr($body, 0, (int) $m[0][1]) . $new . substr($body, $end);
}

function st_cms_catalog(string $body): array
{
    $tiles = st_cms_tiles($body);
    $models = st_cms_extract_models($body);
    $films = st_cms_extract_films($body);
    return [
        'canAddMach' => (bool) preg_match('/class="mach-list"/', $body),
        'canAddModel' => is_array($models)
            && (($models['columns'] ?? []) !== [] || ($models['rows'] ?? []) !== [])
            && (bool) preg_match('/class="model-strip\b/', $body),
        'canAddFilm' => (bool) preg_match('/class="film-rail\b/', $body),
        'canAddTile' => $tiles !== [],
        'tileCount' => count($tiles),
        'modelCount' => count($models['columns'] ?? []),
        'filmCount' => count($films),
    ];
}

function st_cms_renumber_tiles(string $body): string
{
    $n = 0;
    return preg_replace_callback('/<span class="tile__no">[^<]*<\/span>/', static function () use (&$n) {
        $n++;
        return '<span class="tile__no">' . str_pad((string) $n, 2, '0', STR_PAD_LEFT) . '</span>';
    }, $body) ?? $body;
}

function st_cms_set_tile_grid(string $body, int $n): string
{
    $g = $n <= 1 ? 'g-1' : ($n === 2 ? 'g-2' : ($n === 4 ? 'g-4' : 'g-3'));
    $tile = strpos($body, '<a class="tile');
    if ($tile === false) return $body;
    $grid = strrpos(substr($body, 0, $tile), '<div class="grid ');
    if ($grid === false) return $body;
    $gt = strpos($body, '>', $grid);
    if ($gt === false || $gt > $tile) return $body;
    $open = substr($body, $grid, $gt - $grid + 1);
    if (preg_match('/\bg-\d+\b/', $open)) {
        $new = preg_replace('/\bg-\d+\b/', $g, $open, 1) ?? $open;
    } else {
        $new = preg_replace('/class="grid\b/', 'class="grid ' . $g, $open, 1) ?? $open;
    }
    return substr($body, 0, $grid) . $new . substr($body, $gt + 1);
}

function st_cms_fill_tile(string $tpl, array $it, int $idx): string
{
    $inner = $tpl;
    $inner = preg_replace('/(href=")[^"]*/', '$1' . ($it['href'] ?? '#'), $inner, 1) ?? $inner;
    if (array_key_exists('title', $it)) {
        $inner = preg_replace('/(<h3>)(.*?)(<\/h3>)/s', '$1' . st_cms_esc((string) $it['title']) . '$3', $inner, 1) ?? $inner;
        $inner = preg_replace('/(<img\b[^>]*\salt=")[^"]*(")/i', '$1' . st_cms_esc((string) $it['title']) . '$2', $inner, 1) ?? $inner;
    }
    if (array_key_exists('tag', $it)) {
        if (trim((string) $it['tag']) === '') $inner = preg_replace('/\s*<span class="tag">.*?<\/span>/s', '', $inner, 1) ?? $inner;
        else $inner = preg_replace('/(<span class="tag">)(.*?)(<\/span>)/s', '$1' . st_cms_esc((string) $it['tag']) . '$3', $inner, 1) ?? $inner;
    }
    if (array_key_exists('text', $it)) {
        if (trim((string) $it['text']) === '') $inner = preg_replace('/\s*<p>.*?<\/p>/s', '', $inner, 1) ?? $inner;
        else $inner = preg_replace('/(<p>)(.*?)(<\/p>)/s', '$1' . st_cms_esc((string) $it['text']) . '$3', $inner, 1) ?? $inner;
    }
    if (array_key_exists('link', $it)) $inner = preg_replace('/(<(?:span|a) class="arrow-link"[^>]*>)([^<]+)/', '$1' . st_cms_esc((string) $it['link']), $inner, 1) ?? $inner;
    if (!empty($it['image'])) {
        if (preg_match('/<img src="([^"]+)"/', $inner, $img)) $inner = st_cms_replace_src($inner, $img[1], (string) $it['image']);
        if (preg_match('/<source[^>]*srcset="([^"]+)"/', $inner, $src)) $inner = st_cms_replace_src($inner, $src[1], (string) $it['image']);
    }
    $inner = preg_replace('/<span class="tile__no">[^<]*<\/span>/', '<span class="tile__no">' . str_pad((string) ($idx + 1), 2, '0', STR_PAD_LEFT) . '</span>', $inner, 1) ?? $inner;
    return $inner;
}

function st_cms_append_tile(string $body, array $item): string
{
    if (!preg_match_all('/<a class="tile\b[^"]*"[^>]*>.*?<\/a>/s', $body, $mm, PREG_OFFSET_CAPTURE)) return $body;
    $last = $mm[0][count($mm[0]) - 1];
    $html = st_cms_fill_tile($last[0], $item, count($mm[0]));
    $body = substr($body, 0, (int) $last[1] + strlen($last[0])) . "\n      " . $html . substr($body, (int) $last[1] + strlen($last[0]));
    $body = st_cms_renumber_tiles($body);
    return st_cms_set_tile_grid($body, count($mm[0]) + 1);
}

function st_cms_add_child_page(array $data): array
{
    $parentId = (string) ($data['parent'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $parentId)) throw new RuntimeException('Nieprawidłowa strona nadrzędna.');
    $parentPath = ST_PAGES . '/' . $parentId . '.html';
    if (!is_file($parentPath)) throw new RuntimeException('Nie znaleziono strony nadrzędnej.');
    $pages = st_cms_pages();
    $parent = null;
    foreach ($pages as $p) if (($p['id'] ?? '') === $parentId) { $parent = $p; break; }
    if ($parent === null) throw new RuntimeException('Nie znaleziono strony nadrzędnej.');
    $children = [];
    foreach ($pages as $p) {
        if (($p['parentUrl'] ?? '') === ($parent['url'] ?? '') && ($p['id'] ?? '') !== $parentId) $children[] = $p;
    }
    $srcPath = null;
    $stripKids = [];
    $matrixKids = [];
    $machKids = [];
    foreach ($children as $ch) {
        $path = ST_PAGES . '/' . $ch['id'] . '.html';
        if (!is_file($path)) continue;
        $raw = (string) file_get_contents($path);
        if (str_contains($raw, 'model-strip')) $stripKids[] = $path;
        elseif (str_contains($raw, 'param-matrix')) $matrixKids[] = $path;
        elseif (str_contains($raw, 'class="mach-list"')) $machKids[] = $path;
    }
    if ($stripKids !== []) $srcPath = $stripKids[array_key_last($stripKids)];
    elseif ($matrixKids !== []) $srcPath = $matrixKids[array_key_last($matrixKids)];
    elseif ($machKids !== []) $srcPath = $machKids[array_key_last($machKids)];
    elseif ($children !== []) $srcPath = ST_PAGES . '/' . $children[array_key_last($children)]['id'] . '.html';
    if ($srcPath === null || !is_file($srcPath)) throw new RuntimeException('Ta grupa nie ma jeszcze strony-szablonu, z której można skopiować układ.');
    $titleRaw = trim((string) ($data['title'] ?? ''));
    $tagRaw = trim((string) ($data['tag'] ?? ''));
    $textRaw = trim((string) ($data['text'] ?? ''));
    $linkRaw = trim((string) ($data['link'] ?? ''));
    $image = trim((string) ($data['image'] ?? ''));
    if (preg_match('/\p{Cyrillic}/u', $titleRaw)) {
        $titleUk = $titleRaw;
        $tagUk = $tagRaw !== '' ? $tagRaw : $titleUk;
        $textUk = $textRaw;
        $linkUk = $linkRaw !== '' ? $linkRaw : $titleUk;
        $slug = st_cms_slugify(st_cms_lat($titleUk));
    } else {
        $titleEn = $titleRaw !== '' ? $titleRaw : 'New product group';
        $tagEn = $tagRaw !== '' ? $tagRaw : $titleEn;
        $textEn = $textRaw;
        $linkEn = $linkRaw !== '' ? $linkRaw : ('See ' . $titleEn);
        $uk = [$titleEn => $titleEn, $tagEn => $tagEn, $textEn => $textEn, $linkEn => $linkEn];
        if (function_exists('st_i18n_many')) {
            require_once __DIR__ . '/tlumacz.php';
            $uk = st_i18n_many([$titleEn, $tagEn, $textEn, $linkEn], 'en', 'uk');
        }
        $titleUk = $uk[$titleEn] ?? $titleEn;
        $tagUk = $uk[$tagEn] ?? $tagEn;
        $textUk = $uk[$textEn] ?? $textEn;
        $linkUk = $uk[$linkEn] ?? $linkEn;
        $slug = st_cms_slugify($titleEn);
    }
    $used = [];
    foreach ($pages as $p) $used[$p['id']] = true;
    $nums = [];
    foreach ($children as $ch) {
        if (preg_match('/^(\d+)/', $ch['id'], $nm)) $nums[] = (int) $nm[1];
    }
    $parentN = preg_match('/^(\d+)/', $parentId, $pm) ? (int) $pm[1] : 0;
    $nxt = $nums !== [] ? max($nums) + 1 : $parentN * 10 + 1;
    $baseSlug = $slug;
    $extra = 0;
    do {
        $newId = $nxt . '-' . $slug;
        if (!isset($used[$newId])) break;
        $extra++;
        $slug = $baseSlug . '-' . ($extra + 1);
    } while (true);
    [$srcMeta, $srcBody] = st_cms_parse((string) file_get_contents($srcPath));
    $nested = false;
    $purl = (string) ($parent['url'] ?? '');
    if ($purl !== '') {
        foreach ($pages as $p) {
            if (($p['id'] ?? '') !== $parentId && str_starts_with((string) ($p['url'] ?? ''), $purl)) { $nested = true; break; }
        }
    }
    $url = $nested && $purl !== '' ? rtrim($purl, '/') . '/' . $slug . '/' : '/' . $slug . '/';
    $existing = [];
    foreach ($pages as $p) $existing[$p['url'] ?? ''] = true;
    $i = 2;
    $baseUrl = $url;
    while (isset($existing[$url])) { $url = rtrim($baseUrl, '/') . '-' . $i . '/'; $i++; }
    $out = trim($url, '/') . '/index.html';
    $crumbs = ($parent['name'] ?? $titleUk) . '>>' . ($parent['url'] ?? '/') . ' | ' . $titleUk;
    $meta = $srcMeta;
    $meta['out'] = $out;
    $meta['url'] = $url;
    $meta['nav'] = $parent['nav'] ?? ($srcMeta['nav'] ?? 'machines');
    $meta['title'] = $titleUk . ' | SMOLTECH';
    $meta['desc'] = $textUk;
    $meta['ogtitle'] = $titleUk;
    $meta['crumbs'] = $crumbs;
    if (empty($meta['prio'])) $meta['prio'] = '0.75';
    $body = preg_replace('/(<h1\b[^>]*>)(.*?)(<\/h1>)/s', '$1' . st_cms_esc($titleUk) . '$3', $srcBody, 1) ?? $srcBody;
    st_cms_atomic_write(ST_PAGES . '/' . $newId . '.html', st_cms_dump($meta, $body), true);
    [$pmeta, $pbody] = st_cms_parse((string) file_get_contents($parentPath));
    if ($image === '') {
        $tiles = st_cms_tiles($pbody);
        $image = $tiles !== [] ? (string) ($tiles[array_key_last($tiles)]['image'] ?? '') : '';
        if ($image === '') $image = (string) (st_cms_hero($srcBody)['image'] ?? '');
    }
    $pbody = st_cms_append_tile($pbody, [
        'href' => $url, 'title' => $titleUk, 'tag' => $tagUk, 'text' => $textUk, 'link' => $linkUk, 'image' => $image,
    ]);
    st_cms_atomic_write($parentPath, st_cms_dump($pmeta, $pbody), true);
    $i18n = ['translated' => 0];
    if (function_exists('st_i18n_safe')) {
        require_once __DIR__ . '/tlumacz.php';
        $i18n = st_i18n_safe([$titleUk, $tagUk, $textUk, $linkUk, $titleEn, $tagEn, $textEn, $linkEn]);
    }
    st_cms_mark_pending('page.add-child:' . $newId);
    $live = st_cms_publish();
    return $live + [
        'ok' => true,
        'id' => $newId,
        'url' => $url,
        'parent' => $parentId,
        'i18n' => $i18n,
        'page' => st_cms_get_page($newId),
    ];
}

function st_cms_norm_href(string $href): string
{
    $h = trim($href);
    if ($h === '' || $h === '#') return $h;
    return rtrim($h, '/') . '/';
}

function st_cms_remove_tile_href(string $body, string $href): string
{
    if (!preg_match_all('/<a class="tile\b[^"]*"[^>]*>.*?<\/a>/s', $body, $mm, PREG_OFFSET_CAPTURE)) return $body;
    $want = st_cms_norm_href($href);
    for ($i = count($mm[0]) - 1; $i >= 0; $i--) {
        $html = $mm[0][$i][0];
        $start = (int) $mm[0][$i][1];
        preg_match('/href="([^"]+)"/', $html, $hm);
        if (st_cms_norm_href((string) ($hm[1] ?? '')) !== $want) continue;
        $end = $start + strlen($html);
        $last = $i === count($mm[0]) - 1 && $i > 0;
        if ($last) {
            $pre = $start;
            while ($pre > 0 && ($body[$pre - 1] === ' ' || $body[$pre - 1] === "\t")) $pre--;
            if ($pre > 0 && $body[$pre - 1] === "\n") {
                $pre--;
                if ($pre > 0 && $body[$pre - 1] === "\r") $pre--;
            }
            $body = substr($body, 0, $pre) . substr($body, $end);
        } else {
            while ($end < strlen($body) && ($body[$end] === ' ' || $body[$end] === "\t")) $end++;
            if ($end < strlen($body) && $body[$end] === "\r") $end++;
            if ($end < strlen($body) && $body[$end] === "\n") $end++;
            $body = substr($body, 0, $start) . substr($body, $end);
        }
        $left = preg_match_all('/<a class="tile\b[^"]*"[^>]*>.*?<\/a>/s', $body) ?: 0;
        $body = st_cms_renumber_tiles($body);
        return st_cms_set_tile_grid($body, (int) $left);
    }
    return $body;
}

function st_cms_unlink_tiles_to(string $url): void
{
    if ($url === '') return;
    foreach (glob(ST_PAGES . '/*.html') ?: [] as $file) {
        [$meta, $body] = st_cms_parse((string) file_get_contents($file));
        $new = st_cms_remove_tile_href($body, $url);
        if ($new !== $body) st_cms_atomic_write($file, st_cms_dump($meta, $new), true);
    }
}

function st_cms_delete_page(string $id): array
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    $pages = st_cms_pages();
    $page = null;
    foreach ($pages as $p) {
        if (($p['id'] ?? '') === $id) { $page = $p; break; }
    }
    if ($page === null) throw new RuntimeException('Nie znaleziono strony.');
    $kids = [];
    foreach ($pages as $p) {
        if (($p['parentUrl'] ?? '') === ($page['url'] ?? '') && ($p['id'] ?? '') !== $id) $kids[] = $p;
    }
    if ($kids !== []) throw new RuntimeException('Najpierw usuń podstrony tej grupy.');
    if (empty($page['canDelete'])) throw new RuntimeException('Tej strony nie można usunąć.');
    [$meta] = st_cms_parse((string) file_get_contents($path));
    $out = trim((string) ($meta['out'] ?? ''));
    $url = trim((string) ($meta['url'] ?? ($page['url'] ?? '')));
    st_cms_backup_file($path);
    if ($out !== '') st_cms_backup_file(ST_ROOT . '/' . $out);
    st_cms_unlink_tiles_to($url);
    unlink($path);
    st_cms_mark_pending('page.delete:' . $id, $out);
    $live = st_cms_publish();
    return $live + ['ok' => true, 'id' => $id];
}
