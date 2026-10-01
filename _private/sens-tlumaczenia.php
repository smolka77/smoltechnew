<?php
declare(strict_types=1);

const ST_I18N_SENSE_JSON = ST_ROOT . '/_private/slownik-jezyk.json';
const ST_I18N_SENSE_DICT = ST_ROOT . '/assets/js/tlumaczenia.js';
const ST_I18N_SENSE_GEN = 's2';

function st_i18n_sense_norm(string $text): string
{
    $t = str_replace(["\u{00a0}", "\u{2019}", "\u{2018}", "\u{2013}"], [' ', "'", "'", '-'], $text);
    $t = preg_replace('/\s+/u', ' ', $t) ?? $t;
    return trim($t);
}

function st_i18n_sense_unescape(string $s): string
{
    return str_replace(["\\'", '\\"', '\\n', '\\\\'], ["'", '"', "\n", '\\'], $s);
}

function st_i18n_sense_glossary(): array
{
    static $g = null;
    static $mtime = null;
    $now = is_file(ST_I18N_SENSE_JSON) ? @filemtime(ST_I18N_SENSE_JSON) : false;
    if ($g !== null && $mtime === $now) return $g;
    $data = [
        'brands' => [],
        'units' => [],
        'phrases' => [],
        'polish' => [],
        'cacheGen' => ST_I18N_SENSE_GEN,
    ];
    if (is_file(ST_I18N_SENSE_JSON)) {
        $raw = json_decode((string) file_get_contents(ST_I18N_SENSE_JSON), true);
        if (is_array($raw)) $data = array_merge($data, $raw);
    }
    $phrases = [];
    foreach ($data['phrases'] ?? [] as $pair) {
        if (is_array($pair) && isset($pair[0], $pair[1]) && $pair[0] && $pair[1]) {
            $phrases[] = [(string) $pair[0], (string) $pair[1]];
        }
    }
    usort($phrases, static fn ($a, $b) => strlen($b[0]) <=> strlen($a[0]));
    $polish = [];
    foreach ($data['polish'] ?? [] as $pair) {
        if (is_array($pair) && isset($pair[0], $pair[1]) && $pair[0] && $pair[1]) {
            $polish[] = [(string) $pair[0], (string) $pair[1]];
        }
    }
    usort($polish, static fn ($a, $b) => strlen($b[0]) <=> strlen($a[0]));
    $brands = [];
    foreach ($data['brands'] ?? [] as $b) {
        if ($b) $brands[] = (string) $b;
    }
    usort($brands, static fn ($a, $b) => strlen($b) <=> strlen($a));
    $units = [];
    foreach ($data['units'] ?? [] as $pair) {
        if (is_array($pair) && isset($pair[0], $pair[1])) $units[] = [(string) $pair[0], (string) $pair[1]];
    }
    $g = [
        'brands' => $brands,
        'units' => $units,
        'phrases' => $phrases,
        'polish' => $polish,
        'cacheGen' => (string) ($data['cacheGen'] ?? ST_I18N_SENSE_GEN),
    ];
    $mtime = $now;
    return $g;
}

function st_i18n_sense_gen(): string
{
    return st_i18n_sense_glossary()['cacheGen'] ?: ST_I18N_SENSE_GEN;
}

function st_i18n_sense_house(): array
{
    static $house = null;
    static $mtime = null;
    $now = is_file(ST_I18N_SENSE_DICT) ? @filemtime(ST_I18N_SENSE_DICT) : false;
    if ($house !== null && $mtime === $now) return $house;
    $out = [];
    if (is_file(ST_I18N_SENSE_DICT)) {
        $js = (string) file_get_contents(ST_I18N_SENSE_DICT);
        $start = strpos($js, 'var D = {');
        $end = $start === false ? false : strpos($js, 'var P = {', $start + 1);
        $block = ($start !== false && $end !== false) ? substr($js, $start, $end - $start) : '';
        if ($block !== '' && preg_match_all("/(['\"])((?:\\\\.|(?!\\1).)*)\\1\\s*:\\s*(['\"])((?:\\\\.|(?!\\3).)*)\\3/u", $block, $m, PREG_SET_ORDER)) {
            foreach ($m as $row) {
                $uk = trim(st_i18n_sense_unescape($row[2]));
                $en = trim(st_i18n_sense_unescape($row[4]));
                if ($uk === '' || $en === '' || !preg_match('/\p{Cyrillic}/u', $uk)) continue;
                if (preg_match('/\p{Cyrillic}/u', $en) || mb_strlen($en) < 2) continue;
                $key = st_i18n_sense_norm($en);
                if (!isset($out[$key])) $out[$key] = $uk;
                $low = mb_strtolower($key);
                if (!isset($out[$low])) $out[$low] = $uk;
            }
        }
    }
    $house = $out;
    $mtime = $now;
    return $out;
}

