<?php
declare(strict_types=1);

/**
 * English is the editorial source.
 * Saving a changed English string translates it into Ukrainian and Russian.
 * A direct Ukrainian or Russian edit is kept until that English string changes.
 * The key lives in _private/tlumacz-klucz.php (see tlumacz-klucz.example.php)
 * or in _private/auth.env as ST_TRANSLATE_ENGINE and ST_TRANSLATE_KEY.
 * With no key, the English is kept and the field is marked untranslated.
 */

const ST_I18N_SOURCE = ST_ROOT . '/_build/zrodlo-en.json';

function st_i18n_engine_cfg(): array
{
    $cfg = ['engine' => 'deepl', 'key' => '', 'url' => ''];
    $file = ST_PRIVATE . '/tlumacz-klucz.php';
    if (is_file($file)) {
        $got = include $file;
        if (is_array($got)) {
            foreach (['engine', 'key', 'url'] as $k) {
                if (isset($got[$k]) && is_string($got[$k])) $cfg[$k] = trim($got[$k]);
            }
        }
    }
    if (function_exists('st_env')) {
        $env = st_env();
        if ($cfg['key'] === '' && !empty($env['ST_TRANSLATE_KEY'])) $cfg['key'] = trim((string) $env['ST_TRANSLATE_KEY']);
        if (!empty($env['ST_TRANSLATE_ENGINE'])) $cfg['engine'] = strtolower(trim((string) $env['ST_TRANSLATE_ENGINE']));
        if ($cfg['url'] === '' && !empty($env['ST_TRANSLATE_URL'])) $cfg['url'] = trim((string) $env['ST_TRANSLATE_URL']);
    }
    $cfg['engine'] = $cfg['engine'] === 'google' ? 'google' : 'deepl';
    return $cfg;
}

function st_i18n_dry(): bool
{
    return !empty($GLOBALS['ST_I18N_DRY']);
}

function st_i18n_clip(string $text, int $n = 72): string
{
    $t = st_i18n_plain($text);
    if (mb_strlen($t) <= $n) return $t;
    return rtrim(mb_substr($t, 0, $n - 1)) . '…';
}

/** What to tell the editor when a translation is still waiting. */
function st_i18n_retry_hint(): string
{
    $cfg = st_i18n_engine_cfg();
    return $cfg['key'] !== ''
        ? 'The translator did not answer this time. Click Retry translations in a moment.'
        : 'Add a key in _private/tlumacz-klucz.php (see tlumacz-klucz.example.php), then use Retry translations.';
}

/** Like st_i18n_plain, but keeps the author's dashes and quotes (what the page shows). */
function st_i18n_plain_show(string $s): string
{
    $t = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/<[^>]+>/', ' ', $t) ?? $t;
    $t = str_replace("\u{00A0}", ' ', $t);
    return trim(preg_replace('/\s+/u', ' ', $t) ?? $t);
}

function st_i18n_norm_en(string $text): string
{
    return mb_strtolower(st_i18n_plain($text));
}

function st_i18n_source_load(): array
{
    $empty = ['v' => 1, 'byEn' => []];
    if (st_i18n_dry() && isset($GLOBALS['ST_I18N_DRY_SOURCE']) && is_array($GLOBALS['ST_I18N_DRY_SOURCE'])) {
        return $GLOBALS['ST_I18N_DRY_SOURCE'];
    }
    if (!is_file(ST_I18N_SOURCE)) return $empty;
    $data = json_decode((string) file_get_contents(ST_I18N_SOURCE), true);
    if (!is_array($data)) return $empty;
    if (!isset($data['byEn']) || !is_array($data['byEn'])) $data['byEn'] = [];
    $data['v'] = 1;
    return $data;
}

function st_i18n_source_save(array $data): void
{
    if (st_i18n_dry()) {
        $GLOBALS['ST_I18N_DRY_SOURCE'] = $data;
        return;
    }
    $dir = dirname(ST_I18N_SOURCE);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents(ST_I18N_SOURCE, json_encode($data, JSON_UNESCAPED_UNICODE) . "\n");
}

function st_i18n_overlay_load(): array
{
    if (!empty($GLOBALS['ST_I18N_DRY']) && isset($GLOBALS['ST_I18N_DRY_OVERLAY']) && is_array($GLOBALS['ST_I18N_DRY_OVERLAY'])) {
        return $GLOBALS['ST_I18N_DRY_OVERLAY'];
    }
    if (!is_file(ST_I18N_JSON)) return [];
    $data = json_decode((string) file_get_contents(ST_I18N_JSON), true);
    return is_array($data) ? $data : [];
}

function st_i18n_overlay_save(array $overlay): void
{
    if (st_i18n_dry()) {
        $GLOBALS['ST_I18N_DRY_OVERLAY'] = $overlay;
        return;
    }
    st_i18n_write($overlay);
}

function st_i18n_js_pairs(string $path, string $marker): array
{
    if (!is_file($path)) return [];
    $js = (string) file_get_contents($path);
    $start = strpos($js, $marker);
    if ($start === false) return [];
    $out = [];
    if (!preg_match_all("/(['\"])((?:\\\\.|(?!\\1).)*)\\1\\s*:\\s*(['\"])((?:\\\\.|(?!\\3).)*)\\3/u", substr($js, $start), $m, PREG_SET_ORDER)) {
        return [];
    }
    foreach ($m as $row) {
        $a = trim(st_i18n_sense_unescape($row[2]));
        $b = trim(st_i18n_sense_unescape($row[4]));
        if ($a !== '' && $b !== '') $out[$a] = $b;
    }
    return $out;
}

function st_i18n_seed_rows(): array
{
    return [
        ['Заголовок', 'Heading', 'Заголовок'],
        ['Короткий опис, який можна змінити.', 'A short description you can change.', 'Краткое описание, которое можно изменить.'],
        ['Текст, який можна змінити.', 'Text you can change.', 'Текст, который можно изменить.'],
        ['Підпис', 'Label', 'Подпись'],
        ['Розділ', 'Section', 'Раздел'],
        ['Цифри', 'Figures', 'Цифры'],
        ['Нова модель', 'New model', 'Новая модель'],
        ['Нова машина', 'New machine', 'Новая машина'],
        ['Позначка', 'Tag', 'Метка'],
        ['Докладніше', 'Read more', 'Подробнее'],
        ['Короткий опис сторінки. Його можна змінити.', 'A short page description. You can change it.', 'Краткое описание страницы. Его можно изменить.'],
        ['Фото', 'Photo', 'Фото'],
    ];
}

/** Record current English as the source of the current Ukrainian and Russian. Does not retranslate. */
function st_i18n_source_ensure(): array
{
    $data = st_i18n_source_load();
    $overlay = st_i18n_overlay_load();
    $enByUk = st_i18n_js_pairs(ST_ROOT . '/assets/js/tlumaczenia.js', 'var D = {');
    $ruByUk = st_i18n_js_pairs(ST_ROOT . '/assets/js/ru-slovnyk.js', 'window.ST_RU = {');
    $changed = false;
    $add = static function (string $uk, string $en, string $ru) use (&$data, &$changed): void {
        $en = st_i18n_plain($en);
        $uk = st_i18n_plain($uk);
        $ru = st_i18n_plain($ru);
        if ($en === '' || $uk === '' || !preg_match('/[A-Za-z]/', $en)) return;
        if (preg_match('/\p{Cyrillic}/u', $en)) return;
        $key = st_i18n_norm_en($en);
        if (isset($data['byEn'][$key])) return;
        $data['byEn'][$key] = [
            'en' => $en,
            'uk' => $uk,
            'ru' => $ru,
            'ukLock' => 0,
            'ruLock' => 0,
            'pending' => 0,
        ];
        $changed = true;
    };
    foreach ($overlay as $uk => $row) {
        if (!is_string($uk) || !is_array($row)) continue;
        $en = st_i18n_plain((string) ($row['en'] ?? ''));
        $ru = st_i18n_plain((string) ($row['ru'] ?? ''));
        if ($ru === '') $ru = st_i18n_plain((string) ($ruByUk[$uk] ?? ''));
        if ($en !== '') $add($uk, $en, $ru);
    }
    foreach ($enByUk as $uk => $en) {
        if (!preg_match('/\p{Cyrillic}/u', $uk)) continue;
        $ru = st_i18n_plain((string) ($ruByUk[$uk] ?? ($overlay[$uk]['ru'] ?? '')));
        $add($uk, $en, $ru);
    }
    foreach (st_i18n_seed_rows() as [$uk, $en, $ru]) $add($uk, $en, $ru);
    if (!empty($data['byEn'])) $data['migrated'] = 1;
    if ($changed) st_i18n_source_save($data);
    return $data;
}

