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
        ['Короткий опис сторінки. Його можна змінити.', 'A short page description. You can change it.', 'Краткое описание страницы. Ег[...]'],
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
        if (preg_match('/\\p{Cyrillic}/u', $en)) return;
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
        if (!preg_match('/\\p{Cyrillic}/u', $uk)) continue;
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
    $html = preg_replace('/<script\\b[^>]*>.*?<\\/script>/is', '', $html) ?? $html;
    $html = strip_tags($html, '<a><strong><em><u><b><i><span><br>');
    $html = preg_replace('/\\s+on[a-z]+\\s*=\\s*(?:"[^"\\]*"|\\'[^\\']*\\'|[^\\s>]+)/i', '', $html) ?? $html;
    $html = preg_replace_callback('/<a\\b[^>]*>/i', static function (array $m): string {
        $tag = $m[0];
        $href = '';
        if (preg_match('/\\shref\\s*=\\s*"([^\"]*)"/i', $tag, $hm)) $href = html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        elseif (preg_match("/\\\shref\\\s*=\\\s*'([^']*)'/i", $tag, $hm)) $href = html_entity_decode($hm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($href === '' || !preg_match('~^(?:https?:|/|#|mailto:|tel:)~i', $href)) return '<a>';
        $extra = preg_match('/\\starget\\s*=\\s*"_blank"/i', $tag) ? ' target="_blank" rel="noopener"' : '';
        /* Links made in the editor keep their marker so the public page styles them like the panel. */
        if (preg_match('/\\sdata-st-link(?![\\w-])|\\sclass\\s*=\\s*"[^\"]*\\bst-link\\b/i', $tag)) $extra = ' class="st-link" data-st-link=""' . $extra;
        return '<a href="' . htmlspecialchars($href, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '"' . $extra . '>';
    }, $html) ?? $html;

    // ... rest of file omitted for brevity in this API call