function st_i18n_sense_uk_en(string $text): string
{
    static $table = null;
    static $mtime = null;
    $now = is_file(ST_I18N_SENSE_DICT) ? @filemtime(ST_I18N_SENSE_DICT) : false;
    if ($table === null || $mtime !== $now) {
        $table = [];
        if (is_file(ST_I18N_SENSE_DICT)) {
            $js = (string) file_get_contents(ST_I18N_SENSE_DICT);
            $start = strpos($js, 'var D = {');
            $end = $start === false ? false : strpos($js, 'var P = {', $start + 1);
            $block = ($start !== false && $end !== false) ? substr($js, $start, $end - $start) : '';
            if ($block !== '' && preg_match_all("/(['\"])((?:\\\\.|(?!\\1).)*)\\1\\s*:\\s*(['\"])((?:\\\\.|(?!\\3).)*)\\3/u", $block, $m, PREG_SET_ORDER)) {
                foreach ($m as $row) {
                    $uk = trim(st_i18n_sense_unescape($row[2]));
                    $en = trim(st_i18n_sense_unescape($row[4]));
                    if ($uk === '' || $en === '' || !preg_match('/\p{Cyrillic}/u', $uk)) continue;
                    if (preg_match('/\p{Cyrillic}/u', $en) || mb_strlen($en) < 2) continue;
                    if (!isset($table[$uk])) $table[$uk] = $en;
                    $n = st_i18n_sense_norm($uk);
                    if ($n !== '' && !isset($table[$n])) $table[$n] = $en;
                }
            }
        }
        $mtime = $now;
    }
    $t = st_i18n_sense_norm($text);
    return $table[$text] ?? $table[$t] ?? '';
}

function st_i18n_sense_cap(string $src, string $uk): string
{
    if ($src === '' || $uk === '') return $uk;
    $s0 = mb_substr($src, 0, 1);
    $u0 = mb_substr($uk, 0, 1);
    if ($s0 !== '' && $u0 !== '' && $s0 === mb_strtoupper($s0) && $u0 === mb_strtolower($u0)) {
        return mb_strtoupper($u0) . mb_substr($uk, 1);
    }
    return $uk;
}

function st_i18n_sense_exact(string $text): string
{
    $t = st_i18n_sense_norm($text);
    if ($t === '') return '';
    $house = st_i18n_sense_house();
    if (isset($house[$t])) return $house[$t];
    $low = mb_strtolower($t);
    if (isset($house[$low])) return $house[$low];
    foreach (st_i18n_sense_glossary()['phrases'] as [$en, $uk]) {
        if (mb_strtolower($t) === mb_strtolower($en)) return st_i18n_sense_cap($t, $uk);
    }
    return '';
}

function st_i18n_sense_protect(string $text): array
{
    $g = st_i18n_sense_glossary();
    $tokens = [];
    $out = $text;
    foreach ($g['brands'] as $brand) {
        $out = preg_replace_callback(
            '/(?<![A-Za-z0-9])' . preg_quote($brand, '/') . '(?![A-Za-z0-9])/',
            static function ($m) use (&$tokens) {
                $tokens[] = $m[0];
                return ' ZBR' . (count($tokens) - 1) . 'Z ';
            },
            $out
        ) ?? $out;
    }
    return [$out, $tokens];
}