function st_i18n_current_en(string $uk, ?array $overlay = null): string
{
    $uk = st_i18n_plain($uk);
    if ($uk === '') return '';
    $overlay ??= st_i18n_overlay_load();
    $row = $overlay[$uk] ?? null;
    if (is_array($row) && !empty($row['en']) && (($row['a'] ?? '') === '1' || ($row['u'] ?? '') === '1')) {
        return st_i18n_plain((string) $row['en']);
    }
    $dict = st_i18n_sense_uk_en($uk);
    if ($dict !== '') return $dict;
    if (is_array($row) && !empty($row['en'])) return st_i18n_plain((string) $row['en']);
    return '';
}

function st_i18n_current_ru(string $uk, ?array $overlay = null): string
{
    $uk = st_i18n_plain($uk);
    if ($uk === '') return '';
    $overlay ??= st_i18n_overlay_load();
    $row = $overlay[$uk] ?? null;
    if (is_array($row) && !empty($row['ru'])) return st_i18n_plain((string) $row['ru']);
    static $ru = null;
    if ($ru === null) $ru = st_i18n_js_pairs(ST_ROOT . '/assets/js/ru-slovnyk.js', 'window.ST_RU = {');
    return st_i18n_plain((string) ($ru[$uk] ?? ''));
}

