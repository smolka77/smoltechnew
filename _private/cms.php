<?php
declare(strict_types=1);

const ST_ROOT = __DIR__ . '/..';
const ST_PAGES = ST_ROOT . '/_build/pages';
const ST_LAYOUT = ST_ROOT . '/_build/szablon.html';
const ST_PARTIALS = ST_ROOT . '/_build/partials';
const ST_FILMY = ST_ROOT . '/_src/filmy-ua.txt';
const ST_SETTINGS = ST_ROOT . '/_build/ustawienia.json';
const ST_MEDIA = ST_ROOT . '/assets/img/cms';
const ST_SITE = 'https://smoltech.com.ua';
const ST_PENDING = ST_ROOT . '/_build/nieopublikowane.json';

function st_cms_esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function st_cms_strip(string $s): string
{
    $t = preg_replace('/<[^>]+>/', ' ', $s) ?? $s;
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/', ' ', $t) ?? $t);
}

function st_cms_rel(string $path): string
{
    $root = str_replace('\\', '/', ST_ROOT);
    $path = str_replace('\\', '/', $path);
    if (str_starts_with($path, $root . '/')) return substr($path, strlen($root) + 1);
    return ltrim($path, '/');
}

/** Copy a file into _private/data/backups before it is replaced or removed. */
function st_cms_backup_file(string $path): void
{
    if (!is_file($path)) return;
    $rel = st_cms_rel($path);
    if ($rel === '' || str_contains($rel, '..')) return;
    $dest = ST_ROOT . '/_private/data/backups/' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '/' . $rel;
    $dir = dirname($dest);
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) return;
    @copy($path, $dest);
}

/** Write a file by renaming a temp file in the same folder. Optionally keep a backup first. */
function st_cms_atomic_write(string $path, string $contents, bool $backup = true): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Could not create a folder for the page.');
    }
    if ($backup) st_cms_backup_file($path);
    if (is_file($path)) {
        $prev = (string) file_get_contents($path);
        $crlf = substr_count($prev, "\r\n");
        $lfOnly = substr_count($prev, "\n") - $crlf;
        if ($crlf > $lfOnly && $crlf > 0) {
            $contents = str_replace("\r\n", "\n", $contents);
            $contents = str_replace("\n", "\r\n", $contents);
        }
    }
    $tmp = $dir . '/.' . basename($path) . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $fh = fopen($tmp, 'wb');
    if ($fh === false) throw new RuntimeException('Could not write the page.');
    $ok = fwrite($fh, $contents);
    fflush($fh);
    fclose($fh);
    if ($ok === false || $ok !== strlen($contents)) {
        @unlink($tmp);
        throw new RuntimeException('Could not write the page.');
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        throw new RuntimeException('Could not save the page.');
    }
}

function st_cms_kind(string $name, string $nav): string
{
    if (str_starts_with($name, '00')) return 'home';
    if (str_starts_with($name, '10') || str_starts_with($name, '11')) return 'company';
    if (preg_match('/^4\d/', $name)) return 'studs';
    if (str_starts_with($name, '50')) return 'video';
    if (str_starts_with($name, '60')) return 'contact';
    if (str_starts_with($name, '70') || str_starts_with($name, '90')) return 'legal';
    return $nav !== '' ? $nav : 'other';
}

function st_cms_section_before(string $body, int $pos): string
{
    $chunk = substr($body, 0, max(0, $pos));
    if (!preg_match_all('/<h2\b[^>]*>(.*?)<\/h2>/si', $chunk, $mm)) return 'Góra strony';
    $last = trim(st_cms_strip((string) end($mm[1])));
    return $last !== '' ? $last : 'Sekcja';
}

function st_cms_caption_near(string $body, int $pos): string
{
    $ahead = substr($body, $pos, 900);
    if (preg_match('/<h3\b[^>]*>(.*?)<\/h3>/si', $ahead, $m)) {
        $t = trim(st_cms_strip($m[1]));
        if ($t !== '') return $t;
    }
    $back = substr($body, max(0, $pos - 700), min(700, $pos));
    if (preg_match_all('/<h3\b[^>]*>(.*?)<\/h3>/si', $back, $mm)) {
        $t = trim(st_cms_strip((string) end($mm[1])));
        if ($t !== '') return $t;
    }
    return '';
}

function st_cms_page_role(string $kind, string $parentUrl): string
{
    if ($kind === 'home') return 'home';
    if (in_array($kind, ['machines', 'studs'], true)) return $parentUrl !== '' ? 'profile' : 'group';
    return 'page';
}

function st_cms_enrich_pages(array $rows): array
{
    $byUrl = [];
    foreach ($rows as $r) {
        if (!empty($r['url'])) $byUrl[$r['url']] = $r;
    }
    foreach ($rows as &$r) {
        $parent = $byUrl[$r['parentUrl'] ?? ''] ?? null;
        $r['parentName'] = $parent['name'] ?? '';
        $role = st_cms_page_role((string) ($r['kind'] ?? ''), (string) ($r['parentUrl'] ?? ''));
        $r['role'] = $role;
        if (($r['kind'] ?? '') === 'studs' && $role === 'group') $r['roleLabel'] = 'Offer group';
        elseif (($r['kind'] ?? '') === 'studs' && $role === 'profile') $r['roleLabel'] = 'Offer profile';
        else $r['roleLabel'] = ['home' => 'Home page', 'group' => 'Machine group', 'profile' => 'Machine profile', 'page' => 'Page'][$role] ?? 'Page';
        $r['roleHint'] = [
            'home' => 'What visitors see right after they open the site',
            'group' => 'The page for the whole group. Profiles in this group are listed below.',
            'profile' => 'A specific machine the visitor opens from the group',
            'page' => 'The content of this subpage',
        ][$role] ?? '';
    }
    unset($r);
    $childUrls = [];
    foreach ($rows as $r) {
        $pu = (string) ($r['parentUrl'] ?? '');
        if ($pu !== '') $childUrls[$pu] = true;
    }
    foreach ($rows as &$r) {
        $kind = (string) ($r['kind'] ?? '');
        $url = (string) ($r['url'] ?? '');
        $r['hasChildren'] = $url !== '' && !empty($childUrls[$url]);
        $r['canDelete'] = empty($childUrls[$url]) && (in_array($kind, ['machines', 'studs'], true) || !empty($r['added']));
    }
    unset($r);
    return $rows;
}

function st_cms_kind_label(string $kind): string
{
    return [
        'home' => 'Home page',
        'company' => 'About',
        'machines' => 'Machines',
        'studs' => 'Stud welding',
        'video' => 'Video',
        'contact' => 'Contact',
        'legal' => 'Legal',
        'other' => 'Page',
    ][$kind] ?? 'Page';
}

function st_cms_parse(string $text): array
{
    $text = ltrim($text, "\xEF\xBB\xBF \t\r\n");
    if (!preg_match('/^---\r?\n(.*?)\r?\n---\r?\n(.*)$/s', $text, $m)) {
        throw new RuntimeException('Brak front matter.');
    }
    $meta = [];
    foreach (preg_split('/\r?\n/', $m[1]) as $line) {
        if (trim($line) === '' || !str_contains($line, ':')) continue;
        [$k, $v] = explode(':', $line, 2);
        $meta[trim($k)] = trim($v);
    }
    return [$meta, $m[2]];
}

function st_cms_dump(array $meta, string $body): string
{
    $order = ['out','url','nav','title','desc','ogtitle','og','ogtype','crumbs','prio','pl','head','noindex'];
    $lines = ['---'];
    $seen = [];
    foreach ($order as $k) {
        if (!empty($meta[$k])) {
            $lines[] = $k . ': ' . trim((string) $meta[$k]);
            $seen[$k] = true;
        }
    }
    foreach ($meta as $k => $v) {
        if (empty($seen[$k]) && trim((string) $v) !== '') {
            $lines[] = $k . ': ' . trim((string) $v);
        }
    }
    $lines[] = '---';
    $body = ltrim($body, "\r\n");
    if (!str_ends_with($body, "\n")) $body .= "\n";
    return implode("\n", $lines) . "\n\n" . $body;
}

function st_cms_hero(string $body): array
{
    $block = $body;
    if (preg_match('/(<section class="hero\b.*?<\/section>)/s', $body, $m)) {
        $block = $m[1];
        $present = true;
    } else {
        $present = false;
    }
    $grab = static function (string $pat) use ($block): string {
        return preg_match($pat, $block, $mm) ? trim($mm[1]) : '';
    };
    $ctas = [];
    if (preg_match('/<div class="hero__btns">(.*?)<\/div>/s', $block, $bm)) {
        if (preg_match_all('/<a class="([^"]*)" href="([^"]+)">\s*([^<]+)/', $bm[1], $am, PREG_SET_ORDER)) {
            foreach ($am as $a) {
                $ctas[] = ['href' => $a[2], 'label' => trim($a[3]), 'ghost' => str_contains($a[1], 'btn-ghost')];
            }
        }
    }
    $img = preg_match('/<img src="(\/assets\/img\/[^"?]+)/', $block, $im) ? $im[1] : '';
    return [
        'eyebrow' => st_cms_strip($grab('/<p class="eyebrow">(.*?)<\/p>/s')),
        'h1' => $grab('/<h1[^>]*>(.*?)<\/h1>/s'),
        'sub' => $grab('/<p class="hero__sub">(.*?)<\/p>/s'),
        'image' => $img,
        'ctas' => $ctas,
        'present' => $present,
    ];
}