function st_i18n_sense_restore(string $text, array $tokens): string
{
    $out = $text;
    foreach ($tokens as $i => $chunk) {
        $out = preg_replace('/\s*ZBR\s*' . $i . '\s*Z\s*/i', $chunk, $out) ?? $out;
    }
    return trim(preg_replace('/ {2,}/', ' ', $out) ?? $out);
}

function st_i18n_sense_phrases(string $text): string
{
    $out = $text;
    foreach (st_i18n_sense_glossary()['phrases'] as [$en, $uk]) {
        $out = preg_replace('/(?<![A-Za-z])' . preg_quote($en, '/') . '(?![A-Za-z])/iu', $uk, $out) ?? $out;
    }
    return $out;
}

function st_i18n_sense_units(string $text): string
{
    $out = $text;
    foreach (st_i18n_sense_glossary()['units'] as [$en, $uk]) {
        $out = preg_replace('/(?<![A-Za-z])' . preg_quote($en, '/') . '(?![A-Za-z])/', $uk, $out) ?? $out;
    }
    return $out;
}

function st_i18n_sense_polish(string $uk, string $en = ''): string
{
    $out = trim($uk);
    if ($out === '') return $out;
    foreach (st_i18n_sense_glossary()['polish'] as [$src, $dst]) {
        $out = preg_replace('/' . preg_quote($src, '/') . '/iu', $dst, $out) ?? $out;
    }
    if ($en !== '' && preg_match('/\bCDM\b/i', $en)) {
        $out = preg_replace('/апарати\s+CDM/iu', 'пристрої CDM', $out) ?? $out;
        $out = preg_replace('/апарат\s+CDM/iu', 'пристрій CDM', $out) ?? $out;
    }
    if ($en !== '' && preg_match('/\bwelder/i', $en) && !preg_match('/\boperator/i', $en)) {
        $out = str_replace(['зварювальників', 'зварювальники', 'зварювальника', 'зварювальник'], ['машин', 'машини', 'машини', 'машина'], $out);
    }
    $out = st_i18n_sense_units($out);
    $out = str_replace("'", 'ʼ', $out);
    return trim(preg_replace('/ {2,}/', ' ', $out) ?? $out);
}

function st_i18n_sense_still_en(string $text): bool
{
    $t = preg_replace('/ZBR\d+Z/i', ' ', $text) ?? $text;
    $g = st_i18n_sense_glossary();
    foreach ($g['brands'] as $brand) {
        $t = preg_replace('/(?<![A-Za-z0-9])' . preg_quote($brand, '/') . '(?![A-Za-z0-9])/', ' ', $t) ?? $t;
    }
    foreach ($g['units'] as [$en]) {
        $t = preg_replace('/(?<![A-Za-z])' . preg_quote($en, '/') . '(?![A-Za-z])/', ' ', $t) ?? $t;
    }
    $t = preg_replace('/[\d.,\-–—×xX\/%°]+/u', ' ', $t) ?? $t;
    return (bool) preg_match('/[A-Za-z]{3,}/', $t);
}

function st_i18n_sense_prepare(string $text): array
{
    [$protected, $tokens] = st_i18n_sense_protect($text);
    return [st_i18n_sense_phrases($protected), $tokens];
}

function st_i18n_sense_finish(string $uk, array $tokens, string $en): string
{
    return st_i18n_sense_cap($en, st_i18n_sense_polish(st_i18n_sense_restore($uk, $tokens), $en));
}

function st_i18n_sense_pack(array $items): string
{
    $lines = [];
    foreach ($items as $i => $t) $lines[] = '[' . ($i + 1) . '] ' . $t;
    return implode("\n", $lines);
}

function st_i18n_sense_unpack(string $raw, int $n): ?array
{
    $parts = preg_split('/\[\s*(\d+)\s*\]\s*/', $raw, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) return null;
    $found = [];
    for ($i = 1; $i + 1 < count($parts); $i += 2) {
        if (ctype_digit($parts[$i])) $found[(int) $parts[$i]] = trim($parts[$i + 1]);
    }
    if (count($found) !== $n) return null;
    $out = [];
    for ($i = 1; $i <= $n; $i++) {
        if (!isset($found[$i])) return null;
        $out[] = $found[$i];
    }
    return $out;
}