function st_i18n_clean_rich(string $html): string
{
    $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html) ?? $html;
    $html = strip_tags($html, '<a><strong><em><u><b><i><span><br>');
    $html = preg_replace('/\s+on[a-z]+\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace_callback('/<a\b[^>]*>/i', static function (array $m): string {
        $tag = $m[0];
        $href = '';
        if (preg_match('/\shref\s*=\s*"([^"]*)"/i', $tag, $hm)) $href = html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        elseif (preg_match("/\\shref\\s*=\\s*'([^']*)'/i", $tag, $hm)) $href = html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($href === '' || !preg_match('~^(?:https?:|/|#|mailto:|tel:)~i', $href)) return '<a>';
        $extra = preg_match('/\starget\s*=\s*"_blank"/i', $tag) ? ' target="_blank" rel="noopener"' : '';
        return '<a href="' . htmlspecialchars($href, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"' . $extra . '>';
    }, $html) ?? $html;
    $html = preg_replace_callback('/<span\b[^>]*>/i', static function (array $m): string {
        $keepCls = '';
        if (preg_match('/\sclass\s*=\s*"stats__v"/i', $m[0])) {
            $keepCls = ' class="stats__v"';
            if (preg_match('/\sdata-count\s*=\s*"(\d{1,9})"/i', $m[0], $dc)) $keepCls .= ' data-count="' . $dc[1] . '"';
        }
        if (!preg_match('/\sstyle\s*=\s*"([^"]*)"/i', $m[0], $sm)) return '<span' . $keepCls . '>';
        $keep = [];
        foreach (explode(';', html_entity_decode($sm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')) as $decl) {
            if (!str_contains($decl, ':')) continue;
            [$prop, $val] = explode(':', $decl, 2);
            $prop = strtolower(trim($prop));
            $val = trim($val);
            if ($prop === 'color' && preg_match('/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*1(?:\.0+)?\s*)?\)$/i', $val, $rgb)) {
                $val = sprintf('#%02x%02x%02x', min(255, (int) $rgb[1]), min(255, (int) $rgb[2]), min(255, (int) $rgb[3]));
            }
            if ($prop === 'color' && preg_match('/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i', $val)) $keep[] = 'color:' . $val;
            if ($prop === 'font-size' && preg_match('/^[\d.]+(?:px|rem|em|%)$/', $val)) $keep[] = 'font-size:' . $val;
        }
        return $keep === [] ? '<span' . $keepCls . '>' : '<span' . $keepCls . ' style="' . htmlspecialchars(implode(';', $keep), ENT_QUOTES | ENT_HTML5, 'UTF-8') . '">';
    }, $html) ?? $html;
    $html = preg_replace('/\sdata-(?:st-en-only|st-ru-only|stb-paint|st-at|st-en)(?![\w-])(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+))?/i', '', $html) ?? $html;
    return $html;
}

function st_i18n_shield(string $text): string
{
    $parts = preg_split('/(<[^>]+>)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) return $text;
    $brands = st_i18n_sense_glossary()['brands'];
    foreach ($parts as $i => $part) {
        if ($part === '' || str_starts_with($part, '<')) continue;
        foreach ($brands as $brand) {
            $part = preg_replace(
                '/(?<![A-Za-z0-9])' . preg_quote($brand, '/') . '(?![A-Za-z0-9])/',
                '<span translate="no">' . $brand . '</span>',
                $part
            ) ?? $part;
        }
        $parts[$i] = $part;
    }
    return implode('', $parts);
}

function st_i18n_unshield(string $html): string
{
    return preg_replace('/<span translate="no">(.*?)<\/span>/us', '$1', $html) ?? $html;
}

function st_i18n_http_post(string $url, string $body, array $headers): string
{
    if (function_exists('curl_init')) {
        $h = curl_init($url);
        if ($h === false) return '';
        curl_setopt_array($h, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
        ]);
        $raw = curl_exec($h);
        curl_close($h);
        return is_string($raw) ? $raw : '';
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $body,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    return is_string($raw) ? $raw : '';
}

function st_i18n_deepl(array $texts, string $target, bool $html): array
{
    $cfg = st_i18n_engine_cfg();
    $key = $cfg['key'];
    $base = $cfg['url'] !== '' ? rtrim($cfg['url'], '/') : (str_ends_with($key, ':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');
    $parts = [];
    foreach ($texts as $t) $parts[] = 'text=' . rawurlencode($t);
    $parts[] = 'source_lang=EN';
    $parts[] = 'target_lang=' . ($target === 'ru' ? 'RU' : 'UK');
    if ($html) {
        $parts[] = 'tag_handling=html';
        $parts[] = 'preserve_formatting=1';
    }
    $raw = st_i18n_http_post($base . '/v2/translate', implode('&', $parts), [
        'Authorization: DeepL-Auth-Key ' . $key,
        'Content-Type: application/x-www-form-urlencoded',
    ]);
    $data = json_decode($raw, true);
    $out = [];
    foreach (($data['translations'] ?? []) as $i => $row) {
        if (is_array($row) && isset($row['text'])) $out[$i] = (string) $row['text'];
    }
    return $out;
}

function st_i18n_google_cloud(array $texts, string $target, bool $html): array
{
    $cfg = st_i18n_engine_cfg();
    $url = 'https://translation.googleapis.com/language/translate/v2?key=' . rawurlencode($cfg['key']);
    $payload = json_encode([
        'q' => array_values($texts),
        'source' => 'en',
        'target' => $target === 'ru' ? 'ru' : 'uk',
        'format' => $html ? 'html' : 'text',
    ], JSON_UNESCAPED_UNICODE);
    $raw = st_i18n_http_post($url, $payload === false ? '{}' : $payload, ['Content-Type: application/json']);
    $data = json_decode($raw, true);
    $out = [];
    foreach (($data['data']['translations'] ?? []) as $i => $row) {
        if (is_array($row) && isset($row['translatedText'])) {
            $out[$i] = html_entity_decode((string) $row['translatedText'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
    }
    return $out;
}

function st_i18n_cache_get(): array
{
    if (st_i18n_dry()) return is_array($GLOBALS['ST_I18N_DRY_CACHE'] ?? null) ? $GLOBALS['ST_I18N_DRY_CACHE'] : [];
    if (!is_file(ST_I18N_CACHE)) return [];
    $data = json_decode((string) file_get_contents(ST_I18N_CACHE), true);
    return is_array($data) ? $data : [];
}

function st_i18n_cache_put(array $cache): void
{
    if (st_i18n_dry()) {
        $GLOBALS['ST_I18N_DRY_CACHE'] = $cache;
        return;
    }
    $dir = dirname(ST_I18N_CACHE);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents(ST_I18N_CACHE, json_encode($cache, JSON_UNESCAPED_UNICODE) . "\n");
}

/** Translate one English string. ok=false means no key or the engine failed. */
function st_i18n_auto(string $text, string $target, bool $html): array
{
    $target = $target === 'ru' ? 'ru' : 'uk';
    $text = $html ? $text : st_i18n_plain($text);
    if ($text === '') return ['ok' => true, 'text' => ''];
    $fake = $GLOBALS['ST_I18N_FAKE'] ?? null;
    if (is_callable($fake)) {
        $got = $fake($text, $target, $html);
        if (is_array($got) && !empty($got['ok'])) return ['ok' => true, 'text' => (string) ($got['text'] ?? $text)];
        return ['ok' => false, 'text' => $text];
    }
    if (!$html) {
        if (!st_i18n_sense_still_en(strip_tags($text))) return ['ok' => true, 'text' => $text];
        $known = st_i18n_known($text);
        if ($target === 'uk' && $known['uk'] !== '') return ['ok' => true, 'text' => $known['uk']];
        if ($target === 'ru' && $known['ru'] !== '') return ['ok' => true, 'text' => $known['ru']];
        $uk = $target === 'uk' ? st_i18n_sense_exact($text) : '';
        if ($uk === '') $uk = st_i18n_dict_en_uk($text);
        if ($target === 'uk' && $uk !== '') return ['ok' => true, 'text' => $uk];
        if ($target === 'ru' && $uk !== '') {
            $ru = st_i18n_current_ru($uk);
            if ($ru !== '' && $ru !== $uk) return ['ok' => true, 'text' => $ru];
        }
    }
    $cfg = st_i18n_engine_cfg();
    if ($cfg['key'] === '') return ['ok' => false, 'text' => $text];
    $cache = st_i18n_cache_get();
    $ck = 'src:' . $cfg['engine'] . ':en:' . $target . ($html ? ':h:' : ':') . substr(sha1($text), 0, 20);
    if (isset($cache[$ck]) && is_string($cache[$ck]) && $cache[$ck] !== '') {
        return ['ok' => true, 'text' => $cache[$ck]];
    }
    $send = $html ? $text : st_i18n_shield($text);
    try {
        $batch = $cfg['engine'] === 'google'
            ? st_i18n_google_cloud([$send], $target, true)
            : st_i18n_deepl([$send], $target, true);
    } catch (Throwable) {
        return ['ok' => false, 'text' => $text];
    }
    $got = $batch[0] ?? '';
    if (!is_string($got) || trim($got) === '') return ['ok' => false, 'text' => $text];
    $got = st_i18n_unshield($got);
    if (!$html) $got = st_i18n_plain($got);
    if ($target === 'uk' && !$html) $got = st_i18n_sense_polish($got, $text);
    if ($got === '') return ['ok' => false, 'text' => $text];
    $cache[$ck] = $got;
    st_i18n_cache_put($cache);
    return ['ok' => true, 'text' => $got];
}

function st_i18n_auto_from(string $text, string $source, string $target): array
{
    $text = st_i18n_plain($text);
    if ($text === '' || $source === $target) return ['ok' => true, 'text' => $text];
    if ($source === 'en') return st_i18n_auto($text, $target, false);
    $fake = $GLOBALS['ST_I18N_FAKE'] ?? null;
    if (is_callable($fake)) {
        $got = $fake($text, $target, false);
        if (is_array($got) && !empty($got['ok'])) return ['ok' => true, 'text' => (string) $got['text']];
        return ['ok' => false, 'text' => $text];
    }
    $cfg = st_i18n_engine_cfg();
    if ($cfg['key'] === '') return ['ok' => false, 'text' => $text];
    $sl = $source === 'ru' ? 'RU' : 'UK';
    $tl = $target === 'ru' ? 'RU' : ($target === 'en' ? 'EN' : 'UK');
    if ($cfg['engine'] === 'google') {
        $url = 'https://translation.googleapis.com/language/translate/v2?key=' . rawurlencode($cfg['key']);
        $payload = json_encode(['q' => [$text], 'source' => $source === 'ru' ? 'ru' : 'uk', 'target' => $target === 'ru' ? 'ru' : ($target === 'en' ? 'en' : 'uk'), 'format' => 'text']);
        $raw = st_i18n_http_post($url, $payload === false ? '{}' : $payload, ['Content-Type: application/json']);
        $data = json_decode($raw, true);
        $got = (string) ($data['data']['translations'][0]['translatedText'] ?? '');
        $got = html_entity_decode($got, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    } else {
        $base = $cfg['url'] !== '' ? rtrim($cfg['url'], '/') : (str_ends_with($cfg['key'], ':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');
        $body = 'text=' . rawurlencode($text) . '&source_lang=' . $sl . '&target_lang=' . $tl;
        $raw = st_i18n_http_post($base . '/v2/translate', $body, [
            'Authorization: DeepL-Auth-Key ' . $cfg['key'],
            'Content-Type: application/x-www-form-urlencoded',
        ]);
        $data = json_decode($raw, true);
        $got = (string) ($data['translations'][0]['text'] ?? '');
    }
    $got = st_i18n_plain($got);
    if ($got === '' || $got === $text) return ['ok' => false, 'text' => $text];
    return ['ok' => true, 'text' => $got];
}

function st_i18n_known(string $en): array
{
    $en = st_i18n_plain($en);
    $empty = ['uk' => '', 'ru' => ''];
    if ($en === '') return $empty;
    $row = st_i18n_source_load()['byEn'][st_i18n_norm_en($en)] ?? null;
    if (!is_array($row) || !empty($row['pending'])) return $empty;
    $uk = st_i18n_plain((string) ($row['uk'] ?? ''));
    $ru = st_i18n_plain((string) ($row['ru'] ?? ''));
    if ($uk === $en || !preg_match('/\p{Cyrillic}/u', $uk)) $uk = '';
    if ($ru === '' || $ru === $en || !preg_match('/\p{Cyrillic}/u', $ru)) $ru = '';
    return ['uk' => $uk, 'ru' => $ru];
}

function st_i18n_dict_en_uk(string $en): string
{
    static $rev = null;
    if ($rev === null) {
        $rev = [];
        foreach (st_i18n_js_pairs(ST_ROOT . '/assets/js/tlumaczenia.js', 'var D = {') as $uk => $enVal) {
            if (!preg_match('/\p{Cyrillic}/u', (string) $uk)) continue;
            $key = st_i18n_norm_en((string) $enVal);
            if ($key !== '' && !isset($rev[$key])) $rev[$key] = st_i18n_plain((string) $uk);
        }
    }
    return $rev[st_i18n_norm_en($en)] ?? '';
}

function st_i18n_tag_count(string $html): int
{
    return preg_match_all('/<(?:strong|em|u|b|i|a|span)\b/i', $html) ?: 0;
}

/** Keep bold, italic, underline, colour, size and links on the translated words. */
function st_i18n_markup_nodes(string $html, string $target): array
{
    $parts = preg_split('/(<[^>]+>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) return ['ok' => false, 'text' => $html];
    $needs = false;
    $changed = false;
    foreach ($parts as $i => $part) {
        if ($part === '' || str_starts_with($part, '<')) continue;
        $plain = st_i18n_plain($part);
        if ($plain === '' || !st_i18n_sense_still_en($plain)) continue;
        $needs = true;
        $got = st_i18n_auto($plain, $target, false);
        if (empty($got['ok'])) return ['ok' => false, 'text' => $html];
        $next = st_i18n_plain((string) ($got['text'] ?? ''));
        if ($next === '' || $next === $plain) continue;
        $lead = preg_match('/^\s+/', $part, $lm) ? $lm[0] : '';
        $tail = preg_match('/\s+$/', $part, $tm) ? $tm[0] : '';
        $parts[$i] = $lead . htmlspecialchars($next, ENT_QUOTES | ENT_HTML5, 'UTF-8') . $tail;
        $changed = true;
    }
    if (!$needs) return ['ok' => true, 'text' => $html];
    if (!$changed) return ['ok' => false, 'text' => $html];
    return ['ok' => true, 'text' => implode('', $parts)];
}

function st_i18n_auto_markup(string $html, string $target): array
{
    $html = st_i18n_clean_rich($html);
    if ($html === '') return ['ok' => true, 'text' => ''];
    $cfg = st_i18n_engine_cfg();
    $fake = $GLOBALS['ST_I18N_FAKE'] ?? null;
    if ($cfg['key'] !== '' && !is_callable($fake)) {
        $got = st_i18n_auto(st_i18n_shield($html), $target, true);
        if (!empty($got['ok'])) {
            $clean = st_i18n_clean_rich(st_i18n_unshield((string) $got['text']));
            if ($clean !== '' && st_i18n_tag_count($clean) >= st_i18n_tag_count($html)) {
                return ['ok' => true, 'text' => $clean];
            }
        }
    }
    return st_i18n_markup_nodes($html, $target);
}

function st_i18n_remember_source(string $en, string $uk, string $ru, bool $ukLock, bool $ruLock, bool $pending): void
{
    $en = st_i18n_plain($en);
    $uk = st_i18n_plain($uk);
    $ru = st_i18n_plain($ru);
    if ($en === '' || $uk === '') return;
    $overlay = st_i18n_overlay_load();
    if (!isset($overlay[$uk]) || !is_array($overlay[$uk])) $overlay[$uk] = [];
    $overlay[$uk]['en'] = $en;
    if ($ru !== '') $overlay[$uk]['ru'] = $ru;
    $overlay[$uk]['a'] = '1';
    if ($pending) $overlay[$uk]['u'] = '1';
    else unset($overlay[$uk]['u']);
    st_i18n_overlay_save($overlay);
    $data = st_i18n_source_load();
    $data['byEn'][st_i18n_norm_en($en)] = [
        'en' => $en,
        'uk' => $uk,
        'ru' => $ru,
        'ukLock' => $ukLock ? 1 : 0,
        'ruLock' => $ruLock ? 1 : 0,
        'pending' => $pending ? 1 : 0,
    ];
    $data['migrated'] = 1;
    st_i18n_source_save($data);
}

function st_i18n_resolve_en(string $en, string $ukOverride = '', string $ruOverride = ''): array
{
    $en = st_i18n_plain($en);
    $ukOverride = st_i18n_plain($ukOverride);
    $ruOverride = st_i18n_plain($ruOverride);
    $pending = false;
    $uk = $ukOverride;
    $ru = $ruOverride;
    if ($uk === '') {
        $got = st_i18n_auto($en, 'uk', false);
        if ($got['ok'] && st_i18n_plain($got['text']) !== '' && st_i18n_plain($got['text']) !== $en) $uk = st_i18n_plain($got['text']);
        else {
            $uk = $en;
            $pending = true;
        }
    }
    if ($ru === '') {
        $got = st_i18n_auto($en, 'ru', false);
        if ($got['ok'] && st_i18n_plain($got['text']) !== '') $ru = st_i18n_plain($got['text']);
        else $pending = true;
    }
    if ($ru === '') $ru = $uk;
    st_i18n_remember_source($en, $uk, $ru, $ukOverride !== '', $ruOverride !== '', $pending);
    return ['en' => $en, 'uk' => $uk, 'ru' => $ru, 'pending' => $pending];
}

function st_i18n_el_end(string $html, string $tag, int $innerStart): ?int
{
    $tag = strtolower($tag);
    $i = $innerStart;
    $depth = 1;
    $len = strlen($html);
    $openRe = '/<' . preg_quote($tag, '/') . '\b/i';
    $close = '</' . $tag . '>';
    while ($i < $len && $depth > 0) {
        $nextOpen = preg_match($openRe, $html, $om, PREG_OFFSET_CAPTURE, $i) ? (int) $om[0][1] : null;
        $nextClose = stripos($html, $close, $i);
        if ($nextClose === false) return null;
        if ($nextOpen !== null && $nextOpen < $nextClose) {
            $depth++;
            $i = $nextOpen + 1;
            continue;
        }
        $depth--;
        $i = $nextClose + strlen($close);
        if ($depth === 0) return $i;
    }
    return null;
}

function st_i18n_xid_span(string $html, string $xid): ?array
{
    $re = '/<([a-z0-9]+)\b[^>]*\sdata-st-xid="' . preg_quote($xid, '/') . '"[^>]*>/i';
    if (!preg_match($re, $html, $m, PREG_OFFSET_CAPTURE)) return null;
    $tag = strtolower($m[1][0]);
    $open = $m[0][0];
    $openAt = (int) $m[0][1];
    $inner = $openAt + strlen($open);
    $end = st_i18n_el_end($html, $tag, $inner);
    if ($end === null) return null;
    $closeLen = strlen('</' . $tag . '>');
    return [
        'tag' => $tag,
        'openAt' => $openAt,
        'open' => $open,
        'inner' => $inner,
        'innerEnd' => $end - $closeLen,
        'end' => $end,
    ];
}

function st_i18n_set_attr(string $open, string $name, string $value): string
{
    $open = preg_replace('/\s' . preg_quote($name, '/') . '\s*=\s*"[^"]*"/i', '', $open) ?? $open;
    $attr = ' ' . $name . '="' . htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
    return preg_replace('/>$/', $attr . '>', $open, 1) ?? $open;
}

function st_i18n_patch_xid(string $html, string $xid, ?string $inner, array $attrs): string
{
    $span = st_i18n_xid_span($html, $xid);
    if ($span === null) return $html;
    $open = $span['open'];
    foreach ($attrs as $name => $value) {
        if ($value === null) {
            $open = preg_replace('/\s' . preg_quote($name, '/') . '\s*=\s*"[^"]*"/i', '', $open) ?? $open;
        } else {
            $open = st_i18n_set_attr($open, $name, $value);
        }
    }
    $open = preg_replace('/\sdata-st-xid="' . preg_quote($xid, '/') . '"/i', '', $open) ?? $open;
    $body = $inner === null ? substr($html, $span['inner'], $span['innerEnd'] - $span['inner']) : $inner;
    return substr($html, 0, $span['openAt']) . $open . $body . substr($html, $span['innerEnd']);
}

function st_i18n_replace_text(string $html, string $old, string $new): string
{
    $oldN = st_i18n_plain($old);
    $newEsc = htmlspecialchars($new, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $html = preg_replace_callback('/>([^<]*)</u', static function (array $m) use ($oldN, $newEsc): string {
        $cur = st_i18n_plain(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($cur !== $oldN) return $m[0];
        $lead = preg_match('/^\s+/', $m[1], $lm) ? $lm[0] : '';
        $tail = preg_match('/\s+$/', $m[1], $tm) ? $tm[0] : '';
        return '>' . $lead . $newEsc . $tail . '<';
    }, $html) ?? $html;
    $html = preg_replace_callback('/\s(alt|title|aria-label|placeholder|data-title)\s*=\s*"([^"]*)"/u', static function (array $m) use ($oldN, $new): string {
        $cur = st_i18n_plain(html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($cur !== $oldN) return $m[0];
        return ' ' . $m[1] . '="' . htmlspecialchars($new, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"';
    }, $html) ?? $html;
    return $html;
}

function st_i18n_docs_replace(array &$docs, string $xid, string $old, string $new, ?string $inner, array $attrs): void
{
    if ($xid !== '') {
        foreach ($docs as $k => $html) {
            if (!is_string($html) || !str_contains($html, 'data-st-xid="' . $xid . '"')) continue;
            if ($inner === null && $old !== '' && $old !== $new) {
                $span = st_i18n_xid_span($html, $xid);
                if ($span !== null) {
                    $chunk = substr($html, $span['openAt'], $span['end'] - $span['openAt']);
                    $chunk = st_i18n_replace_text($chunk, $old, $new);
                    $html = substr($html, 0, $span['openAt']) . $chunk . substr($html, $span['end']);
                }
            }
            $docs[$k] = st_i18n_patch_xid($html, $xid, $inner, $attrs);
            return;
        }
    }
    if ($old === '' || $old === $new) return;
    foreach ($docs as $k => $html) {
        if (!is_string($html) || !str_contains($html, $old)) continue;
        $docs[$k] = st_i18n_replace_text($html, $old, $new);
    }
}

function st_i18n_fragment_pairs(array &$overlay, string $ukHtml, string $enHtml, string $ruHtml): void
{
    $bits = static function (string $html): array {
        if (!preg_match_all('/>([^<]+)</u', '>' . $html . '<', $m)) return [];
        $out = [];
        foreach ($m[1] as $piece) {
            $t = st_i18n_plain($piece);
            if ($t !== '') $out[] = $t;
        }
        return $out;
    };
    $uk = $bits($ukHtml);
    $en = $bits($enHtml);
    $ru = $bits($ruHtml);
    if (count($uk) < 2 || count($uk) !== count($en)) return;
    foreach ($uk as $i => $u) {
        if (!isset($overlay[$u]) || !is_array($overlay[$u])) $overlay[$u] = [];
        if ($en[$i] !== '' && $en[$i] !== $u) $overlay[$u]['en'] = $en[$i];
        if (isset($ru[$i]) && $ru[$i] !== '' && $ru[$i] !== $u) $overlay[$u]['ru'] = $ru[$i];
        $overlay[$u]['a'] = '1';
    }
}

/** English sentences that failed last time, found in this HTML or in the ledger. */
function st_i18n_harvest_pending(array &$docs, array $ledger, array $overlay, array $seen): array
{
    $pairs = [];
    $seq = 1;
    foreach ($docs as $key => $html) {
        if (!is_string($html) || !str_contains($html, 'data-st-untranslated')) continue;
        $offset = 0;
        $len = strlen($html);
        while ($offset < $len && preg_match('/<([a-z0-9]+)\b[^>]*\sdata-st-untranslated="1"[^>]*>/i', $html, $m, PREG_OFFSET_CAPTURE, $offset)) {
            $open = $m[0][0];
            $at = (int) $m[0][1];
            if (preg_match('/\sdata-st-xid="([a-z][a-z0-9]{0,11})"/i', $open, $xm)) {
                $xid = $xm[1];
            } else {
                $xid = 'r' . $seq++;
                if (!preg_match('/^[a-z][a-z0-9]{0,11}$/', $xid)) $xid = 'r' . substr(md5((string) $seq), 0, 8);
                $open2 = preg_replace('/>$/', ' data-st-xid="' . $xid . '">', $open, 1) ?? $open;
                $html = substr($html, 0, $at) . $open2 . substr($html, $at + strlen($open));
                $len = strlen($html);
            }
            $span = st_i18n_xid_span($html, $xid);
            if ($span === null) {
                $offset = $at + strlen($open);
                continue;
            }
            $uk = st_i18n_plain(substr($html, $span['inner'], $span['innerEnd'] - $span['inner']));
            $enHtml = '';
            if (preg_match('/\sdata-st-enhtml="([^"]*)"/i', $span['open'], $hm)) {
                $enHtml = html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            $en = $enHtml !== '' ? st_i18n_plain($enHtml) : '';
            if ($en === '' && isset($overlay[$uk]) && is_array($overlay[$uk])) {
                $en = st_i18n_plain((string) ($overlay[$uk]['en'] ?? ''));
            }
            if ($en === '') {
                foreach ($ledger['byEn'] as $row) {
                    if (!is_array($row) || empty($row['pending'])) continue;
                    if (st_i18n_plain((string) ($row['uk'] ?? '')) === $uk) {
                        $en = st_i18n_plain((string) ($row['en'] ?? ''));
                        break;
                    }
                }
            }
            if ($en === '' && $uk !== '' && preg_match('/[A-Za-z]/', $uk) && !preg_match('/\p{Cyrillic}/u', $uk)) $en = $uk;
            $sig = st_i18n_norm_en($en) . "\n" . $uk;
            if ($en !== '' && !isset($seen[$sig])) {
                $item = ['role' => 'en', 'xid' => $xid, 'uk' => $uk, 'en' => $en, 'prevEn' => $en, 'retry' => 1];
                if ($enHtml !== '') $item['enHtml'] = $enHtml;
                if ($uk !== '' && !preg_match('/\p{Cyrillic}/u', $uk) && st_i18n_norm_en($uk) === st_i18n_norm_en($en)) $item['fresh'] = 1;
                $pairs[] = $item;
                $seen[$sig] = true;
            }
            $offset = $span['end'];
        }
        $docs[$key] = $html;
    }
    foreach ($ledger['byEn'] as $row) {
        if (!is_array($row) || empty($row['pending'])) continue;
        $en = st_i18n_plain((string) ($row['en'] ?? ''));
        $uk = st_i18n_plain((string) ($row['uk'] ?? ''));
        if ($en === '') continue;
        $sig = st_i18n_norm_en($en) . "\n" . $uk;
        if (isset($seen[$sig])) continue;
        $hit = false;
        foreach ($docs as $html) {
            if (!is_string($html)) continue;
            if (($uk !== '' && str_contains($html, $uk)) || str_contains($html, $en)) {
                $hit = true;
                break;
            }
        }
        if (!$hit) continue;
        $item = ['role' => 'en', 'uk' => $uk, 'en' => $en, 'prevEn' => $en, 'retry' => 1];
        if ($uk !== '' && !preg_match('/\p{Cyrillic}/u', $uk) && st_i18n_norm_en($uk) === st_i18n_norm_en($en)) $item['fresh'] = 1;
        $pairs[] = $item;
        $seen[$sig] = true;
    }
    return $pairs;
}

function st_i18n_apply_documents(array $docs, array $pairs, ?array $meta = null, string $metaLang = '', array $metaUk = []): array
{
    $warnings = [];
    $pending = 0;
    $translated = 0;
    $locked = 0;
    $replacedManual = 0;
    st_i18n_source_ensure();
    $ledger = st_i18n_source_load();
    $overlay = st_i18n_overlay_load();
    $touch = false;
    $slots = [];
    $rest = [];
    foreach ($pairs as $row) {
        if (is_array($row) && (($row['role'] ?? '') === 'slot')) $slots[] = $row;
        else $rest[] = $row;
    }
    if ($slots !== [] && !st_i18n_dry()) {
        st_i18n_author_pairs($slots);
        $overlay = st_i18n_overlay_load();
    }
    $pairs = $rest;
    $seen = [];
    foreach ($pairs as $row) {
        if (!is_array($row)) continue;
        $seenEn = st_i18n_plain((string) ($row['en'] ?? ''));
        $seenUk = st_i18n_plain((string) ($row['uk'] ?? ''));
        if ($seenEn !== '') $seen[st_i18n_norm_en($seenEn) . "\n" . $seenUk] = true;
    }
    foreach (st_i18n_harvest_pending($docs, $ledger, $overlay, $seen) as $extra) $pairs[] = $extra;

    $put = static function (string $uk, string $en, string $ru, bool $untranslated) use (&$overlay, &$touch): void {
        if ($uk === '') return;
        if (!isset($overlay[$uk]) || !is_array($overlay[$uk])) $overlay[$uk] = [];
        if ($en !== '') $overlay[$uk]['en'] = $en;
        if ($ru !== '') $overlay[$uk]['ru'] = $ru;
        $overlay[$uk]['a'] = '1';
        if ($untranslated) $overlay[$uk]['u'] = '1';
        else unset($overlay[$uk]['u']);
        $touch = true;
    };

    foreach ($pairs as $row) {
        if (!is_array($row)) continue;
        $role = (string) ($row['role'] ?? '');
        if ($role === '' && isset($row['en'])) $role = 'en';
        if ($role === '' && isset($row['ru']) && !isset($row['en'])) $role = 'ru';
        $uk = st_i18n_plain((string) ($row['uk'] ?? ''));
        $en = st_i18n_plain_show((string) ($row['en'] ?? ''));
        $prev = st_i18n_plain((string) ($row['prevEn'] ?? ''));
        $xid = preg_match('/^[a-z][a-z0-9]{0,11}$/', (string) ($row['xid'] ?? '')) ? (string) $row['xid'] : '';
        if ($prev === '' && $uk !== '') $prev = st_i18n_current_en($uk, $overlay);
        if ($en === '' && $prev !== '') $en = $prev;

        if ($role === 'uk') {
            $next = st_i18n_plain((string) ($row['nextUk'] ?? ''));
            if ($next === '' || $next === $uk) continue;
            $src = $prev !== '' ? $prev : $en;
            $ru = $src !== '' ? st_i18n_plain((string) (($ledger['byEn'][st_i18n_norm_en($src)]['ru'] ?? '') ?: st_i18n_current_ru($uk, $overlay))) : st_i18n_current_ru($uk, $overlay);
            $put($next, $src, $ru, false);
            if ($src !== '') {
                $ledger['byEn'][st_i18n_norm_en($src)] = [
                    'en' => $src, 'uk' => $next, 'ru' => $ru, 'ukLock' => 1, 'ruLock' => (int) ($ledger['byEn'][st_i18n_norm_en($src)]['ruLock'] ?? 0), 'pending' => 0,
                ];
            }
            st_i18n_docs_replace($docs, $xid, $uk, $next, null, $xid !== '' ? ['data-st-lock' => 'uk', 'data-st-untranslated' => null] : []);
            $locked++;
            continue;
        }
        if ($role === 'ru') {
            $ru = st_i18n_plain((string) ($row['ru'] ?? ''));
            if ($uk === '' || $ru === '' || $ru === $uk) continue;
            $src = $prev !== '' ? $prev : st_i18n_current_en($uk, $overlay);
            $put($uk, $src, $ru, false);
            if ($src !== '') {
                $prevRow = $ledger['byEn'][st_i18n_norm_en($src)] ?? ['en' => $src, 'uk' => $uk, 'ukLock' => 0];
                $ledger['byEn'][st_i18n_norm_en($src)] = [
                    'en' => $src,
                    'uk' => st_i18n_plain((string) ($prevRow['uk'] ?? $uk)),
                    'ru' => $ru,
                    'ukLock' => (int) ($prevRow['ukLock'] ?? 0),
                    'ruLock' => 1,
                    'pending' => 0,
                ];
            }
            if ($xid !== '') st_i18n_docs_replace($docs, $xid, '', '', null, ['data-st-lock' => 'ru']);
            $locked++;
            continue;
        }
        if ($role !== 'en' || $en === '' || $uk === '') continue;
        $enHtml = st_i18n_clean_rich((string) ($row['enHtml'] ?? ''));
        $rich = $enHtml !== '' && preg_match('/<(?:strong|em|u|b|i|a|span)\b/i', $enHtml);
        $fresh = !empty($row['fresh']) || (!preg_match('/\p{Cyrillic}/u', $uk) && st_i18n_norm_en($uk) === st_i18n_norm_en($en));
        $normEn = st_i18n_norm_en($en);
        $normPrev = st_i18n_norm_en($prev);
        $pendingRow = $ledger['byEn'][$normEn] ?? ($normPrev !== '' ? ($ledger['byEn'][$normPrev] ?? null) : null);
        $marked = !empty($row['retry']);
        if (!$marked && $xid !== '') {
            foreach ($docs as $html) {
                if (!is_string($html) || !str_contains($html, 'data-st-xid="' . $xid . '"')) continue;
                $span = st_i18n_xid_span($html, $xid);
                if ($span !== null && str_contains($span['open'], 'data-st-untranslated')) $marked = true;
                break;
            }
        }
        if (!$marked && $uk !== '' && isset($overlay[$uk]) && is_array($overlay[$uk]) && ($overlay[$uk]['u'] ?? '') === '1') {
            $ovEn = st_i18n_norm_en((string) ($overlay[$uk]['en'] ?? ''));
            if ($ovEn !== '' && ($ovEn === $normEn || ($normPrev !== '' && $ovEn === $normPrev))) $marked = true;
        }
        $retry = $marked || (is_array($pendingRow) && !empty($pendingRow['pending']));
        $sameWords = !$fresh && $prev !== '' && $normEn === $normPrev;
        if ($sameWords && !$rich && !$retry) continue;
        if (preg_match('/\p{Cyrillic}/u', $en) && !preg_match('/[A-Za-z]/', $en)) continue;
        if ($sameWords && $rich && !$retry) {
            $held = $ledger['byEn'][st_i18n_norm_en($prev)] ?? null;
            if (is_array($held) && (!empty($held['ukLock']) || !empty($held['ruLock']))) {
                if ($xid !== '') st_i18n_docs_replace($docs, $xid, '', '', null, ['data-st-enhtml' => $enHtml]);
                $locked++;
                continue;
            }
        }

        $lock = $ledger['byEn'][st_i18n_norm_en($prev)] ?? null;
        if (!$sameWords && is_array($lock) && (!empty($lock['ukLock']) || !empty($lock['ruLock']))) {
            $replacedManual++;
        }
        $ukGot = $rich ? st_i18n_auto_markup($enHtml, 'uk') : st_i18n_auto($en, 'uk', false);
        $ruGot = $rich ? st_i18n_auto_markup($enHtml, 'ru') : st_i18n_auto($en, 'ru', false);
        $ukOk = !empty($ukGot['ok']) && st_i18n_plain((string) ($ukGot['text'] ?? '')) !== '';
        $ruOk = !empty($ruGot['ok']) && st_i18n_plain((string) ($ruGot['text'] ?? '')) !== '';
        if (!$ukOk) {
            $pending++;
            $keepWords = $sameWords && !$retry && preg_match('/\p{Cyrillic}/u', $uk);
            $failAttrs = [];
            if ($rich) $failAttrs['data-st-enhtml'] = $enHtml;
            if (!$keepWords) $failAttrs['data-st-untranslated'] = '1';
            if ($xid !== '' && $failAttrs !== []) st_i18n_docs_replace($docs, $xid, '', '', null, $failAttrs);
            $put($uk, $en, st_i18n_current_ru($uk, $overlay), !$keepWords);
            $ledger['byEn'][st_i18n_norm_en($en)] = [
                'en' => $en,
                'uk' => $uk,
                'ru' => st_i18n_current_ru($uk, $overlay),
                'ukLock' => $keepWords ? (int) ($lock['ukLock'] ?? 0) : 0,
                'ruLock' => $keepWords ? (int) ($lock['ruLock'] ?? 0) : 0,
                'pending' => $keepWords ? 0 : 1,
            ];
            continue;
        }
        $newUkHtml = $rich ? st_i18n_clean_rich((string) $ukGot['text']) : '';
        $newRuHtml = $rich && $ruOk ? st_i18n_clean_rich((string) $ruGot['text']) : '';
        $newUk = $rich ? st_i18n_plain($newUkHtml) : st_i18n_plain((string) $ukGot['text']);
        $newRu = $rich ? ($ruOk ? st_i18n_plain($newRuHtml) : '') : ($ruOk ? st_i18n_plain((string) $ruGot['text']) : '');
        if ($newUk === '') $newUk = $en;
        if ($newRu === '') $newRu = st_i18n_current_ru($uk, $overlay);
        if (!$ruOk) $pending++;
        $attrs = ['data-st-lock' => null, 'data-st-untranslated' => $ruOk ? null : '1', 'data-st-enmark' => null];
        if ($rich) {
            $attrs['data-st-enhtml'] = $enHtml;
            if ($newRuHtml !== '') $attrs['data-st-ruhtml'] = $newRuHtml;
            st_i18n_docs_replace($docs, $xid, $fresh ? $uk : '', $newUk, $newUkHtml, $attrs);
            if ($newRuHtml !== '') st_i18n_fragment_pairs($overlay, $newUkHtml, $enHtml, $newRuHtml);
            $touch = true;
        } else {
            st_i18n_docs_replace($docs, $xid, $uk, $newUk, null, $attrs);
        }
        $put($newUk, $en, $newRu, !$ruOk);
        $ledger['byEn'][st_i18n_norm_en($en)] = [
            'en' => $en, 'uk' => $newUk, 'ru' => $newRu, 'ukLock' => 0, 'ruLock' => 0, 'pending' => $ruOk ? 0 : 1,
        ];
        $translated++;
    }

    if (is_array($meta)) {
        foreach (['title', 'desc', 'ogtitle'] as $key) {
            if (!array_key_exists($key, $meta)) continue;
            $val = st_i18n_plain((string) $meta[$key]);
            $uk = st_i18n_plain((string) ($metaUk[$key] ?? ''));
            if ($val === '') continue;
            $lang = $metaLang === 'ru' || $metaLang === 'uk' ? $metaLang : 'en';
            if ($lang === 'uk') {
                if ($uk !== '' && $val !== $uk) {
                    $src = st_i18n_current_en($uk, $overlay);
                    $put($val, $src, st_i18n_current_ru($uk, $overlay), false);
                    if ($src !== '') {
                        $slot = $ledger['byEn'][st_i18n_norm_en($src)] ?? ['en' => $src, 'uk' => $val, 'ru' => '', 'ukLock' => 0, 'ruLock' => 0, 'pending' => 0];
                        $slot['uk'] = $val;
                        $slot['en'] = $src;
                        $slot['ukLock'] = 1;
                        $ledger['byEn'][st_i18n_norm_en($src)] = $slot;
                    }
                    $meta[$key] = $val;
                    $locked++;
                }
                continue;
            }
            if ($lang === 'ru') {
                if ($uk === '') continue;
                $src = st_i18n_current_en($uk, $overlay);
                $put($uk, $src, $val, false);
                if ($src !== '') {
                    if (!isset($ledger['byEn'][st_i18n_norm_en($src)])) {
                        $ledger['byEn'][st_i18n_norm_en($src)] = ['en' => $src, 'uk' => $uk, 'ru' => $val, 'ukLock' => 0, 'ruLock' => 1, 'pending' => 0];
                    } else {
                        $ledger['byEn'][st_i18n_norm_en($src)]['ru'] = $val;
                        $ledger['byEn'][st_i18n_norm_en($src)]['ruLock'] = 1;
                    }
                }
                $locked++;
                unset($meta[$key]);
                continue;
            }
            $prev = $uk !== '' ? st_i18n_current_en($uk, $overlay) : '';
            $normVal = st_i18n_norm_en($val);
            $metaRetry = !empty($metaUk['_retry']);
            if (!$metaRetry) $metaRetry = is_array($ledger['byEn'][$normVal] ?? null) && !empty($ledger['byEn'][$normVal]['pending']);
            if (!$metaRetry && $uk !== '' && isset($overlay[$uk]) && is_array($overlay[$uk]) && ($overlay[$uk]['u'] ?? '') === '1') {
                if (st_i18n_norm_en((string) ($overlay[$uk]['en'] ?? '')) === $normVal) $metaRetry = true;
            }
            if ($prev !== '' && st_i18n_norm_en($prev) === $normVal && !$metaRetry) {
                unset($meta[$key]);
                continue;
            }
            $ukGot = st_i18n_auto($val, 'uk', false);
            $ruGot = st_i18n_auto($val, 'ru', false);
            if (!$ukGot['ok'] || !$ruGot['ok']) {
                $pending++;
                if ($uk !== '') $put($uk, $val, st_i18n_current_ru($uk, $overlay), true);
                $ledger['byEn'][$normVal] = [
                    'en' => $val,
                    'uk' => $uk !== '' ? $uk : $val,
                    'ru' => $uk !== '' ? st_i18n_current_ru($uk, $overlay) : '',
                    'ukLock' => 0,
                    'ruLock' => 0,
                    'pending' => 1,
                ];
                unset($meta[$key]);
                continue;
            }
            $newUk = st_i18n_plain($ukGot['text']);
            $newRu = st_i18n_plain($ruGot['text']);
            if ($newUk === '') $newUk = $val;
            $put($newUk, $val, $newRu, false);
            $ledger['byEn'][st_i18n_norm_en($val)] = [
                'en' => $val, 'uk' => $newUk, 'ru' => $newRu, 'ukLock' => 0, 'ruLock' => 0, 'pending' => 0,
            ];
            $meta[$key] = $newUk;
            $translated++;
        }
    }

    foreach ($docs as $k => $html) {
        if (is_string($html)) $docs[$k] = preg_replace('/\sdata-st-xid="[a-z0-9]+"/i', '', $html) ?? $html;
    }
    if ($touch) st_i18n_overlay_save($overlay);
    st_i18n_source_save($ledger);
    if ($replacedManual > 0) {
        $warnings[] = $replacedManual === 1
            ? 'One manual Ukrainian or Russian edit was translated again because its English changed.'
            : $replacedManual . ' manual Ukrainian or Russian edits were translated again because their English changed.';
    }
    if ($pending > 0) {
        $warnings[] = $pending === 1
            ? 'One English change could not be fully translated, so it is marked. ' . st_i18n_retry_hint()
            : $pending . ' English changes could not be fully translated, so they are marked. ' . st_i18n_retry_hint();
    }
    $note = 'Saved. This version is on the site.';
    if ($translated > 0) $note = 'Saved. English changes were translated into Ukrainian and Russian.';
    elseif ($locked > 0 && $pending === 0) $note = 'Saved. That wording stays for this language until its English text changes.';
    if ($warnings !== []) $note = implode(' ', $warnings);
    if ($translated > 0 && $warnings !== []) $note = 'Saved. English changes were translated into Ukrainian and Russian. ' . implode(' ', $warnings);

    return [
        'docs' => $docs,
        'meta' => $meta,
        'warnings' => $warnings,
        'pending' => $pending,
        'translated' => $translated,
        'locked' => $locked,
        'note' => $note,
    ];
}

/** English stored for a Ukrainian string that is still waiting on a translation. */
function st_i18n_pending_en_for(string $uk, array $ledger, array $overlay): string
{
    $uk = st_i18n_plain($uk);
    if ($uk === '') return '';
    if (isset($overlay[$uk]) && is_array($overlay[$uk]) && ($overlay[$uk]['u'] ?? '') === '1') {
        $en = st_i18n_plain((string) ($overlay[$uk]['en'] ?? ''));
        if ($en !== '') return $en;
    }
    foreach ($ledger['byEn'] ?? [] as $row) {
        if (!is_array($row) || empty($row['pending'])) continue;
        $en = st_i18n_plain((string) ($row['en'] ?? ''));
        if ($en === '') continue;
        $rowUk = st_i18n_plain((string) ($row['uk'] ?? ''));
        if ($rowUk === $uk || $en === $uk) return $en;
    }
    return '';
}

function st_i18n_norm_nl(string $text): string
{
    return str_replace("\r\n", "\n", $text);
}

function st_i18n_keep_newlines(string $original, string $next): string
{
    if (!str_contains($original, "\r\n")) return $next;
    $next = str_replace("\r\n", "\n", $next);
    return str_replace("\n", "\r\n", $next);
}

/**
 * Translate every English sentence that previously failed.
 * Pages, the layout, partials, and pending page titles are included.
 */
function st_i18n_retry_pending(): array
{
    $docs = [];
    $pages = [];
    foreach (glob(ST_PAGES . '/*.html') ?: [] as $file) {
        $id = basename($file, '.html');
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) continue;
        $raw = (string) file_get_contents($file);
        try {
            [$meta, $body] = st_cms_parse($raw);
        } catch (Throwable) {
            continue;
        }
        $docs['page:' . $id] = $body;
        $pages[$id] = ['path' => $file, 'meta' => $meta, 'metaOrig' => $meta, 'body' => $body, 'raw' => $raw];
    }
    $layoutRaw = is_file(ST_LAYOUT) ? (string) file_get_contents(ST_LAYOUT) : '';
    if ($layoutRaw !== '') $docs['layout'] = $layoutRaw;
    $partials = [];
    foreach (glob(ST_PARTIALS . '/*.html') ?: [] as $file) {
        $name = basename($file);
        $raw = (string) file_get_contents($file);
        $docs['partial:' . $name] = $raw;
        $partials[$name] = ['path' => $file, 'raw' => $raw];
    }

    $ledger = st_i18n_source_load();
    $overlay = st_i18n_overlay_load();
    $metaJobs = [];
    foreach ($pages as $id => $info) {
        foreach (['title', 'desc', 'ogtitle'] as $key) {
            $stored = st_i18n_plain((string) ($info['meta'][$key] ?? ''));
            if ($stored === '') continue;
            $en = st_i18n_pending_en_for($stored, $ledger, $overlay);
            if ($en === '') continue;
            $metaJobs[$id][$key] = ['en' => $en, 'uk' => $stored];
        }
    }

    $applied = st_i18n_apply_documents($docs, []);
    $docs = is_array($applied['docs'] ?? null) ? $applied['docs'] : $docs;
    $translated = (int) ($applied['translated'] ?? 0);
    $pending = (int) ($applied['pending'] ?? 0);

    foreach ($metaJobs as $id => $fields) {
        if (!isset($pages[$id])) continue;
        $metaIn = [];
        $metaUk = ['_retry' => '1'];
        foreach ($fields as $key => $job) {
            $metaIn[$key] = $job['en'];
            $metaUk[$key] = $job['uk'];
        }
        $metaApplied = st_i18n_apply_documents([], [], $metaIn, 'en', $metaUk);
        $translated += (int) ($metaApplied['translated'] ?? 0);
        $pending += (int) ($metaApplied['pending'] ?? 0);
        if (!is_array($metaApplied['meta'] ?? null)) continue;
        foreach (['title', 'desc', 'ogtitle'] as $key) {
            if (!empty($metaApplied['meta'][$key])) {
                $pages[$id]['meta'][$key] = st_i18n_plain((string) $metaApplied['meta'][$key]);
            }
        }
    }

    $changedPages = [];
    $layoutChanged = false;
    $partialChanged = false;
    if (!st_i18n_dry()) {
        foreach ($pages as $id => $info) {
            $newBody = (string) ($docs['page:' . $id] ?? $info['body']);
            $bodyChanged = st_i18n_norm_nl($newBody) !== st_i18n_norm_nl($info['body']);
            $metaChanged = false;
            foreach (['title', 'desc', 'ogtitle'] as $key) {
                $before = st_i18n_plain((string) ($info['metaOrig'][$key] ?? ''));
                $after = st_i18n_plain((string) ($info['meta'][$key] ?? ''));
                if ($before !== $after) $metaChanged = true;
            }
            if (!$bodyChanged && !$metaChanged) continue;
            $dump = st_i18n_keep_newlines($info['raw'], st_cms_dump($pages[$id]['meta'], $newBody));
            st_cms_atomic_write($info['path'], $dump, true);
            $changedPages[] = $id;
        }
        if ($layoutRaw !== '' && isset($docs['layout'])) {
            $newLayout = (string) $docs['layout'];
            if (st_i18n_norm_nl($newLayout) !== st_i18n_norm_nl($layoutRaw)
                && str_contains($newLayout, '{{CONTENT}}')
                && str_contains($newLayout, '{{NAV_company}}')
                && str_contains($newLayout, '{{NAV_contact}}')) {
                $newLayout = st_i18n_keep_newlines($layoutRaw, $newLayout);
                if (function_exists('st_builder_write_layout')) st_builder_write_layout($newLayout);
                else st_cms_atomic_write(ST_LAYOUT, $newLayout, true);
                $layoutChanged = true;
            }
        }
        foreach ($partials as $name => $info) {
            if (!isset($docs['partial:' . $name])) continue;
            $newPartial = (string) $docs['partial:' . $name];
            if (st_i18n_norm_nl($newPartial) === st_i18n_norm_nl($info['raw'])) continue;
            st_cms_atomic_write($info['path'], st_i18n_keep_newlines($info['raw'], $newPartial), true);
            $partialChanged = true;
        }
        if ($layoutChanged || $partialChanged || count($changedPages) > 1) st_cms_publish();
        elseif (count($changedPages) === 1) st_cms_publish_page($changedPages[0], false);
    }

    if ($translated === 0 && $pending === 0) {
        $note = 'No sentences are waiting for a translation.';
    } elseif ($translated > 0 && $pending === 0) {
        $note = $translated === 1
            ? 'One waiting sentence was translated into Ukrainian and Russian.'
            : $translated . ' waiting sentences were translated into Ukrainian and Russian.';
    } elseif ($translated === 0) {
        $note = $pending === 1
            ? 'One sentence is still waiting. ' . st_i18n_retry_hint()
            : $pending . ' sentences are still waiting. ' . st_i18n_retry_hint();
    } else {
        $note = $translated . ' waiting sentences were translated. ' . $pending . ' are still marked. ' . st_i18n_retry_hint();
    }

    $out = [
        'ok' => true,
        'note' => $note,
        'i18nNote' => $note,
        'i18nPending' => $pending,
        'translated' => $translated,
    ];
    if (!st_i18n_dry() && function_exists('st_cms_with_pending')) $out = st_cms_with_pending($out);
    return $out;
}