function st_cms_mach(string $body): array
{
    $items = [];
    if (!preg_match_all('/<article class="mach\b[^"]*"([^>]*)>(.*?)<\/article>/s', $body, $mm, PREG_SET_ORDER)) {
        return $items;
    }
    foreach ($mm as $m) {
        $attrs = $m[1];
        $inner = $m[2];
        preg_match('/\bid="([^"]+)"/', $attrs, $id);
        preg_match('/data-ask-topic="([^"]*)"/', $attrs, $topic);
        preg_match('/data-vid="([^"]+)"/', $inner, $vid);
        preg_match('/<h3\b[^>]*>(.*?)<\/h3>/s', $inner, $title);
        preg_match('/data-title="([^"]*)"/', $inner, $vtitle);
        $desc = '';
        if (preg_match('/<div class="mach__text"[^>]*>(.*?)<\/div>/s', $inner, $rich)) {
            $desc = trim($rich[1]);
        } elseif (preg_match('/<\/h3>\s*(<p(?! class="mach__links")>.*?<\/p>)/s', $inner, $after)) {
            $desc = preg_replace('/^<p>|<\/p>$/s', '', $after[1]) ?? '';
        }
        preg_match('/<img class="mach__pic"[^>]*\ssrc="([^"?]+)/', $inner, $pic);
        preg_match('/<a class="arrow-link"[^>]*>([^<]+)/', $inner, $ask);
        $items[] = [
            'id' => $id[1] ?? '',
            'topic' => html_entity_decode($topic[1] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'video' => $vid[1] ?? '',
            'videoTitle' => html_entity_decode($vtitle[1] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'title' => st_cms_strip($title[1] ?? ''),
            'html' => trim($desc),
            'image' => $pic[1] ?? '',
            'ask' => isset($ask[1]) ? st_cms_strip($ask[1]) : '',
        ];
    }
    return $items;
}

function st_cms_div_end(string $body, int $innerStart): ?int
{
    $i = $innerStart;
    $depth = 1;
    $len = strlen($body);
    while ($i < $len) {
        $open = null;
        if (preg_match('/<div\b/', substr($body, $i), $mm, PREG_OFFSET_CAPTURE)) {
            $open = $i + (int) $mm[0][1];
        }
        $close = strpos($body, '</div>', $i);
        if ($close === false) return null;
        if ($open !== null && $open < $close) {
            $depth++;
            $i = $open + 4;
            continue;
        }
        $depth--;
        if ($depth === 0) return $close + strlen('</div>');
        $i = $close + 6;
    }
    return null;
}

function st_cms_faq(string $body): array
{
    $items = [];
    if (!preg_match_all('/<div class="faq\b[^"]*">/', $body, $opens, PREG_OFFSET_CAPTURE)) {
        return $items;
    }
    foreach ($opens[0] as $open) {
        $end = st_cms_div_end($body, (int) $open[1] + strlen($open[0]));
        $chunk = $end === null ? substr($body, (int) $open[1]) : substr($body, (int) $open[1], $end - (int) $open[1]);
        if (preg_match_all('/<details>\s*<summary>(.*?)<\/summary>\s*<div class="faq__a">(.*?)<\/div>\s*<\/details>/s', $chunk, $mm, PREG_SET_ORDER)) {
            foreach ($mm as $m) {
                $a = trim(preg_replace('/^<p>|<\/p>$/s', '', trim($m[2])) ?? '');
                $items[] = ['q' => st_cms_strip($m[1]), 'a' => $a];
            }
        }
    }
    return $items;
}

function st_cms_orphan_details(string $tail): array
{
    $blocks = [];
    $i = 0;
    $n = strlen($tail);
    while ($i < $n) {
        while ($i < $n && ctype_space($tail[$i])) $i++;
        if (str_starts_with(substr($tail, $i), '</details>')) {
            $i += 10;
            continue;
        }
        if (str_starts_with(substr($tail, $i), '</div>')) {
            $j = $i + 6;
            while ($j < $n && ctype_space($tail[$j])) $j++;
            $rest = substr($tail, $j);
            if (str_starts_with($rest, '</details>') || str_starts_with($rest, '<details')) {
                $i = $j;
                continue;
            }
            break;
        }
        if (!str_starts_with(substr($tail, $i), '<details')) break;
        $end = strpos($tail, '</details>', $i);
        if ($end === false) break;
        $end += 10;
        $blocks[] = substr($tail, $i, $end - $i);
        $i = $end;
    }
    while ($i < $n && ctype_space($tail[$i])) $i++;
    if (str_starts_with(substr($tail, $i), '</div>')) $i += 6;
    return [$blocks, $i];
}

function st_cms_sanitize_faq(string $body): string
{
    if (!preg_match_all('/<div class="faq\b[^"]*">/', $body, $mm, PREG_OFFSET_CAPTURE)) {
        return $body;
    }
    $out = '';
    $pos = 0;
    foreach ($mm[0] as $m) {
        $open = $m[0];
        $start = (int) $m[1];
        $out .= substr($body, $pos, $start - $pos);
        $end = st_cms_div_end($body, $start + strlen($open));
        if ($end === null) {
            $out .= substr($body, $start);
            return $out;
        }
        $inner = substr($body, $start + strlen($open), $end - ($start + strlen($open)));
        preg_match_all('/<details\b[\s\S]*?<\/details>/', $inner, $bm);
        $blocks = $bm[0] ?? [];
        [$extra, $skip] = st_cms_orphan_details(substr($body, $end));
        array_push($blocks, ...$extra);
        $seen = [];
        $unique = [];
        foreach ($blocks as $block) {
            $q = '';
            if (preg_match('/<summary>(.*?)<\/summary>/s', $block, $qm)) $q = st_cms_strip($qm[1]);
            if ($q === '' || isset($seen[$q])) continue;
            $seen[$q] = true;
            $unique[] = trim($block);
        }
        $out .= $open . "\n" . implode("\n", $unique) . "\n    </div>";
        $pos = $end + $skip;
    }
    return $out . substr($body, $pos);
}

function st_cms_img_alts(): array
{
    return [
        'hero-suspended' => 'Підвісна кліщова машина точкового зварювання SMOLTECH',
        'hero-stationary' => 'Стаціонарна машина точкового зварювання SMOLTECH',
        'hero-projection-cell' => 'Точково-рельєфна машина з лінійним притиском SMOLTECH',
        'hero-automation' => 'Автоматизований комплекс контактного зварювання SMOLTECH',
        'hero-mesh' => 'Багатоточкова машина для зварювання сіток SMOLTECH',
        'area-fixture' => 'Машина зварювання з оснасткою під деталь SMOLTECH',
        'stud-cnc-1' => 'Комплекс ЧПК для приварювання шпильок SMOLTECH',
        'stud-cnc-2' => 'Комплекс ЧПК для автоматичного приварювання шпильок SMOLTECH',
        'stud-da-series' => 'Інверторні пристрої DA для приварювання шпильок',
        'stud-cdm-series' => 'Конденсаторні пристрої CDM для приварювання шпильок',
        'company-hall-1' => 'Виробничий цех SMOLTECH у Мокроносі-Дольному під Вроцлавом',
        'company-hall-2' => 'Виробничий цех SMOLTECH — машини контактного зварювання',
        'band-realizacje' => 'Відео реалізацій автоматизації зварювання SMOLTECH',
        'prod-etech' => 'Інверторна багатофункціональна машина E-tech SMOLTECH',
    ];
}

function st_cms_fill_named_alts(string $body): string
{
    $alts = st_cms_img_alts();
    return preg_replace_callback('/<img\b[^>]*>/', static function (array $m) use ($alts) {
        $tag = $m[0];
        if (preg_match('/\balt="([^"]*)"/', $tag, $am) && trim($am[1]) !== '') return $tag;
        if (!preg_match('/\bsrc="([^"]+)"/', $tag, $sm)) return $tag;
        $stem = pathinfo(explode('?', $sm[1], 2)[0], PATHINFO_FILENAME);
        $alt = $alts[$stem] ?? '';
        if ($alt === '') return $tag;
        $esc = st_cms_esc($alt);
        if (preg_match('/\balt="/', $tag)) return preg_replace('/\balt="[^"]*"/', 'alt="' . $esc . '"', $tag, 1) ?? $tag;
        if (str_ends_with($tag, '/>')) return substr($tag, 0, -2) . ' alt="' . $esc . '"/>';
        return substr($tag, 0, -1) . ' alt="' . $esc . '">';
    }, $body) ?? $body;
}

function st_cms_fill_yt_alts(string $body): string
{
    return preg_replace_callback(
        '/<button class="yt"[^>]*data-title="([^"]*)"[^>]*>[\s\S]*?<\/button>/',
        static function (array $m) {
            $title = st_cms_esc(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            return preg_replace('/(<img\b[^>]*\balt=")[^"]*/', '${1}' . $title, $m[0], 1) ?? $m[0];
        },
        $body
    ) ?? $body;
}

function st_cms_seo_tune(string $body): string
{
    return st_cms_fill_named_alts(st_cms_fill_yt_alts(st_cms_sanitize_faq($body)));
}

function st_cms_faq_ld(array $items): string
{
    $ents = [];
    $seen = [];
    foreach ($items as $it) {
        $q = trim((string) ($it['q'] ?? ''));
        $a = st_cms_strip((string) ($it['a'] ?? ''));
        if ($q === '' || $a === '' || isset($seen[$q])) continue;
        $seen[$q] = true;
        $ents[] = [
            '@type' => 'Question',
            'name' => $q,
            'acceptedAnswer' => ['@type' => 'Answer', 'text' => $a],
        ];
    }
    if ($ents === []) return '';
    return st_cms_ld_script(['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $ents]);
}

function st_cms_child_itemlist_ld(string $body): string
{
    $rows = [];
    $seen = [];
    if (preg_match_all('/<a class="(?:tile|choice__card)[^"]*"[^>]*href="([^"]+)"[\s\S]*?<h3>(.*?)<\/h3>/', $body, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) {
            $href = trim($m[1]);
            $name = st_cms_strip($m[2]);
            if ($href === '' || str_starts_with($href, '#') || str_starts_with($href, 'mailto:') || $name === '') continue;
            $loc = str_starts_with($href, 'http') ? $href : ST_SITE . (str_starts_with($href, '/') ? $href : '/' . $href);
            if (isset($seen[$loc])) continue;
            $seen[$loc] = true;
            $rows[] = [$loc, $name];
        }
    }
    if (count($rows) < 2) return '';
    $els = [];
    foreach ($rows as $i => [$loc, $name]) {
        $els[] = ['@type' => 'ListItem', 'position' => $i + 1, 'url' => $loc, 'name' => $name];
    }
    return st_cms_ld_script(['@context' => 'https://schema.org', '@type' => 'ItemList', 'itemListElement' => $els]);
}

function st_cms_people(string $body): array
{
    $items = [];
    if (!preg_match_all('/<article class="pcard pcard--contact[^"]*">(.*?)<\/article>/s', $body, $mm)) {
        return $items;
    }
    foreach ($mm[1] as $inner) {
        preg_match('/<span class="pcard__role">(.*?)<\/span>/s', $inner, $role);
        preg_match('/<h3>(.*?)<\/h3>/s', $inner, $name);
        preg_match_all('/mailto:([^"]+)"/', $inner, $emails);
        preg_match_all('/<a href="tel:[^"]+">([^<]+)<\/a>/', $inner, $phones);
        $items[] = [
            'role' => st_cms_strip($role[1] ?? ''),
            'name' => st_cms_strip($name[1] ?? ''),
            'email' => $emails[1][0] ?? '',
            'phones' => $phones[1] ?? [],
        ];
    }
    return $items;
}

function st_cms_areas(string $body): array
{
    $items = [];
    if (!preg_match_all('/<article class="area\b[^"]*">(.*?)<\/article>/s', $body, $mm)) {
        return $items;
    }
    foreach ($mm[1] as $inner) {
        preg_match('/<h3>(.*?)<\/h3>/s', $inner, $h3);
        preg_match_all('/<p>(.*?)<\/p>/s', $inner, $ps);
        $paras = array_map('st_cms_strip', $ps[1] ?? []);
        preg_match('/<img src="(\/assets\/img\/[^"?]+)/', $inner, $img);
        preg_match('/<a class="arrow-link" href="([^"]+)"/', $inner, $href);
        $items[] = [
            'title' => st_cms_strip($h3[1] ?? ''),
            'text' => implode("\n\n", $paras),
            'image' => $img[1] ?? '',
            'href' => $href[1] ?? '',
        ];
    }
    return $items;
}

function st_cms_stats(string $body): array
{
    $out = [];
    if (preg_match_all('/<div class="stats__i">\s*<dt class="stats__l">(.*?)<\/dt>\s*<dd class="stats__n[^"]*">(.*?)<\/dd>/s', $body, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) {
            $out[] = ['label' => st_cms_strip($m[1]), 'value' => st_cms_strip($m[2])];
        }
    }
    return $out;
}

function st_cms_copy_labels(): array
{
    return [
        'eyebrow' => 'Mały podpis nad tytułem',
        'h1' => 'Główny tytuł',
        'hero__sub' => 'Tekst pod tytułem',
        'h2' => 'Tytuł tej części strony',
        'lead' => 'Opis pod tytułem',
        'h3' => 'Tytuł kafelka',
        'h3' => 'Tytuł',
        'p' => 'Akapit',
        'li' => 'Punkt',
        'tag' => 'Etykieta',
        'btn' => 'Przycisk',
        'link' => 'Link',
        'stats__l' => 'Opis statystyki',
        'stats__n' => 'Wartość',
        'proof__l' => 'Opis liczby',
        'proof__n' => 'Liczba',
        'summary' => 'Pytanie FAQ',
        'rich' => 'Opis produktu',
        'label' => 'Podpis',
        'cell' => 'Pole w tabeli',
    ];
}

const ST_ASK_LABEL = 'Запитати про цю конфігурацію';
const ST_PRODUCT_SECTION_ID = 'produkty';
const ST_RICH_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'span', 'a', 'sub', 'sup'];
const ST_RICH_STYLE = ['font-size', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'color', 'text-align'];

function st_cms_clean_style(string $style): string
{
    $keep = [];
    foreach (explode(';', $style) as $part) {
        if (!str_contains($part, ':')) continue;
        [$k, $v] = explode(':', $part, 2);
        $k = strtolower(trim($k));
        $v = trim($v);
        if (!in_array($k, ST_RICH_STYLE, true) || $v === '' || preg_match('/url\(|expression|javascript/i', $v)) continue;
        $keep[] = $k . ':' . $v;
    }
    return implode(';', $keep);
}

function st_cms_clean_tag(array $m, bool $rich): string
{
    $close = $m[1];
    $name = strtolower($m[2]);
    $attrs = $m[3] ?? '';
    if ($rich && in_array($name, ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'], true)) $name = 'p';
    if ($name === 'font') $name = 'span';
    if (!in_array($name, ST_RICH_TAGS, true)) return '';
    if ($close !== '') return '</' . $name . '>';
    if ($name === 'br') return '<br>';
    $out = '';
    $styleRaw = '';
    if (preg_match('/style="([^"]*)"/i', $attrs, $sm)) {
        $styleRaw = html_entity_decode($sm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    if (preg_match('/\bcolor="([^"]*)"/i', $attrs, $cm)) {
        $col = trim(html_entity_decode($cm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($col !== '' && !preg_match('/url\(|expression|javascript/i', $col)) {
            $styleRaw = rtrim($styleRaw, ';') . ($styleRaw !== '' ? ';' : '') . 'color:' . $col;
        }
    }
    $st = st_cms_clean_style($styleRaw);
    if ($st !== '') $out .= ' style="' . st_cms_esc($st) . '"';
    if (in_array($name, ['span', 'p', 'li'], true) && preg_match('/data-st-type="(head|sub|body|small)"/i', $attrs, $tm)) {
        $out .= ' data-st-type="' . strtolower($tm[1]) . '"';
    }
    if ($name === 'a') {
        $href = preg_match('/href="([^"]*)"/i', $attrs, $hm) ? trim(html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')) : '';
        if ($href !== '' && preg_match('~^(https?://|mailto:|tel:|/|#)~i', $href)) $out .= ' href="' . st_cms_esc($href) . '"';
        $classes = [];
        if (preg_match('/\bclass="([^"]*)"/i', $attrs, $cm)) {
            foreach (preg_split('/\s+/', trim($cm[1])) ?: [] as $cls) {
                if ($cls === 'st-link') $classes[] = 'st-link';
            }
        }
        if ($classes !== []) $out .= ' class="' . implode(' ', $classes) . '"';
        $linked = preg_match('/\bdata-st-link\b/i', $attrs) === 1 || in_array('st-link', $classes, true);
        if ($linked) $out .= ' data-st-link=""';
        if ($linked ? preg_match('/target="_blank"/i', $attrs) : str_starts_with($href, 'http')) $out .= ' target="_blank" rel="noopener"';
    }
    return '<' . $name . $out . '>';
}

/** Sanitise WYSIWYG HTML: block/inline formatting only, no scripts, no layout tags. */
function st_cms_clean_rich(string $raw): string
{
    $s = preg_replace('/<(script|style|iframe|object|embed)\b.*?<\/\1>/is', '', $raw) ?? $raw;
    $s = preg_replace('/<!--.*?-->/s', '', $s) ?? $s;
    $s = preg_replace_callback('/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/', static fn(array $m) => st_cms_clean_tag($m, true), $s) ?? $s;
    $s = preg_replace('/<(span|strong|em|b|i|u|s|sub|sup)>\s*<\/\1>/', '', $s) ?? $s;
    $s = preg_replace('/<span>(.*?)<\/span>/s', '$1', $s) ?? $s;
    $s = preg_replace('/<p([^>]*)>\s*(?:<br>\s*)*<\/p>/', '', $s) ?? $s;
    $s = trim(preg_replace('/\s*\n\s*/', ' ', $s) ?? $s);
    if ($s === '') return '';
    if (!preg_match('/^<(p|ul|ol)\b/', $s)) $s = '<p>' . $s . '</p>';
    return $s;
}

/** Heading/paragraph HTML from the editor: keep markup, drop scripts and inline handlers. */
function st_cms_promote_color_attr(string $s): string
{
    return preg_replace_callback(
        '/<([a-z][a-z0-9]*)\b([^>]*?)\scolor\s*=\s*("|\')([^"\']+)\3([^>]*)>/i',
        static function (array $m): string {
            $tag = $m[1];
            $col = trim(html_entity_decode($m[4], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $attrs = $m[2] . $m[5];
            if ($col === '' || preg_match('/url\(|expression|javascript/i', $col)) {
                return '<' . $tag . $attrs . '>';
            }
            if (preg_match('/style\s*=\s*("|\')([^"\']*)\1/i', $attrs, $sm)) {
                $style = $sm[2];
                if (!preg_match('/(?:^|;)\s*color\s*:/i', $style)) {
                    $style = rtrim($style, "; \t") . ';color:' . $col;
                }
                $attrs = preg_replace(
                    '/style\s*=\s*("|\')([^"\']*)\1/i',
                    'style="' . htmlspecialchars($style, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"',
                    $attrs,
                    1
                ) ?? $attrs;
            } else {
                $attrs .= ' style="color:' . htmlspecialchars($col, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"';
            }
            return '<' . $tag . $attrs . '>';
        },
        $s
    ) ?? $s;
}

function st_cms_clean_inline(string $raw): string
{
    $s = preg_replace('/<(script|style|iframe|object|embed)\b.*?<\/\1>/is', '', $raw) ?? $raw;
    $s = preg_replace('/<(script|style|iframe|object|embed)\b[^>]*>/is', '', $s) ?? $s;
    $s = preg_replace('/\s+on[a-z]+\s*=\s*"[^"]*"/i', '', $s) ?? $s;
    $s = preg_replace("/\s+on[a-z]+\s*=\s*'[^']*'/i", '', $s) ?? $s;
    $s = preg_replace('/(href|src)\s*=\s*"\s*javascript:[^"]*"/i', '$1="#"', $s) ?? $s;
    $s = preg_replace_callback('/<(\/?)div\b[^>]*>/i', static fn(array $m) => $m[1] !== '' ? '<br>' : '', $s) ?? $s;
    $s = preg_replace('/<(\/?)font\b([^>]*)>/i', '<$1span$2>', $s) ?? $s;
    $s = st_cms_promote_color_attr($s);
    for ($k = 0; $k < 3; $k++) {
        $s = preg_replace('/<(span|strong|em|b|i|u|s|sub|sup)\b[^>]*><\/\1>/i', '', $s) ?? $s;
    }
    $s = preg_replace('/(?:\s*<br\s*\/?>\s*)+$/', '', trim($s)) ?? $s;
    return trim($s);
}

function st_cms_page_names_pl(): array
{
    return [
        '00-strona-glowna' => 'Home',
        '10-pro-kompaniyu' => 'About',
        '11-kompetentsiyi' => 'Capabilities',
        '21-pidvisni' => 'Suspended spot welders',
        '211-pidvisni-16-38' => '16–38 kVA',
        '212-pidvisni-56-90' => '56–90 kVA',
        '22-statsionarni' => 'Stationary spot welders',
        '221-statsionarni-16-25' => '16–25 kVA',
        '222-statsionarni-inv' => 'Inverter 25 kVA',
        '23-tochkovo-relyefni' => 'Projection welders',
        '231-relyefni-35-80' => 'AC 35–80 kVA',
        '232-relyefni-56' => 'MFDC 56 kVA',
        '233-relyefni-90-200' => 'MFDC 90–200 kVA',
        '234-relyefni-63-163' => 'AC 63–163 kVA',
        '235-relyefni-80-315' => 'AC 80–315 kVA',
        '236-relyefni-100' => 'DC 100 kVA',
        '24-bahatofunktsionalni' => 'Inverter welders for bodywork',
        '25-mashyny-z-osnastkoyu' => 'Welders with tooling',
        '30-avtomatyzovani-kompleksy' => 'Automation and robots',
        '31-sitky' => 'Mesh welders',
        '40-shpylky' => 'Stud welding',
        '41-cdm' => 'CDM — capacitor discharge welding',
        '42-da' => 'DA — inverter stud welding',
        '43-cnc' => 'CNC systems',
        '50-video' => 'Video — welding automation',
        '60-kontakty' => 'Contact',
        '70-polityka' => 'Privacy policy',
        '90-404' => 'Page not found (404)',
    ];
}

function st_cms_page_name(array $meta, string $kind, string $stem = ''): string
{
    $map = st_cms_page_names_pl();
    if ($stem !== '' && isset($map[$stem])) return $map[$stem];
    $label = trim((string) ($meta['label'] ?? ''));
    if ($label !== '') return $label;
    if ($kind === 'home') return 'Home';
    $crumbs = trim((string) ($meta['crumbs'] ?? ''));
    if ($crumbs !== '') {
        $parts = preg_split('/\s*\|\s*/', $crumbs) ?: [];
        $last = trim((string) end($parts));
        if (str_contains($last, '>>')) $last = trim(explode('>>', $last, 2)[0]);
        if ($last !== '') return $last;
    }
    $title = trim((string) ($meta['title'] ?? ''));
    $title = trim((string) preg_split('/\s+[—|]\s+/u', $title)[0]);
    $title = trim((string) preg_replace('/\s*\|\s*SMOLTECH\s*$/u', '', $title));
    return $title !== '' ? $title : (string) ($meta['title'] ?? '');
}

function st_cms_parent_url(string $url, string $crumbs): string
{
    if (preg_match('#>>\s*(/[^\s|]+/)#', $crumbs, $m)) return trim($m[1]);
    $parts = array_values(array_filter(explode('/', trim($url, '/')), static fn($p) => $p !== ''));
    if (count($parts) >= 2) return '/' . $parts[0] . '/';
    return '';
}

function st_cms_copy_kind(string $tag, string $attrs, bool $loose = false): ?string
{
    $cls = preg_match('/class="([^"]*)"/', $attrs, $m) ? $m[1] : '';
    $bits = array_flip(array_filter(preg_split('/\s+/', trim($cls)) ?: [], static fn($x) => $x !== ''));
    $tag = strtolower($tag);
    if (isset($bits['yt'])) return null;
    if ($tag === 'div' && isset($bits['param-matrix__val'])) return 'cell';
    if ($tag === 'div' && isset($bits['param-matrix__head']) && !isset($bits['param-matrix__label'])) return 'h3';
    if ($tag === 'div' && isset($bits['param-matrix__label']) && !isset($bits['param-matrix__head'])) return 'cell';
    if ($tag === 'span' && isset($bits['model-strip__name'])) return 'h3';
    if (str_contains($cls, 'param-matrix') || str_contains($cls, 'model-strip')) return null;
    if ($tag === 'div') return isset($bits['mach__text']) ? 'rich' : null;
    if ($loose && $tag === 'span' && $bits === []) return 'label';
    if ($loose && $tag === 'span' && isset($bits['cta__phone'])) return null;
    if ($tag === 'p' && isset($bits['eyebrow'])) return 'eyebrow';
    if ($tag === 'h1') return 'h1';
    if ($tag === 'p' && isset($bits['hero__sub'])) return 'hero__sub';
    if ($tag === 'h2') return 'h2';
    if ($tag === 'p' && isset($bits['ftr__h'])) return 'h2';
    if ($tag === 'p' && isset($bits['lead'])) return 'lead';
    if ($tag === 'h3') return 'h3';
    if ($tag === 'span' && isset($bits['tag'])) return 'tag';
    if ($tag === 'dt' && isset($bits['stats__l'])) return 'stats__l';
    if ($tag === 'dd' && isset($bits['stats__n'])) return 'stats__n';
    if ($tag === 'span' && isset($bits['proof__l'])) return 'proof__l';
    if ($tag === 'strong' && isset($bits['proof__n'])) return 'proof__n';
    if ($tag === 'summary') return 'summary';
    if ($tag === 'a' && isset($bits['btn'])) return 'btn';
    if (in_array($tag, ['a', 'span'], true) && isset($bits['arrow-link'])) return 'link';
    if ($tag === 'button' && isset($bits['area__pick-btn'])) return 'link';
    if ($tag === 'button' && (isset($bits['chip']) || isset($bits['yt']) || isset($bits['model-strip__btn']))) return null;
    if ($tag === 'button' && isset($bits['btn'])) return 'btn';
    if ($tag === 'p' && !isset($bits['mach__idx']) && !isset($bits['mach__links']) && !isset($bits['hint']) && !isset($bits['vh'])) return 'p';
    if ($tag === 'li') return 'li';
    return null;
}

function st_cms_ctx_skip(string $body, int $pos): bool
{
    $gt = strpos($body, '>', $pos);
    $open = $gt === false ? '' : substr($body, $pos, $gt - $pos);
    if (str_contains($open, 'tile__no') || str_contains($open, 'area__no')) return true;
    $before = substr($body, max(0, $pos - 220), min(220, $pos));
    // Product card: number/title on the left column, rich text on the right — all editable.
    if (str_contains(substr($before, -140), 'class="mach__side"') || str_starts_with($open, '<div class="mach__text"')) return false;
    if (str_contains(substr($before, -60), 'class="mach__links"')) return false;
    if (str_contains($open, 'param-matrix__cell') || str_contains($open, 'model-strip__name')) return false;
    if (preg_match('/^<summary\b/i', $open)) return true;
    $ctx = $before . substr($body, $pos, 80);
    foreach ([
        'param-matrix', 'model-strip', 'vgrid', 'vcard', 'chips', 'class="yt',
        'mach__body', 'faq__', 'area__menu', 'pcard', 'otp',
        'client-grid', 'logo-grid',
    ] as $s) {
        if (str_contains($ctx, $s)) return true;
    }
    return false;
}

function st_cms_copy(string $body, bool $loose = false): array
{
    $hits = [];
    $pats = [
        '/<(p|h1|h2|h3|dt|dd|li|button|strong|summary)\b([^>]*)>(.*?)<\/\1>/si',
        '/<(span)\b([^>]*\b(?:tag|model-strip__name|proof__l)\b[^>]*)>(.*?)<\/\1>/si',
        '/<(a)\b([^>]*\b(?:btn|arrow-link)\b[^>]*)>(.*?)<\/\1>/si',
        '/<(div)\b([^>]*\bclass="mach__text"[^>]*)>(.*?)<\/\1>/si',
        '/<(div)\b([^>]*\bclass="[^"]*param-matrix__cell[^"]*"[^>]*)>(.*?)<\/\1>/si',
    ];
    foreach ($pats as $pat) {
        if (preg_match_all($pat, $body, $mm, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
            foreach ($mm as $m) $hits[] = $m;
        }
    }
    usort($hits, static function ($a, $b) {
        $d = $a[0][1] <=> $b[0][1];
        if ($d !== 0) return $d;
        return strlen($b[0][0]) <=> strlen($a[0][0]);
    });
    $used = [];
    $items = [];
    $labels = st_cms_copy_labels();
    foreach ($hits as $m) {
        $start = (int) $m[0][1];
        $end = $start + strlen($m[0][0]);
        $skip = false;
        foreach ($used as [$s, $e]) {
            if ($start >= $s && $start < $e) { $skip = true; break; }
        }
        if ($skip || st_cms_ctx_skip($body, $start)) continue;
        $tag = strtolower($m[1][0]);
        $attrs = $m[2][0];
        $inner = $m[3][0];
        $kind = st_cms_copy_kind($tag, $attrs, $loose);
        if ($kind === null) continue;
        if ($kind === 'label' && (str_contains($inner, '<input') || str_contains($inner, '<textarea') || str_contains($inner, '<svg'))) continue;
        if ($kind === 'li') {
            $stripped = trim($inner);
            if (str_starts_with($stripped, '<a ') || str_starts_with($stripped, '<button')) continue;
            if (str_contains($inner, '<ul') || str_contains($inner, '<ol')) continue;
        }
        $text = st_cms_strip($inner);
        if ($text === '') continue;
        if ($kind !== 'cell' && $kind !== 'li' && strlen($text) < 2) continue;
        if (in_array($text, ['01', '02', '03', '04', '05'], true)) continue;
        $gt = strpos($m[0][0], '>');
        $innerStart = $start + ($gt === false ? 0 : $gt + 1);
        $innerEnd = $innerStart + strlen($inner);
        $section = $kind === 'h2' ? $text : st_cms_section_before($body, $start);
        $items[] = [
            'i' => count($items),
            'kind' => $kind,
            'label' => $labels[$kind] ?? 'Tekst',
            'section' => $section,
            'html' => trim($inner),
            'plain' => $text,
            '_s' => $innerStart,
            '_e' => $innerEnd,
            '_os' => $start,
            '_oe' => $end,
            '_open' => substr($m[0][0], 0, $gt === false ? 0 : $gt + 1),
            '_tag' => $tag,
        ];
        $used[] = [$start, $end];
    }
    return $items;
}

function st_cms_patch_copy(string $body, ?array $items, bool $loose = false): string
{
    if (!is_array($items) || $items === []) return $body;
    $found = st_cms_copy($body, $loose);
    $jobs = [];
    foreach ($items as $i => $it) {
        if (!is_array($it)) continue;
        $idx = (int) $i;
        if (!isset($found[$idx])) continue;
        $new = $it['html'] ?? $it['plain'] ?? null;
        $asList = strtolower(trim((string) ($it['asList'] ?? '')));
        if ($asList !== 'ul' && $asList !== 'ol' && $asList !== 'p') $asList = '';
        $job = [
            'html' => $new === null ? null : (string) $new,
            'delete' => !empty($it['delete']),
            'before' => st_cms_new_siblings($it['before'] ?? null),
            'after' => st_cms_new_siblings($it['after'] ?? null),
            'asList' => $asList,
        ];
        if ($job['html'] === null && !$job['delete'] && $job['before'] === [] && $job['after'] === [] && $job['asList'] === '') continue;
        $jobs[$idx] = $job;
    }
    if ($jobs === []) return $body;
    krsort($jobs, SORT_NUMERIC);
    foreach ($jobs as $idx => $job) {
        $f = $found[$idx];
        $clean = static fn(string $h): string => $f['kind'] === 'rich' ? st_cms_clean_rich($h) : st_cms_clean_inline($h);
        $itemHtml = static function ($h) use ($clean): array {
            if (is_array($h) && isset($h['_list'])) {
                $items = [];
                foreach ((array) ($h['items'] ?? []) as $one) $items[] = $clean((string) $one);
                return $items;
            }
            if (is_array($h) && array_key_exists('html', $h)) return [$clean((string) $h['html'])];
            if (is_array($h)) return [];
            return [$clean((string) $h)];
        };
        $emit = static function ($h) use ($clean, $f): string {
            return st_cms_emit_new_sibling($h, $f, $clean);
        };
        $inner = $job['html'] === null ? substr($body, (int) $f['_s'], (int) $f['_e'] - (int) $f['_s']) : $clean($job['html']);
        $close = '</' . $f['_tag'] . '>';
        $os = (int) $f['_os'];
        $oe = (int) $f['_oe'];
        // Keep the source tidy: new siblings go on their own line with the same indent.
        $nl = strrpos(substr($body, 0, $os), "\n");
        $lead = $nl === false ? '' : substr($body, $nl + 1, $os - $nl - 1);
        $sep = ($nl !== false && trim($lead) === '') ? "\n" . $lead : '';
        if ($job['asList'] !== '' && !$job['delete']) {
            $items = [];
            foreach ($job['before'] as $h) {
                foreach ($itemHtml($h) as $one) $items[] = $one;
            }
            $items[] = $inner;
            foreach ($job['after'] as $h) {
                foreach ($itemHtml($h) as $one) $items[] = $one;
            }
            $repl = st_cms_render_list($job['asList'], $items, static fn(string $h): string => $h);
            if ($repl !== '') {
                $body = substr($body, 0, $os) . $repl . substr($body, $oe);
                continue;
            }
        }
        $parts = [];
        foreach ($job['before'] as $h) $parts[] = $emit($h);
        if (!$job['delete']) $parts[] = substr($body, $os, (int) $f['_s'] - $os) . $inner . $close;
        foreach ($job['after'] as $h) $parts[] = $emit($h);
        $parts = array_values(array_filter($parts, static fn(string $p): bool => $p !== ''));
        if ($parts === [] && $sep !== '') $os = (int) $nl;
        $body = substr($body, 0, $os) . implode($sep, $parts) . substr($body, $oe);
    }
    return $body;
}

/** Render a bullet/numbered list produced by the visual editor. */
function st_cms_render_list(string $tag, array $items, callable $clean): string
{
    $tag = strtolower($tag) === 'ol' ? 'ol' : 'ul';
    $lis = '';
    foreach ($items as $h) {
        $h = trim((string) $h);
        if ($h === '' || st_cms_strip($h) === '') continue;
        $lis .= '<li>' . $clean($h) . '</li>';
    }
    if ($lis === '') return '';
    if ($tag === 'ol') return '<ol>' . $lis . '</ol>';
    return '<ul class="ticks">' . $lis . '</ul>';
}

/** HTML of text blocks added next to an existing one in the editor (non-empty only). */
function st_cms_new_siblings(mixed $list): array
{
    if (!is_array($list)) return [];
    $out = [];
    foreach ($list as $h) {
        if (is_array($h) && (isset($h['asList']) || isset($h['_list'])) && !isset($h['html'])) {
            $tag = strtolower(trim((string) ($h['asList'] ?? $h['_list'] ?? 'ul')));
            if ($tag !== 'ol') $tag = 'ul';
            $items = [];
            foreach ((array) ($h['items'] ?? []) as $one) {
                $one = trim((string) $one);
                if ($one !== '' && st_cms_strip($one) !== '') $items[] = $one;
            }
            if ($items !== []) $out[] = ['_list' => $tag, 'items' => $items];
            continue;
        }
        if (is_array($h)) {
            $html = trim((string) ($h['html'] ?? ''));
            if ($html === '' || st_cms_strip($html) === '') continue;
            $tag = strtolower(preg_replace('/[^a-z0-9]/', '', (string) ($h['tag'] ?? $h['_tag'] ?? 'p')) ?? 'p');
            if ($tag !== 'li') $tag = 'p';
            $class = trim((string) ($h['className'] ?? $h['class'] ?? $h['_class'] ?? ''));
            $out[] = ['_tag' => $tag, '_class' => $class, 'html' => $html];
            continue;
        }
        $h = trim((string) $h);
        if ($h !== '' && st_cms_strip($h) !== '') $out[] = $h;
    }
    return $out;
}

function st_cms_class_attr(string $class): string
{
    $bits = [];
    foreach (preg_split('/\s+/', trim($class)) ?: [] as $c) {
        if ($c !== '' && preg_match('/^[a-zA-Z][a-zA-Z0-9_-]*$/', $c)) $bits[] = $c;
    }
    return $bits === [] ? '' : ' class="' . implode(' ', $bits) . '"';
}

function st_cms_emit_new_sibling(mixed $h, array $f, callable $clean): string
{
    if (is_array($h) && isset($h['_list'])) {
        return st_cms_render_list((string) $h['_list'], (array) ($h['items'] ?? []), $clean);
    }
    if (is_array($h) && isset($h['_tag'])) {
        $tag = $h['_tag'] === 'li' ? 'li' : 'p';
        $inner = $clean((string) ($h['html'] ?? ''));
        if ($inner === '' || st_cms_strip($inner) === '') return '';
        return '<' . $tag . st_cms_class_attr((string) ($h['_class'] ?? '')) . '>' . $inner . '</' . $tag . '>';
    }
    $html = is_array($h) ? (string) ($h['html'] ?? '') : (string) $h;
    $open = st_cms_sibling_open((string) $f['_open']);
    return $open . $clean($html) . '</' . $f['_tag'] . '>';
}

/** Opening tag for a new sibling: same tag and classes, without ids or editor data. */
function st_cms_sibling_open(string $open): string
{
    $open = preg_replace('/\s(?:id|data-[a-z0-9-]+)="[^"]*"/i', '', $open) ?? $open;
    return $open;
}

const ST_FORM_PARTIAL = ST_PARTIALS . '/formularz.html';
const ST_FOOTER_RE = '/(<footer class="ftr">)(.*?)(<\/footer>)/s';

/** [full file text, editable fragment] for a shared block (inquiry form / footer). */
function st_cms_shared_source(string $which): array
{
    if ($which === 'form') {
        $txt = is_file(ST_FORM_PARTIAL) ? (string) file_get_contents(ST_FORM_PARTIAL) : '';
        return [$txt, $txt];
    }
    if ($which === 'ftr') {
        $layout = (string) file_get_contents(ST_LAYOUT);
        return [$layout, preg_match(ST_FOOTER_RE, $layout, $m) ? $m[2] : ''];
    }
    throw new RuntimeException('Nieznany blok wspólny.');
}

function st_cms_extract_shared(): array
{
    $out = [];
    foreach (['form', 'ftr'] as $which) {
        try {
            [, $frag] = st_cms_shared_source($which);
        } catch (Throwable) {
            $frag = '';
        }
        $out[$which] = array_map('st_cms_public', st_cms_copy($frag, true));
    }
    return $out;
}

function st_cms_mark_shared(string $frag, string $which): string
{
    $ins = [];
    foreach (st_cms_copy($frag, true) as $c) $ins[] = [(int) $c['_s'] - 1, ' data-cms-shared="' . $which . ':' . $c['i'] . '"'];
    usort($ins, static fn(array $a, array $b): int => $b[0] <=> $a[0]);
    foreach ($ins as [$pos, $text]) $frag = substr($frag, 0, $pos) . $text . substr($frag, $pos);
    return $frag;
}

/** Write edited form / footer texts back to the partial and the layout. */
function st_cms_patch_shared(array $data): array
{
    $changed = [];
    if (isset($data['form']) && is_array($data['form']) && $data['form'] !== [] && is_file(ST_FORM_PARTIAL)) {
        [$txt] = st_cms_shared_source('form');
        $new = st_cms_patch_copy($txt, $data['form'], true);
        if ($new !== $txt) {
            file_put_contents(ST_FORM_PARTIAL, $new);
            $changed[] = 'form';
        }
    }
    if (isset($data['ftr']) && is_array($data['ftr']) && $data['ftr'] !== []) {
        [$layout, $frag] = st_cms_shared_source('ftr');
        if ($frag !== '') {
            $newFrag = st_cms_patch_copy($frag, $data['ftr'], true);
            if ($newFrag !== $frag && preg_match(ST_FOOTER_RE, $layout, $m, PREG_OFFSET_CAPTURE)) {
                $layout = substr($layout, 0, $m[2][1]) . $newFrag . substr($layout, $m[2][1] + strlen($m[2][0]));
                file_put_contents(ST_LAYOUT, $layout);
                $changed[] = 'ftr';
                if (preg_match('/<div class="ftr__brand">.*?<p>(.*?)<\/p>/s', $newFrag, $bm)) {
                    $st = st_cms_settings();
                    $txt = st_cms_strip($bm[1]);
                    if ($txt !== '' && $txt !== ($st['footer'] ?? '')) {
                        $st['footer'] = $txt;
                        if (!is_dir(dirname(ST_SETTINGS))) mkdir(dirname(ST_SETTINGS), 0755, true);
                        file_put_contents(ST_SETTINGS, json_encode($st, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
                    }
                }
            }
        }
    }
    return ['changed' => $changed];
}

function st_cms_norm_crop($val): string
{
    $s = trim((string) $val);
    if (!preg_match('/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/', $s, $m)) {
        return '';
    }
    $x = max(0, min(100, (float) $m[1]));
    $y = max(0, min(100, (float) $m[2]));
    $z = max(1, min(3, (float) $m[3]));
    return sprintf('%.1f,%.1f,%.3f', $x, $y, $z);
}

function st_cms_apply_crop_to_tag(string $tag, string $crop): string
{
    $tag = preg_replace('/\sdata-st-crop="[^"]*"/', '', $tag) ?? $tag;
    $style = '';
    if (preg_match('/\sstyle="([^"]*)"/', $tag, $sm, PREG_OFFSET_CAPTURE)) {
        $style = $sm[1][0];
        $tag = substr($tag, 0, (int) $sm[0][1]) . substr($tag, (int) $sm[0][1] + strlen($sm[0][0]));
    }
    $style = preg_replace('/--st-(?:x|y|z)\s*:[^;]*;?/', '', $style) ?? $style;
    $style = trim(preg_replace('/\s*;+\s*/', ';', $style) ?? $style, " ;");
    $ins = '';
    if ($crop !== '') {
        [$x, $y, $z] = explode(',', $crop);
        $ins .= ' data-st-crop="' . $crop . '"';
        $bits = $style !== '' ? [$style] : [];
        $bits[] = "--st-x:{$x}%;--st-y:{$y}%;--st-z:{$z}";
        $ins .= ' style="' . implode(';', $bits) . '"';
    } elseif ($style !== '') {
        $ins .= ' style="' . $style . '"';
    }
    if (str_starts_with(strtolower($tag), '<img')) {
        return substr($tag, 0, 4) . $ins . substr($tag, 4);
    }
    return $tag;
}

function st_cms_img_kind(string $body, int $pos): string
{
    $ctx = substr($body, max(0, $pos - 900), 900);
    $last = strrpos($ctx, '<section');
    $chunk = $last === false ? $ctx : substr($ctx, $last);
    if (str_contains($chunk, 'hero') && (
        str_contains($chunk, 'hero__bg') || str_contains($chunk, 'hero__shot')
        || str_contains($chunk, 'hero__emerge') || str_contains($chunk, 'hero--')
    )) return 'hero';
    if (str_contains($chunk, 'class="tile') || str_contains($chunk, "class='tile")) return 'tile';
    if (str_contains($chunk, 'class="area')) return 'area';
    return 'photo';
}

function st_cms_images(string $body): array
{
    $items = [];
    if (!preg_match_all('/<img\s([^>]*?)>/si', $body, $mm, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
        return $items;
    }
    foreach ($mm as $m) {
        $attrs = $m[1][0];
        if (!preg_match('/src="([^"]+)"/', $attrs, $sm)) continue;
        $raw = $sm[1];
        $src = explode('?', $raw, 2)[0];
        if (!str_starts_with($src, '/assets/img/')) continue;
        $low = strtolower($src);
        $skip = false;
        foreach (['/yt/', 'favicon', 'apple-touch', 'icon-192', 'icon-512'] as $x) {
            if (str_contains($low, $x)) { $skip = true; break; }
        }
        if ($skip) continue;
        $pos = (int) $m[0][1];
        $webp = '';
        $webpRaw = '';
        $look = substr($body, max(0, $pos - 420), min(420, $pos));
        if (preg_match('/<source[^>]*srcset="([^"]+)"[^>]*>\s*$/si', $look, $pm)) {
            $webpRaw = $pm[1];
            $webp = explode('?', $webpRaw, 2)[0];
        }
        $alt = preg_match('/alt="([^"]*)"/', $attrs, $am) ? $am[1] : '';
        $crop = preg_match('/data-st-crop="([^"]*)"/', $attrs, $cm) ? st_cms_norm_crop($cm[1]) : '';
        $items[] = [
            'i' => count($items),
            'kind' => st_cms_img_kind($body, $pos),
            'src' => $src,
            'webp' => $webp,
            'alt' => $alt,
            'crop' => $crop,
            'section' => st_cms_section_before($body, $pos),
            'caption' => st_cms_caption_near($body, $pos),
            '_src_raw' => $raw,
            '_webp_raw' => $webpRaw,
            '_pos' => $pos,
            '_end' => $pos + strlen($m[0][0]),
        ];
    }
    return $items;
}

/** Inject data-cms-* markers so the visual editor can map DOM nodes to CMS items. */
function st_cms_mark_body(string $body): string
{
    $ins = [];
    foreach (st_cms_copy($body) as $c) $ins[] = [(int) $c['_s'] - 1, ' data-cms-copy="' . $c['i'] . '"'];
    foreach (st_cms_images($body) as $im) $ins[] = [(int) $im['_pos'] + strlen('<img'), ' data-cms-img="' . $im['i'] . '"'];
    if (preg_match_all('/<article class="mach\b[^"]*"/', $body, $mm, PREG_OFFSET_CAPTURE)) {
        foreach ($mm[0] as $i => $m) $ins[] = [(int) $m[1] + strlen('<article'), ' data-cms-mach="' . $i . '"'];
    }
    if (preg_match_all('/<a class="tile\b/', $body, $mm, PREG_OFFSET_CAPTURE)) {
        foreach ($mm[0] as $i => $m) $ins[] = [(int) $m[1] + strlen('<a'), ' data-cms-tile="' . $i . '"'];
    }
    if (preg_match_all('/<article class="film-rail__i\b/', $body, $mm, PREG_OFFSET_CAPTURE)) {
        foreach ($mm[0] as $i => $m) $ins[] = [(int) $m[1] + strlen('<article'), ' data-cms-film="' . $i . '"'];
    }
    if (preg_match_all('/<details>\s*<summary>(.*?)<\/summary>\s*<div class="faq__a">(.*?)<\/div>\s*<\/details>/s', $body, $mm, PREG_OFFSET_CAPTURE)) {
        foreach ($mm[0] as $i => $m) $ins[] = [(int) $m[1] + strlen('<details'), ' data-cms-faq="' . $i . '"'];
    }
    if (preg_match_all('/<article class="pcard pcard--contact[^"]*"/', $body, $mm, PREG_OFFSET_CAPTURE)) {
        foreach ($mm[0] as $i => $m) $ins[] = [(int) $m[1] + strlen('<article'), ' data-cms-person="' . $i . '"'];
    }
    usort($ins, static fn(array $a, array $b): int => $b[0] <=> $a[0]);
    foreach ($ins as [$pos, $text]) {
        $body = substr($body, 0, $pos) . $text . substr($body, $pos);
    }
    return $body;
}

/**
 * The public file is what the homepage shows. Use it for the editor when the
 * block structure still matches the source, so colors and text already on the
 * site are what the admin opens — even if the source file lagged behind.
 */
function st_cms_body_from_public_html(string $html, string $sourceBody): ?string
{
    if (!preg_match('/<main\b[^>]*\bid="main"[^>]*>(.*)<\/main>/s', $html, $m)) return null;
    $live = $m[1];
    if (str_contains($sourceBody, '{{FORMULARZ}}')) {
        $swapped = preg_replace('/<section\b[^>]*\bid="zapyt"[^>]*>.*?<\/section>/s', '{{FORMULARZ}}', $live, 1);
        if (!is_string($swapped) || !str_contains($swapped, '{{FORMULARZ}}')) return null;
        $live = $swapped;
    }
    $src = st_cms_copy($sourceBody);
    $got = st_cms_copy($live);
    $srcKinds = array_map(static fn(array $c): string => (string) $c['kind'], $src);
    $gotKinds = array_map(static fn(array $c): string => (string) $c['kind'], $got);
    if ($srcKinds === [] || $srcKinds !== $gotKinds) return null;
    if (count(st_cms_images($sourceBody)) !== count(st_cms_images($live))) return null;
    return $live;
}

function st_cms_live_body(array $meta, string $sourceBody): string
{
    $rel = str_replace('\\', '/', (string) ($meta['out'] ?? ''));
    if ($rel === '' || str_contains($rel, '..') || str_starts_with($rel, '/')) return $sourceBody;
    $path = ST_ROOT . '/' . $rel;
    if (!is_file($path)) return $sourceBody;
    $live = st_cms_body_from_public_html((string) file_get_contents($path), $sourceBody);
    return $live ?? $sourceBody;
}

/** Changes whenever the page source, its public file or the language overlay is rewritten. */
function st_cms_page_stamp(string $id): string
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) return '';
    clearstatcache();
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) return '';
    $parts = [];
    $files = [$path, ST_ROOT . '/assets/js/nakladka-jezyk.js', ST_LAYOUT, ST_FORM_PARTIAL];
    try {
        [$meta] = st_cms_parse((string) file_get_contents($path));
        $rel = str_replace('\\', '/', (string) ($meta['out'] ?? ''));
        if ($rel !== '' && !str_contains($rel, '..')) $files[] = ST_ROOT . '/' . ltrim($rel, '/');
    } catch (Throwable) {
    }
    foreach ($files as $f) $parts[] = is_file($f) ? filemtime($f) . ':' . filesize($f) : '-';
    return substr(sha1(implode('|', $parts)), 0, 16);
}

function st_cms_preview(string $id): string
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    [$meta, $body] = st_cms_parse((string) file_get_contents($path));
    $body = st_cms_live_body($meta, $body);
    [$layout, $partials, $ld] = st_cms_render_ctx();
    // Shared blocks (inquiry form, dark footer) are editable too — marked with their own index space.
    if (isset($partials['{{FORMULARZ}}'])) $partials['{{FORMULARZ}}'] = st_cms_mark_shared($partials['{{FORMULARZ}}'], 'form');
    if (preg_match(ST_FOOTER_RE, $layout, $fm, PREG_OFFSET_CAPTURE)) {
        $layout = substr($layout, 0, $fm[2][1]) . st_cms_mark_shared($fm[2][0], 'ftr') . substr($layout, $fm[2][1] + strlen($fm[2][0]));
    }
    $html = st_cms_render_page($meta, st_cms_mark_body($body), $layout, $partials, $ld, basename($path));
    $html = preg_replace('/<script\b[^>]*\bsrc="[^"]*"[^>]*>\s*<\/script>\s*/', '', $html) ?? $html;
    // No background video downloads in the editor: poster only.
    $html = preg_replace_callback('/<video\b([^>]*)>/', static function (array $m): string {
        $attrs = preg_replace('/\s+(?:autoplay|preload="[^"]*")/', '', $m[1]) ?? $m[1];
        return '<video' . $attrs . ' preload="none">';
    }, $html) ?? $html;
    $p = strpos($html, '<html');
    if ($p !== false) $html = substr_replace($html, '<html data-st-i18n="off" data-cms-edit="1"', $p, strlen('<html'));
    return $html;
}

function st_cms_ext_mime(string $url): string
{
    $ext = strtolower(pathinfo(explode('?', $url, 2)[0], PATHINFO_EXTENSION));
    return [
        'webp' => 'image/webp',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ][$ext] ?? 'image/jpeg';
}

function st_cms_replace_src(string $body, string $old, string $new): string
{
    if ($old === '' || $new === '' || $old === $new) return $body;
    $body = str_replace('src="' . $old . '"', 'src="' . $new . '"', $body);
    $body = str_replace('srcset="' . $old . '"', 'srcset="' . $new . '"', $body);
    if (!str_contains($old, '?')) {
        $body = preg_replace(
            '/(src|srcset)="' . preg_quote($old, '/') . '(\?[^"]*)?"/',
            '$1="' . $new . '"',
            $body
        ) ?? $body;
    }
    return $body;
}

function st_cms_patch_images(string $body, ?array $items): string
{
    if (!is_array($items) || $items === []) return $body;
    $found = st_cms_images($body);
    $n = min(count($found), count($items));
    for ($i = $n - 1; $i >= 0; $i--) {
        $new = trim((string) ($items[$i]['src'] ?? ''));
        if ($new === '') continue;
        $old = $found[$i]['src'];
        $oldRaw = $found[$i]['_src_raw'] ?: $old;
        $webpRaw = $found[$i]['_webp_raw'] ?? '';
        $newBase = explode('?', $new, 2)[0];
        if ($newBase === $old && $newBase === explode('?', $oldRaw, 2)[0]) continue;
        $body = st_cms_replace_src($body, $oldRaw, $new);
        if ($oldRaw !== $old) $body = st_cms_replace_src($body, $old, $new);
        if ($webpRaw !== '') {
            $body = st_cms_replace_src($body, $webpRaw, $new);
            $mime = st_cms_ext_mime($new);
            $body = preg_replace(
                '/(<source\b[^>]*type=")[^"]+("[^>]*srcset="' . preg_quote($new, '/') . '")/',
                '$1' . $mime . '$2',
                $body,
                1
            ) ?? $body;
            $body = preg_replace(
                '/(<source\b[^>]*srcset="' . preg_quote($new, '/') . '"[^>]*type=")[^"]+/',
                '$1' . $mime,
                $body,
                1
            ) ?? $body;
        }
    }
    $found2 = st_cms_images($body);
    $n2 = min(count($found2), count($items));
    for ($i = $n2 - 1; $i >= 0; $i--) {
        if (!array_key_exists('crop', $items[$i])) continue;
        $crop = st_cms_norm_crop($items[$i]['crop'] ?? '');
        if ($crop === (string) ($found2[$i]['crop'] ?? '')) continue;
        $s = (int) $found2[$i]['_pos'];
        $e = (int) $found2[$i]['_end'];
        $body = substr($body, 0, $s) . st_cms_apply_crop_to_tag(substr($body, $s, $e - $s), $crop) . substr($body, $e);
    }
    return $body;
}

function st_cms_public(array $row): array
{
    $out = [];
    foreach ($row as $k => $v) {
        if (!str_starts_with((string) $k, '_')) $out[$k] = $v;
    }
    return $out;
}

/** Representative picture of a page: its hero image, else the first real photo, else the OG image. */
function st_cms_page_thumb(array $meta, string $body): string
{
    $hero = st_cms_hero($body);
    if (!empty($hero['image'])) return (string) $hero['image'];
    foreach (st_cms_images($body) as $im) {
        if (in_array($im['kind'] ?? '', ['hero', 'tile', 'photo', 'area'], true)) return (string) $im['src'];
    }
    if (preg_match('~<img[^>]*\ssrc="(/assets/img/(?!yt/)[^"?]+)~', $body, $mm)) return $mm[1];
    $og = trim((string) ($meta['og'] ?? ''));
    if ($og !== '') return str_starts_with($og, '/') ? $og : '/assets/img/' . $og;
    return '';
}

function st_cms_pages(): array
{
    $rows = [];
    foreach (glob(ST_PAGES . '/*.html') ?: [] as $file) {
        try {
            [$meta, $body] = st_cms_parse((string) file_get_contents($file));
        } catch (Throwable) {
            continue;
        }
        $base = basename($file);
        $kind = st_cms_kind($base, (string) ($meta['nav'] ?? ''));
            $img = st_cms_page_thumb($meta, $body);
            $rows[] = [
                'id' => pathinfo($base, PATHINFO_FILENAME),
                'file' => $base,
                'kind' => $kind,
                'kindLabel' => st_cms_kind_label($kind),
                'name' => st_cms_page_name($meta, $kind, pathinfo($base, PATHINFO_FILENAME)),
                'title' => $meta['title'] ?? pathinfo($base, PATHINFO_FILENAME),
                'url' => $meta['url'] ?? '',
                'parentUrl' => st_cms_parent_url((string) ($meta['url'] ?? ''), (string) ($meta['crumbs'] ?? '')),
                'nav' => $meta['nav'] ?? '',
                'added' => (($meta['added'] ?? '') === '1'),
                'og' => $meta['og'] ?? '',
                'image' => $img,
                'mach' => count(st_cms_mach($body)),
                'faq' => count(st_cms_faq($body)),
            ];
    }
    usort($rows, static fn($a, $b) => strcmp($a['id'], $b['id']));
    return st_cms_enrich_pages($rows);
}

function st_cms_get_page(string $id): array
{
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) {
        throw new RuntimeException('Nieprawidłowa strona.');
    }
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) {
        throw new RuntimeException('Nie znaleziono strony.');
    }
    [$meta, $body] = st_cms_parse((string) file_get_contents($path));
    $kind = st_cms_kind($id . '.html', (string) ($meta['nav'] ?? ''));
    $info = null;
    foreach (st_cms_pages() as $row) {
        if (($row['id'] ?? '') === $id) { $info = $row; break; }
    }
    return [
        'id' => $id,
        'file' => $id . '.html',
        'kind' => $kind,
        'kindLabel' => st_cms_kind_label($kind),
        'name' => st_cms_page_name($meta, $kind, $id),
        'parentName' => $info['parentName'] ?? '',
        'role' => $info['role'] ?? st_cms_page_role($kind, st_cms_parent_url((string) ($meta['url'] ?? ''), (string) ($meta['crumbs'] ?? ''))),
        'roleLabel' => $info['roleLabel'] ?? 'Strona',
        'roleHint' => $info['roleHint'] ?? '',
        'canDelete' => (bool) ($info['canDelete'] ?? false),
        'hasChildren' => (bool) ($info['hasChildren'] ?? false),
        'meta' => $meta,
        'hero' => st_cms_hero($body),
        'stats' => st_cms_stats($body),
        'areas' => st_cms_areas($body),
        'tiles' => function_exists('st_cms_tiles') ? st_cms_tiles($body) : [],
        'models' => function_exists('st_cms_extract_models') ? st_cms_extract_models($body) : null,
        'films' => function_exists('st_cms_extract_films') ? st_cms_extract_films($body) : [],
        'catalog' => function_exists('st_cms_catalog') ? st_cms_catalog($body) : [],
        'images' => array_map('st_cms_public', st_cms_images($body)),
        'copy' => array_map('st_cms_public', st_cms_copy($body)),
        'mach' => st_cms_mach($body),
        'faq' => st_cms_faq($body),
        'people' => st_cms_people($body),
        'shared' => st_cms_extract_shared(),
        'html' => rtrim($body, "\n") . "\n",
    ];
}

function st_cms_sub(string $src, string $pat, string $inner, int $count = 1): string
{
    return preg_replace_callback($pat, static fn($m) => $m[1] . $inner . $m[3], $src, $count) ?? $src;
}

function st_cms_patch_hero(string $body, ?array $hero): string
{
    if (!is_array($hero)) return $body;
    if (!preg_match('/(<section class="hero\b.*?<\/section>)/s', $body, $m, PREG_OFFSET_CAPTURE)) {
        return $body;
    }
    $block = $m[1][0];
    if (array_key_exists('eyebrow', $hero)) {
        $block = st_cms_sub($block, '/(<p class="eyebrow">)(.*?)(<\/p>)/s', st_cms_esc((string) $hero['eyebrow']));
    }
    if (array_key_exists('h1', $hero)) {
        $block = st_cms_sub($block, '/(<h1[^>]*>)(.*?)(<\/h1>)/s', (string) $hero['h1']);
    }
    if (array_key_exists('sub', $hero)) {
        $block = st_cms_sub($block, '/(<p class="hero__sub">)(.*?)(<\/p>)/s', (string) $hero['sub']);
    }
    if (!empty($hero['image'])) {
        $new = trim((string) $hero['image']);
        if ($new !== '' && preg_match('/<img src="([^"]+)"/', $block, $im)) {
            $block = st_cms_replace_src($block, $im[1], $new);
            if (preg_match('/<source[^>]*srcset="([^"]+)"/', $block, $sm)) {
                $block = st_cms_replace_src($block, $sm[1], $new);
                $mime = st_cms_ext_mime($new);
                $block = preg_replace('/(<source\b[^>]*type=")[^"]+/', '$1' . $mime, $block, 1) ?? $block;
            }
        }
    }
    return substr($body, 0, $m[1][1]) . $block . substr($body, $m[1][1] + strlen($m[1][0]));
}

function st_cms_render_mach(array $items): string
{
    $chunks = [];
    $delays = ['', ' rv-d1', ' rv-d2'];
    foreach ($items as $i => $it) {
        $idx = str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT);
        $delay = $delays[$i % 3];
        $vid = trim((string) ($it['video'] ?? ''));
        $img = trim((string) ($it['image'] ?? ''));
        $title = trim((string) ($it['title'] ?? ''));
        $vtitle = trim((string) ($it['videoTitle'] ?? $title));
        $desc = st_cms_clean_rich((string) ($it['html'] ?? ''));
        $ask = trim((string) ($it['ask'] ?? ''));
        if ($ask === '') $ask = ST_ASK_LABEL;
        $aid = preg_replace('/[^a-zA-Z0-9_-]+/', '-', trim((string) ($it['id'] ?? 'm' . ($i + 1)))) ?: ('m' . ($i + 1));
        $aid = trim($aid, '-') ?: ('m' . ($i + 1));
        $topic = st_cms_esc((string) ($it['topic'] ?? $title));
        if ($vid !== '') {
            $media = '          <div class="mach__film">
            <button class="yt" type="button" data-vid="' . st_cms_esc($vid) . '" data-title="' . st_cms_esc($vtitle) . '" aria-label="Дивитись відео: ' . st_cms_esc($vtitle) . '">
              <img src="/assets/img/yt/' . st_cms_esc($vid) . '.jpg" alt="' . st_cms_esc($vtitle) . '" width="640" height="360" loading="lazy" decoding="async">
              {{YT_PLAY}}
            </button>
          </div>';
        } elseif ($img !== '') {
            $media = '          <div class="mach__film mach__film--img">
            <img class="mach__pic" src="' . st_cms_esc($img) . '" alt="' . st_cms_esc($title) . '" width="640" height="360" loading="lazy" decoding="async">
          </div>';
        } else {
            $media = '          <div class="mach__film mach__film--empty" aria-hidden="true"></div>';
        }
        $chunks[] = '
      <article class="mach mach--clip mach--prod rv' . $delay . '" id="' . st_cms_esc($aid) . '" data-ask-topic="' . $topic . '">
        <div class="mach__side">
          <p class="mach__idx">' . $idx . '</p>
          <h3>' . st_cms_esc($title) . '</h3>
' . $media . '
          <p class="mach__links">
            <a class="arrow-link" href="#zapyt">' . st_cms_esc($ask) . '
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </p>
        </div>
        <div class="mach__text">' . $desc . '</div>
      </article>';
    }
    return implode("\n", $chunks) . "\n";
}

function st_cms_product_section(string $itemsHtml): string
{
    return "\n" . '<section class="sec sec-paper" id="' . ST_PRODUCT_SECTION_ID . '">' . "\n"
        . '  <div class="wrap">' . "\n"
        . '    <div class="sec-head sec-head-wide rv">' . "\n"
        . '      <p class="eyebrow">Продукти</p>' . "\n"
        . '      <h2 class="h-lg">Наші продукти</h2>' . "\n"
        . '      <p class="lead">Оберіть конфігурацію та запитайте про пропозицію — підберемо рішення під вашу деталь.</p>' . "\n"
        . "    </div>\n\n"
        . '    <div class="mach-list">' . "\n"
        . $itemsHtml
        . "    </div>\n"
        . "  </div>\n"
        . "</section>\n";
}

function st_cms_patch_mach(string $body, ?array $items): string
{
    if (!is_array($items)) return $body;
    $open = '<div class="mach-list">';
    $start = strpos($body, $open);
    $end = $start === false ? null : st_cms_div_end($body, $start + strlen($open));
    if ($start === false || $end === null) {
        if ($items === []) return $body;
        $section = st_cms_product_section(st_cms_render_mach($items));
        $tok = strpos($body, '{{FORMULARZ}}');
        if ($tok !== false) return rtrim(substr($body, 0, $tok), "\n") . "\n" . $section . "\n" . substr($body, $tok);
        return rtrim($body, "\n") . "\n" . $section;
    }
    return substr($body, 0, $start) . $open . "\n" . st_cms_render_mach($items) . '    </div>' . substr($body, $end);
}

function st_cms_patch_faq(string $body, ?array $items): string
{
    if (!is_array($items)) return $body;
    if (!preg_match('/<div class="faq\b[^"]*">/', $body, $m, PREG_OFFSET_CAPTURE)) {
        return $body;
    }
    $open = $m[0][0];
    $start = (int) $m[0][1];
    $end = st_cms_div_end($body, $start + strlen($open));
    if ($end === null) return $body;
    [$extra, $skip] = st_cms_orphan_details(substr($body, $end));
    $bits = [];
    foreach ($items as $it) {
        $q = st_cms_esc((string) ($it['q'] ?? ''));
        $a = (string) ($it['a'] ?? '');
        if (!str_starts_with(trim($a), '<')) $a = '<p>' . $a . '</p>';
        $bits[] = "      <details>\n        <summary>{$q}</summary>\n        <div class=\"faq__a\">{$a}</div>\n      </details>";
    }
    return substr($body, 0, $start) . $open . "\n" . implode("\n", $bits) . "\n    </div>" . substr($body, $end + $skip);
}

function st_cms_patch_people(string $body, ?array $items): string
{
    if (!is_array($items) || $items === []) return $body;
    if (!preg_match_all('/<article class="pcard pcard--contact[^"]*">.*?<\/article>/s', $body, $mm, PREG_OFFSET_CAPTURE)) {
        return $body;
    }
    $n = min(count($mm[0]), count($items));
    for ($i = $n - 1; $i >= 0; $i--) {
        $inner = $mm[0][$i][0];
        $it = $items[$i];
        if (isset($it['role'])) {
            $inner = st_cms_sub($inner, '/(<span class="pcard__role">)(.*?)(<\/span>)/s', st_cms_esc((string) $it['role']));
        }
        if (isset($it['name'])) {
            $inner = st_cms_sub($inner, '/(<h3>)(.*?)(<\/h3>)/s', st_cms_esc((string) $it['name']));
        }
        if (!empty($it['email'])) {
            $em = trim((string) $it['email']);
            $inner = preg_replace('/mailto:[^"]+/', 'mailto:' . $em, $inner, 1) ?? $inner;
            $inner = preg_replace('/(mailto:[^"]+">)([^<]+)/', '$1' . st_cms_esc($em), $inner, 1) ?? $inner;
        }
        $phones = $it['phones'] ?? [];
        if (is_array($phones) && preg_match_all('/<a href="tel:[^"]+">[^<]+<\/a>/', $inner, $pm, PREG_OFFSET_CAPTURE)) {
            for ($j = count($pm[0]) - 1; $j >= 0; $j--) {
                if (!isset($phones[$j])) continue;
                $ph = (string) $phones[$j];
                $tel = preg_replace('/[^\d+]/', '', $ph) ?? $ph;
                $inner = substr($inner, 0, $pm[0][$j][1]) . '<a href="tel:' . $tel . '">' . st_cms_esc($ph) . '</a>' . substr($inner, $pm[0][$j][1] + strlen($pm[0][$j][0]));
            }
        }
        $body = substr($body, 0, $mm[0][$i][1]) . $inner . substr($body, $mm[0][$i][1] + strlen($mm[0][$i][0]));
    }
    return $body;
}

function st_cms_default_settings(): array
{
    return [
        'phone' => '+48 71 321 54 27',
        'phoneTel' => '+48713215427',
        'email' => 'biuro@smoltech.pl',
        'addressShort' => 'Mokronos Dolny, Польща',
        'addressLine' => 'st. Przyjazna 2, 55-080 Mokronos Dolny, Польща',
        'company' => 'SMOLTECH Technika Zgrzewalnicza Sp. z o. o.',
        'youtube' => 'https://www.youtube.com/user/SMOLTECH/videos',
        'instagram' => 'https://www.instagram.com/smoltech_resistance_welding',
        'footer' => 'Проєктуємо та виробляємо машини контактного зварювання, автоматизовані й роботизовані зварювальні комплекси та технологічні лінії для металообробної й автомобільної промисловості.',
    ];
}

function st_cms_settings(): array
{
    $out = st_cms_default_settings();
    if (is_file(ST_SETTINGS)) {
        $raw = json_decode((string) file_get_contents(ST_SETTINGS), true);
        if (is_array($raw)) {
            foreach ($out as $k => $_) {
                if (isset($raw[$k])) $out[$k] = (string) $raw[$k];
            }
        }
    }
    return $out;
}

function st_cms_replace_files(string $old, string $new, array $files): void
{
    if ($old === '' || $old === $new) return;
    foreach ($files as $path) {
        if (!is_file($path)) continue;
        $txt = (string) file_get_contents($path);
        if (str_contains($txt, $old)) {
            file_put_contents($path, str_replace($old, $new, $txt));
        }
    }
}

function st_cms_partials(): array
{
    $out = [];
    foreach (glob(ST_PARTIALS . '/*.html') ?: [] as $f) {
        $token = '{{' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '_', basename($f, '.html')) ?? '') . '}}';
        $out[$token] = trim((string) file_get_contents($f));
    }
    return $out;
}

function st_cms_render_ctx(): array
{
    $layout = (string) file_get_contents(ST_LAYOUT);
    $partials = st_cms_partials();
    $st = st_cms_settings();
    $email = json_encode($st['email'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $tel = json_encode($st['phoneTel'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $yt = json_encode($st['youtube'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ig = json_encode($st['instagram'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ld = '{"@context":"https://schema.org","@graph":['
        . '{"@type":["Organization","Manufacturer"],"@id":"https://smoltech.com.ua/#org",'
        . '"name":"SMOLTECH Technika Zgrzewalnicza Sp. z o. o.","alternateName":"SMOLTECH",'
        . '"url":"https://smoltech.com.ua/",'
        . '"logo":{"@type":"ImageObject","url":"https://smoltech.com.ua/assets/img/logo.png","width":1181,"height":780},'
        . '"image":"https://smoltech.com.ua/assets/img/og-default.jpg",'
        . '"description":"Виробник машин контактного зварювання: точкові, рельєфні та багатоточкові машини, автоматизовані й роботизовані зварювальні комплекси, машини для зварювання сіток та обладнання для приварювання шпильок.",'
        . '"email":' . $email . ',"telephone":' . $tel . ',"faxNumber":"","vatID":"PL8971804142","taxID":"8971804142","foundingDate":"2015",'
        . '"address":{"@type":"PostalAddress","streetAddress":"st. Przyjazna 2","addressLocality":"Mokronos Dolny","postalCode":"55-080","addressRegion":"Dolnośląskie","addressCountry":"PL"},'
        . '"geo":{"@type":"GeoCoordinates","latitude":51.0720771,"longitude":16.9260533},'
        . '"areaServed":[{"@type":"Country","name":"Україна"},{"@type":"Country","name":"Polska"}],'
        . '"knowsLanguage":["uk","pl","en"],'
        . '"sameAs":["https://www.smoltech.pl",' . $yt . ',' . $ig . '],'
        . '"contactPoint":[{"@type":"ContactPoint","telephone":' . $tel . ',"email":' . $email . ',"contactType":"sales","availableLanguage":["uk","pl","en"]}]},'
        . '{"@type":"WebSite","@id":"https://smoltech.com.ua/#website","url":"https://smoltech.com.ua/",'
        . '"name":"SMOLTECH — машини контактного зварювання","inLanguage":"uk-UA","publisher":{"@id":"https://smoltech.com.ua/#org"}}'
        . ']}';
    return [$layout, $partials, $ld];
}

function st_cms_ld_script(array $obj): string
{
    $json = json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) $json = '{}';
    return '<script type="application/ld+json">' . str_replace('<', '\u003c', $json) . '</script>';
}

function st_cms_crumbs_ld(string $spec, string $url): string
{
    $spec = trim($spec);
    if ($spec === '') return '';
    $items = [['name' => 'Головна', 'url' => '/']];
    foreach (preg_split('/\s*\|\s*/', $spec) as $part) {
        if (str_contains($part, '>>')) {
            [$n, $u] = explode('>>', $part, 2);
            $items[] = ['name' => trim($n), 'url' => trim($u)];
        } else {
            $items[] = ['name' => trim($part), 'url' => null];
        }
    }
    $els = [];
    $n = count($items);
    for ($i = 0; $i < $n; $i++) {
        $last = $i === $n - 1;
        $itemUrl = ST_SITE . ($last ? $url : (string) ($items[$i]['url'] ?? $url));
        $els[] = [
            '@type' => 'ListItem',
            'position' => $i + 1,
            'name' => $items[$i]['name'],
            'item' => $itemUrl,
        ];
    }
    return st_cms_ld_script([
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        '@id' => ST_SITE . $url . '#breadcrumb',
        'itemListElement' => $els,
    ]);
}

function st_cms_webpage_ld(array $meta, string $body, string $modified = ''): string
{
    $url = ST_SITE . $meta['url'];
    $h1 = '';
    if (preg_match('/<h1[^>]*>(.*?)<\/h1>/s', $body, $m)) $h1 = st_cms_strip($m[1]);
    $collection = (bool) preg_match('/class="(?:tile|choice__card)\b/', $body);
    $obj = [
        '@context' => 'https://schema.org',
        '@type' => $collection ? ['WebPage', 'CollectionPage'] : 'WebPage',
        '@id' => $url . '#webpage',
        'url' => $url,
        'name' => $meta['title'],
        'description' => $meta['desc'],
        'inLanguage' => 'uk-UA',
        'isPartOf' => ['@id' => ST_SITE . '/#website'],
        'about' => ['@id' => ST_SITE . '/#org'],
        'publisher' => ['@id' => ST_SITE . '/#org'],
        'primaryImageOfPage' => [
            '@type' => 'ImageObject',
            'url' => ST_SITE . '/assets/img/' . ($meta['og'] ?? 'og-default.jpg'),
        ],
    ];
    if ($h1 !== '') $obj['headline'] = $h1;
    if ($modified !== '') $obj['dateModified'] = $modified;
    if (!empty($meta['crumbs'])) $obj['breadcrumb'] = ['@id' => $url . '#breadcrumb'];
    return st_cms_ld_script($obj);
}

function st_cms_render_page(array $meta, string $body, string $layout, array $partials, string $ld, string $name = '', string $modified = ''): string
{
    $navKeys = ['company','machines','studs','video','contact'];
    foreach (['out','url','title','desc'] as $req) {
        if (empty($meta[$req])) throw new RuntimeException($name . ": brak pola '$req'.");
    }
    $alt = '<link rel="alternate" hreflang="uk" href="' . ST_SITE . $meta['url'] . '">';
    if (!empty($meta['pl'])) $alt .= "\n" . '<link rel="alternate" hreflang="pl" href="' . $meta['pl'] . '">';
    $alt .= "\n" . '<link rel="alternate" hreflang="x-default" href="' . ST_SITE . $meta['url'] . '">';
    $content = trim($body);
    foreach ($partials as $tok => $val) $content = str_replace($tok, $val, $content);
    $content = st_cms_seo_tune($content);
    $content = preg_replace('/\s*<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?<\/script>/s', '', $content) ?? $content;
    $head = (string) ($meta['head'] ?? '');
    $robots = (($meta['noindex'] ?? '') === 'true')
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    $canon = str_contains($head, 'rel="canonical"')
        ? ''
        : '<link rel="canonical" href="' . ST_SITE . $meta['url'] . '">';
    $html = $layout;
    $html = str_replace('{{TITLE}}', st_cms_esc($meta['title']), $html);
    $html = str_replace('{{DESC}}', st_cms_esc($meta['desc']), $html);
    $html = str_replace('{{URL}}', $meta['url'], $html);
    $html = str_replace('{{ALT}}', $alt, $html);
    $html = str_replace('{{ROBOTS}}', $robots, $html);
    $html = str_replace('{{CANON}}', $canon, $html);
    $html = str_replace('{{OG_LOCALE_ALT}}', empty($meta['pl']) ? '' : "<meta property=\"og:locale:alternate\" content=\"pl_PL\">\n", $html);
    $html = str_replace('{{OG}}', $meta['og'] ?? 'og-default.jpg', $html);
    $html = str_replace('{{OGTYPE}}', $meta['ogtype'] ?? 'website', $html);
    $html = str_replace('{{OGTITLE}}', st_cms_esc($meta['ogtitle'] ?? $meta['title']), $html);
    $html = str_replace('{{HEAD}}', $head, $html);
    $html = str_replace('{{LD_ORG}}', $ld, $html);
    $html = str_replace(
        '{{LD_CRUMBS}}',
        st_cms_crumbs_ld((string) ($meta['crumbs'] ?? ''), $meta['url'])
            . st_cms_webpage_ld($meta, $content, $modified)
            . st_cms_child_itemlist_ld($content)
            . st_cms_faq_ld(st_cms_faq($content)),
        $html
    );
    $html = str_replace('{{CRUMBS}}', '', $html);
    $html = str_replace('{{CONTENT}}', $content, $html);
    $active = $meta['nav'] ?? '';
    $html = str_replace('{{BODY_CLASS}}', $active !== '' ? 'page-' . $active : 'page', $html);
    foreach ($navKeys as $k) {
        $html = str_replace('{{NAV_' . $k . '}}', $k === $active ? ' is-active' : '', $html);
    }
    $stamp = (string) time();
    $html = preg_replace('/(?:i18n-cms|nakladka-jezyk)\.js\?v=[^"\']+/', 'nakladka-jezyk.js?v=' . $stamp, $html) ?? $html;
    $html = preg_replace('/tlumaczenia\.js\?v=[^"\']+/', 'tlumaczenia.js?v=' . $stamp, $html) ?? $html;
    $html = preg_replace('/strona\.js\?v=[^"\']+/', 'strona.js?v=' . $stamp, $html) ?? $html;
    $html = preg_replace('/strona\.css\?v=[^"\']+/', 'strona.css?v=' . $stamp, $html) ?? $html;
    return $html;
}

function st_cms_empty_pending(): array
{
    return ['pending' => false, 'since' => '', 'notes' => [], 'removedOuts' => []];
}

function st_cms_load_pending(): array
{
    $state = st_cms_empty_pending();
    if (!is_file(ST_PENDING)) return $state;
    $raw = json_decode((string) file_get_contents(ST_PENDING), true);
    if (!is_array($raw)) return $state;
    $state['pending'] = (bool) ($raw['pending'] ?? false);
    $state['since'] = (string) ($raw['since'] ?? '');
    $state['notes'] = [];
    foreach (is_array($raw['notes'] ?? null) ? $raw['notes'] : [] as $n) $state['notes'][] = (string) $n;
    $state['removedOuts'] = [];
    foreach (is_array($raw['removedOuts'] ?? null) ? $raw['removedOuts'] : [] as $n) $state['removedOuts'][] = (string) $n;
    return $state;
}

function st_cms_pending_info(): array
{
    $st = st_cms_load_pending();
    return ['pending' => (bool) ($st['pending'] ?? false), 'since' => (string) ($st['since'] ?? '')];
}

function st_cms_with_pending(array $out): array
{
    return $out + st_cms_pending_info();
}

function st_cms_write_pending(array $st): void
{
    $dir = dirname(ST_PENDING);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents(ST_PENDING, json_encode($st, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
}

function st_cms_mark_pending(string $note = '', ?string $removedOut = null): array
{
    $st = st_cms_load_pending();
    if (empty($st['pending'])) {
        $st['pending'] = true;
        $st['since'] = gmdate('Y-m-d\TH:i:s\Z');
    }
    if ($note !== '') {
        $st['notes'][] = $note;
        $st['notes'] = array_slice($st['notes'], -40);
    }
    if ($removedOut !== null && $removedOut !== '') {
        $rel = ltrim(str_replace('\\', '/', $removedOut), '/');
        if ($rel !== '' && !in_array($rel, $st['removedOuts'], true)) $st['removedOuts'][] = $rel;
    }
    st_cms_write_pending($st);
    return $st;
}

function st_cms_clear_pending(): void
{
    $empty = st_cms_empty_pending();
    if (is_file(ST_PENDING) && st_cms_load_pending() == $empty) return;
    st_cms_write_pending($empty);
}

function st_cms_safe_public_out(string $rel): ?string
{
    $rel = ltrim(str_replace('\\', '/', $rel), '/');
    if ($rel === '' || in_array($rel, ['index.html', 'sitemap.xml', 'robots.txt'], true)) return null;
    $parts = array_values(array_filter(explode('/', $rel), static fn($p) => $p !== ''));
    if ($parts === [] || in_array('.', $parts, true) || in_array('..', $parts, true)) return null;
    if (in_array($parts[0], ['assets', '_src', '_private', '_build', 'panel', '_backup'], true)) return null;
    $path = ST_ROOT . '/' . implode('/', $parts);
    $root = realpath(ST_ROOT);
    if ($root === false) return null;
    $dir = realpath(dirname($path));
    if ($dir === false) return null;
    $rootNorm = strtolower(str_replace('\\', '/', $root));
    $dirNorm = strtolower(str_replace('\\', '/', $dir));
    if ($dirNorm !== $rootNorm && !str_starts_with($dirNorm, $rootNorm . '/')) return null;
    return $path;
}

function st_cms_remove_public_out(string $rel): bool
{
    $path = st_cms_safe_public_out($rel);
    if ($path === null || !is_file($path)) return false;
    unlink($path);
    $dir = dirname($path);
    $root = realpath(ST_ROOT);
    while ($root !== false && is_dir($dir) && realpath($dir) !== $root) {
        $left = array_diff(scandir($dir) ?: [], ['.', '..']);
        if ($left) break;
        $parent = dirname($dir);
        rmdir($dir);
        $dir = $parent;
    }
    return true;
}

function st_cms_write_public_page(string $file, array $ctx): string
{
    [$meta, $body] = st_cms_parse((string) file_get_contents($file));
    [$layout, $partials, $ld] = $ctx;
    $lastmod = gmdate('Y-m-d', (int) @filemtime($file));
    $html = st_cms_render_page($meta, $body, $layout, $partials, $ld, basename($file), $lastmod);
    $rel = (string) ($meta['out'] ?? '');
    if ($rel === '') throw new RuntimeException(basename($file) . ': brak pola out.');
    $out = ST_ROOT . '/' . $rel;
    $dir = dirname($out);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Nie utworzono katalogu witryny.');
    }
    st_cms_atomic_write($out, $html, true);
    return $out;
}

function st_cms_publish_page(string $id, bool $all = false): array
{
    @set_time_limit(180);
    ignore_user_abort(true);
    if ($all) {
        $built = st_cms_rebuild();
        st_cms_clear_pending();
        return st_cms_with_pending(['ok' => true, 'built' => $built, 'removed' => []]);
    }
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
    $path = ST_PAGES . '/' . $id . '.html';
    if (!is_file($path)) throw new RuntimeException('Nie znaleziono strony.');
    $out = st_cms_write_public_page($path, st_cms_render_ctx());
    st_cms_clear_pending();
    return st_cms_with_pending(['ok' => true, 'built' => ['pages' => 1], 'live' => $out, 'removed' => []]);
}

function st_cms_publish(): array
{
    @set_time_limit(180);
    ignore_user_abort(true);
    $st = st_cms_load_pending();
    $removed = $st['removedOuts'] ?? [];
    $built = st_cms_rebuild();
    $gone = [];
    foreach ($removed as $rel) {
        if (st_cms_remove_public_out((string) $rel)) $gone[] = $rel;
    }
    st_cms_clear_pending();
    return st_cms_with_pending(['ok' => true, 'built' => $built, 'removed' => $gone]);
}

function st_cms_rebuild(): array
{
    [$layout, $partials, $ld] = st_cms_render_ctx();
    $built = 0;
    $sitemap = [];
    foreach (glob(ST_PAGES . '/*.html') ?: [] as $file) {
        [$meta, $body] = st_cms_parse((string) file_get_contents($file));
        if (($meta['noindex'] ?? '') !== 'true') {
            $prio = $meta['prio'] ?? '0.7';
            $loc = ST_SITE . $meta['url'];
            $lastmod = gmdate('Y-m-d', (int) filemtime($file));
            $row = [
                '  <url>',
                '    <loc>' . $loc . '</loc>',
                '    <lastmod>' . $lastmod . '</lastmod>',
                '    <changefreq>monthly</changefreq>',
                '    <priority>' . $prio . '</priority>',
                '    <xhtml:link rel="alternate" hreflang="uk" href="' . $loc . '"/>',
            ];
            if (!empty($meta['pl'])) {
                $row[] = '    <xhtml:link rel="alternate" hreflang="pl" href="' . htmlspecialchars((string) $meta['pl'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . '"/>';
            }
            $row[] = '    <xhtml:link rel="alternate" hreflang="x-default" href="' . $loc . '"/>';
            $row[] = '  </url>';
            $sitemap[] = implode("\n", $row);
            $html = st_cms_render_page($meta, $body, $layout, $partials, $ld, basename($file), $lastmod);
        } else {
            $html = st_cms_render_page($meta, $body, $layout, $partials, $ld, basename($file));
        }
        $out = ST_ROOT . '/' . $meta['out'];
        st_cms_atomic_write($out, $html, false);
        $built++;
    }
    $sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">', ...$sitemap, '</urlset>'];
    st_cms_atomic_write(ST_ROOT . '/sitemap.xml', implode("\n", $sm) . "\n", true);
    return ['pages' => $built, 'sitemap' => count($sitemap)];
}

function st_cms_videos(): array
{
    $cats = [];
    $i = -1;
    if (!is_file(ST_FILMY)) return ['categories' => []];
    foreach (preg_split('/\r?\n/', (string) file_get_contents(ST_FILMY)) as $line) {
        if (trim($line) === '' || str_starts_with($line, '#')) continue;
        $parts = explode("\t", $line);
        if (($parts[0] ?? '') === 'CAT' && count($parts) >= 4) {
            $cats[] = ['key' => $parts[1], 'label' => $parts[2], 'desc' => $parts[3], 'videos' => []];
            $i = count($cats) - 1;
        } elseif (($parts[0] ?? '') === 'VID' && count($parts) >= 4 && $i >= 0) {
            $cats[$i]['videos'][] = ['cat' => $parts[1], 'id' => $parts[2], 'title' => $parts[3]];
        }
    }
    return ['categories' => $cats];
}

function st_cms_overview(): array
{
    $pages = st_cms_pages();
    $vids = st_cms_videos();
    $nvid = 0;
    foreach ($vids['categories'] as $c) $nvid += count($c['videos'] ?? []);
    $machItems = 0;
    $machines = 0;
    foreach ($pages as $p) {
        $machItems += (int) $p['mach'];
        if (in_array($p['kind'], ['machines', 'studs'], true)) $machines++;
    }
    return [
        'pages' => count($pages),
        'machines' => $machines,
        'machItems' => $machItems,
        'videos' => $nvid,
        'settings' => st_cms_settings(),
    ] + st_cms_pending_info();
}

function st_cms_handle(string $action, array $data): array
{
    require_once __DIR__ . '/katalog.php';
    try {
        if ($action === 'cms.overview') return ['ok' => true] + st_cms_overview();
        if ($action === 'cms.pages') return st_cms_with_pending(['ok' => true, 'pages' => st_cms_pages()]);
        if ($action === 'cms.page.get') return ['ok' => true, 'page' => st_cms_get_page((string) ($data['id'] ?? '')), 'stamp' => st_cms_page_stamp((string) ($data['id'] ?? ''))];
        if ($action === 'cms.page.stamp') return ['ok' => true, 'stamp' => st_cms_page_stamp((string) ($data['id'] ?? ''))];
        if ($action === 'cms.page.add-child' || $action === 'cms.page.add-machine') {
            require_once __DIR__ . '/builder.php';
            return st_builder_add_machine($data);
        }
        if ($action === 'cms.page.delete') {
            require_once __DIR__ . '/builder.php';
            return st_builder_delete_page((string) ($data['id'] ?? ''));
        }
        if ($action === 'cms.page.catalog' || $action === 'cms.page.place') {
            require_once __DIR__ . '/builder.php';
            if ($action === 'cms.page.catalog') return st_builder_catalog();
            return st_builder_place($data);
        }
        if ($action === 'cms.page.preview') return ['ok' => true, 'html' => st_cms_preview((string) ($data['id'] ?? ''))];
        if ($action === 'cms.page.builder' || $action === 'cms.page.commit') {
            require_once __DIR__ . '/builder.php';
            if ($action === 'cms.page.builder') return st_builder_preview((string) ($data['id'] ?? ''));
            return st_builder_commit($data);
        }
        if ($action === 'cms.translate') {
            require_once __DIR__ . '/tlumacz.php';
            $sl = (string) ($data['sl'] ?? 'en');
            $tl = (string) ($data['tl'] ?? 'uk');
            if (!in_array($sl, ['uk', 'en', 'pl'], true) || !in_array($tl, ['uk', 'en', 'pl'], true)) {
                return ['ok' => false, 'error' => 'Nieprawidłowy język.'];
            }
            $texts = is_array($data['texts'] ?? null) ? $data['texts'] : [];
            return ['ok' => true, 'map' => st_i18n_many(array_map('strval', $texts), $sl, $tl)];
        }
        if ($action === 'cms.page.save') {
            $id = (string) ($data['id'] ?? '');
            if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) throw new RuntimeException('Nieprawidłowa strona.');
            $path = ST_PAGES . '/' . $id . '.html';
            [$meta, $body] = st_cms_parse((string) file_get_contents($path));
            $incoming = $data['meta'] ?? [];
            if (is_array($incoming)) {
                foreach (['title','desc','ogtitle','og','crumbs','prio','pl','nav','url','out','noindex'] as $k) {
                    if (array_key_exists($k, $incoming)) $meta[$k] = trim((string) $incoming[$k]);
                }
            }
            if (!empty($data['html'])) $body = (string) $data['html'];
            $body = st_cms_patch_hero($body, is_array($data['hero'] ?? null) ? $data['hero'] : null);
            if (array_key_exists('images', $data)) $body = st_cms_patch_images($body, is_array($data['images']) ? $data['images'] : null);
            if (array_key_exists('copy', $data)) $body = st_cms_patch_copy($body, is_array($data['copy']) ? $data['copy'] : null);
            if (array_key_exists('models', $data) && function_exists('st_cms_patch_models')) $body = st_cms_patch_models($body, is_array($data['models']) ? $data['models'] : null);
            if (array_key_exists('films', $data) && function_exists('st_cms_patch_films')) $body = st_cms_patch_films($body, is_array($data['films']) ? $data['films'] : null);
            if (array_key_exists('mach', $data)) $body = st_cms_patch_mach($body, is_array($data['mach']) ? $data['mach'] : null);
            if (array_key_exists('faq', $data)) $body = st_cms_patch_faq($body, is_array($data['faq']) ? $data['faq'] : null);
            if (array_key_exists('people', $data)) $body = st_cms_patch_people($body, is_array($data['people']) ? $data['people'] : null);
            $body = st_cms_seo_tune($body);
            file_put_contents($path, st_cms_dump($meta, $body));
            $sharedRes = ['changed' => []];
            if (isset($data['shared']) && is_array($data['shared'])) $sharedRes = st_cms_patch_shared($data['shared']);
            require_once __DIR__ . '/tlumacz.php';
            $page = st_cms_get_page($id);
            $copyEcho = [];
            if (is_array($data['copy'] ?? null)) {
                foreach ($data['copy'] as $i => $it) {
                    if (!is_array($it) || !array_key_exists('html', $it)) continue;
                    $copyEcho[(string) ((int) $i)] = (string) (($page['copy'][(int) $i]['html'] ?? ''));
                }
            }
            $texts = st_i18n_from_page($page);
            if ($sharedRes['changed'] !== []) {
                foreach ($page['shared'] ?? [] as $lst) st_i18n_collect($lst, $texts);
            }
            $authored = 0;
            if (is_array($data['i18nPairs'] ?? null)) $authored = st_i18n_author_pairs($data['i18nPairs']);
            $i18n = st_i18n_safe($texts);
            if ($authored) $i18n['translated'] = (int) ($i18n['translated'] ?? 0) + $authored;
            $live = st_cms_publish_page($id, $sharedRes['changed'] !== []);
            return ['ok' => true, 'page' => $page, 'i18n' => $i18n, 'copyEcho' => (object) $copyEcho] + $live;
        }
        if ($action === 'cms.videos.get') return ['ok' => true] + st_cms_videos();
        if ($action === 'cms.videos.save') {
            $cats = $data['categories'] ?? [];
            $lines = [];
            if (is_array($cats)) {
                foreach ($cats as $cat) {
                    $key = preg_replace('/[^a-z0-9_-]/', '', (string) ($cat['key'] ?? '')) ?? '';
                    if ($key === '') continue;
                    $lines[] = "CAT\t{$key}\t" . trim((string) ($cat['label'] ?? '')) . "\t" . trim((string) ($cat['desc'] ?? ''));
                    $seen = [];
                    foreach ($cat['videos'] ?? [] as $v) {
                        $vid = trim((string) ($v['id'] ?? ''));
                        $title = trim((string) ($v['title'] ?? ''));
                        if ($vid === '' || $title === '' || isset($seen[$vid])) continue;
                        $seen[$vid] = true;
                        $lines[] = "VID\t{$key}\t{$vid}\t{$title}";
                    }
                }
            }
            file_put_contents(ST_FILMY, implode("\n", $lines) . "\n");
            require_once __DIR__ . '/builder.php';
            st_builder_sync_catalog();
            require_once __DIR__ . '/tlumacz.php';
            $videos = st_cms_videos();
            $acc = [];
            st_i18n_collect($videos, $acc);
            $authored = 0;
            if (is_array($data['i18nPairs'] ?? null)) $authored = st_i18n_author_pairs($data['i18nPairs']);
            $i18n = st_i18n_safe($acc);
            if ($authored) $i18n['translated'] = (int) ($i18n['translated'] ?? 0) + $authored;
            $live = st_cms_publish();
            return ['ok' => true, 'videos' => $videos, 'i18n' => $i18n] + $live;
        }
        if ($action === 'cms.settings.get') return ['ok' => true, 'settings' => st_cms_settings()];
        if ($action === 'cms.settings.save') {
            $old = st_cms_settings();
            $new = $old;
            $src = $data['settings'] ?? $data;
            foreach (st_cms_default_settings() as $k => $_) {
                if (isset($src[$k])) $new[$k] = trim((string) $src[$k]);
            }
            $new['phoneTel'] = preg_replace('/[^\d+]/', '', $new['phoneTel'] ?: $new['phone']) ?? $new['phoneTel'];
            if (!is_dir(dirname(ST_SETTINGS))) mkdir(dirname(ST_SETTINGS), 0755, true);
            file_put_contents(ST_SETTINGS, json_encode($new, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
            $files = array_merge([ST_LAYOUT], glob(ST_PAGES . '/*.html') ?: []);
            foreach (['phone','phoneTel','email','youtube','instagram','footer','addressShort','addressLine','company'] as $k) {
                st_cms_replace_files($old[$k], $new[$k], $files);
            }
            require_once __DIR__ . '/tlumacz.php';
            $acc = [];
            foreach (['footer', 'addressShort', 'addressLine'] as $k) {
                if (!empty($new[$k])) $acc[] = $new[$k];
            }
            $authored = 0;
            if (is_array($data['i18nPairs'] ?? null)) $authored = st_i18n_author_pairs($data['i18nPairs']);
            $i18n = st_i18n_safe($acc);
            if ($authored) $i18n['translated'] = (int) ($i18n['translated'] ?? 0) + $authored;
            $live = st_cms_publish();
            return ['ok' => true, 'settings' => $new, 'i18n' => $i18n] + $live;
        }
        if ($action === 'cms.media.list') {
            if (!is_dir(ST_MEDIA)) mkdir(ST_MEDIA, 0755, true);
            $rows = [];
            foreach (glob(ST_MEDIA . '/*') ?: [] as $p) {
                $ext = strtolower(pathinfo($p, PATHINFO_EXTENSION));
                if (!in_array($ext, ['jpg','jpeg','png','webp','gif','svg'], true)) continue;
                $rows[] = ['name' => basename($p), 'url' => '/assets/img/cms/' . basename($p), 'size' => filesize($p)];
            }
            return ['ok' => true, 'media' => $rows];
        }
        if ($action === 'cms.media.upload') {
            if (!is_dir(ST_MEDIA)) mkdir(ST_MEDIA, 0755, true);
            $name = basename((string) ($data['name'] ?? 'upload.jpg'));
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg','jpeg','png','webp','gif'], true)) throw new RuntimeException('Dozwolone: JPG, PNG, WebP, GIF.');
            $b64 = preg_replace('/^data:[^;]+;base64,/', '', (string) ($data['data'] ?? '')) ?? '';
            $blob = base64_decode($b64, true);
            if ($blob === false || $blob === '' || strlen($blob) > 8 * 1024 * 1024) throw new RuntimeException('Plik pusty albo większy niż 8 MB.');
            $fname = bin2hex(random_bytes(8)) . '.' . $ext;
            file_put_contents(ST_MEDIA . '/' . $fname, $blob);
            return ['ok' => true, 'url' => '/assets/img/cms/' . $fname, 'name' => $fname];
        }
        if ($action === 'cms.publish') return st_cms_publish();
        return ['ok' => false, 'error' => 'Nieznane żądanie CMS.'];
    } catch (Throwable $e) {
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}
