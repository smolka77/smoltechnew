<?php
declare(strict_types=1);

const ST_I18N_CACHE = ST_ROOT . '/_build/cache-tlumaczen.json';
const ST_I18N_JSON = ST_ROOT . '/_build/nakladka-jezyk.json';
const ST_I18N_JS = ST_ROOT . '/assets/js/nakladka-jezyk.js';

require_once __DIR__ . '/sens-tlumaczenia.php';

function st_i18n_skip(string $text, string $source = 'uk'): bool
{
    $t = trim($text);
    if (mb_strlen($t) < 2) return true;
    if ($source === 'uk') {
        if (!preg_match('/\p{Cyrillic}/u', $t)) return true;
    } elseif (!preg_match('/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/u', $t)) {
        return true;
    }
    if (preg_match('~https?://|www\.|@~i', $t)) return true;
    if (preg_match('/^[\d\s+().\/\-]+$/', $t)) return true;
    if (preg_match('/^[A-Za-z0-9_-]{11}$/', $t)) return true;
    if (preg_match('/\.(jpg|jpeg|png|webp|gif|svg|html|js|css)(\?|$)/i', $t)) return true;
    return false;
}

function st_i18n_usable(string $source, string $translated): bool
{
    $from = trim($source);
    $to = trim($translated);
    if ($to === '' || $to === $from) return false;
    if (preg_match("/<\\s*html|we're sorry|mymemory warning|quota finished|used all available/i", $to)) return false;
    return true;
}

function st_i18n_http(string $url): string
{
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 8,
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r\nAccept: application/json,text/plain,*/*\r\n",
            'follow_location' => 1,
            'ignore_errors' => true,
        ],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    return $raw === false ? '' : $raw;
}

function st_i18n_parse_google(string $raw): string
{
    $trim = ltrim($raw);
    if ($trim === '' || str_starts_with($trim, '<')) return '';
    $data = json_decode($raw, true);
    if (!is_array($data)) return '';
    if (isset($data[0]) && is_string($data[0])) {
        $bits = [];
        foreach ($data as $chunk) {
            if (is_string($chunk)) $bits[] = $chunk;
        }
        return trim(implode('', $bits));
    }
    if (!isset($data[0]) || !is_array($data[0])) return '';
    $bits = [];
    foreach ($data[0] as $chunk) {
        if (is_array($chunk) && isset($chunk[0]) && is_string($chunk[0])) $bits[] = $chunk[0];
    }
    return trim(implode('', $bits));
}

function st_i18n_google(string $text, string $target, string $endpoint, string $source = 'uk'): string
{
    $q = rawurlencode($text);
    $sl = $source ?: 'uk';
    $url = $endpoint === 'chrome'
        ? "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={$sl}&tl={$target}&q={$q}"
        : "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$sl}&tl={$target}&dt=t&q={$q}";
    return st_i18n_parse_google(st_i18n_http($url));
}

function st_i18n_mymemory(string $text, string $target, string $source = 'uk'): string
{
    $sl = $source ?: 'uk';
    $url = 'https://api.mymemory.translated.net/get?q=' . rawurlencode(mb_substr($text, 0, 450)) . '&langpair=' . $sl . '|' . $target;
    $data = json_decode(st_i18n_http($url), true);
    if (!is_array($data)) return '';
    $translated = trim((string) ($data['responseData']['translatedText'] ?? ''));
    if ($translated === '' || (int) ($data['responseStatus'] ?? 0) !== 200) return '';
    return $translated;
}

function st_i18n_once(string $text, string $target, string $source = 'uk'): string
{
    if ($source === 'en' && $target === 'uk') {
        $exact = st_i18n_sense_exact($text);
        if ($exact !== '') return $exact;
        [$mixed, $tokens] = st_i18n_sense_prepare($text);
        if (!st_i18n_sense_still_en($mixed)) {
            return st_i18n_sense_finish($mixed, $tokens, $text);
        }
        $got = st_i18n_raw($mixed, $target, $source);
        if (!st_i18n_usable($text, $got) && $mixed !== $text) {
            $got = st_i18n_raw($text, $target, $source);
        }
        if (!st_i18n_usable($text, $got)) return $text;
        return st_i18n_sense_finish($got, $tokens, $text);
    }
    return st_i18n_raw($text, $target, $source);
}

function st_i18n_raw(string $text, string $target, string $source = 'uk'): string
{
    $payload = mb_strlen($text) > 1500 ? mb_substr($text, 0, 1500) : $text;
    if (preg_match('/\[\d+\]/', $text)) $payload = mb_substr($text, 0, 4000);
    foreach (['chrome', 'gtx'] as $ep) {
        try {
            $got = st_i18n_google($payload, $target, $ep, $source);
            if (st_i18n_usable($text, $got)) return trim($got);
        } catch (Throwable $e) {
        }
    }
    try {
        $got = st_i18n_mymemory($payload, $target, $source);
        if (st_i18n_usable($text, $got)) return trim($got);
    } catch (Throwable $e) {
    }
    return $text;
}

function st_i18n_pair_key(string $source, string $target, string $text): string
{
    if ($source === 'en' && $target === 'uk') {
        $lang = 'en-uk-' . st_i18n_sense_gen();
    } else {
        $lang = $source === 'uk' ? $target : $source . '-' . $target;
    }
    return $lang . ':' . substr(sha1($text), 0, 16);
}

/** Parallel Google (gtx) lookups via curl_multi; returns only usable hits. */
function st_i18n_batch(array $texts, string $target, string $source): array
{
    $out = [];
    if (!function_exists('curl_multi_init')) return $out;
    $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    foreach (array_chunk($texts, 6) as $chunk) {
        $mh = curl_multi_init();
        $hs = [];
        foreach ($chunk as $t) {
            $payload = mb_strlen($t) > 1500 ? mb_substr($t, 0, 1500) : $t;
            $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$source}&tl={$target}&dt=t&q=" . rawurlencode($payload);
            $h = curl_init($url);
            if ($h === false) continue;
            curl_setopt_array($h, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT => $ua,
                CURLOPT_HTTPHEADER => ['Accept: application/json,text/plain,*/*'],
            ]);
            curl_multi_add_handle($mh, $h);
            $hs[$t] = $h;
        }
        do {
            $st = curl_multi_exec($mh, $running);
            if ($running) curl_multi_select($mh, 1.0);
        } while ($running && $st === CURLM_OK);
        foreach ($hs as $t => $h) {
            $got = st_i18n_parse_google((string) curl_multi_getcontent($h));
            if (st_i18n_usable($t, $got)) $out[$t] = trim($got);
            curl_multi_remove_handle($mh, $h);
            curl_close($h);
        }
        curl_multi_close($mh);
    }
    return $out;
}

function st_i18n_remember(array &$cache, string $source, string $target, string $src, string $got): void
{
    $cache[st_i18n_pair_key($source, $target, $src)] = $got;
    $cache[st_i18n_pair_key($target, $source, $got)] = $src;
    if ($target === 'uk' && $source === 'en') {
        $cache['auth:en:' . substr(sha1($got), 0, 16)] = $src;
    }
}

function st_i18n_many_en_uk(array $texts): array
{
    $out = [];
    $seen = [];
    $todo = [];
    $cache = [];
    if (is_file(ST_I18N_CACHE)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_CACHE), true);
        if (is_array($decoded)) $cache = $decoded;
    }
    $dirty = false;
    foreach ($texts as $raw) {
        $t = trim(preg_replace('/\s+/', ' ', (string) $raw) ?? (string) $raw);
        if ($t === '' || isset($seen[$t])) continue;
        $seen[$t] = true;
        if (st_i18n_skip($t, 'en')) {
            $out[$t] = $t;
            continue;
        }
        $key = st_i18n_pair_key('en', 'uk', $t);
        $hit = $cache[$key] ?? '';
        if (is_string($hit) && st_i18n_usable($t, $hit)) {
            $out[$t] = $hit;
            st_i18n_remember($cache, 'en', 'uk', $t, $hit);
            $dirty = true;
            continue;
        }
        $exact = st_i18n_sense_exact($t);
        if ($exact !== '') {
            $out[$t] = $exact;
            st_i18n_remember($cache, 'en', 'uk', $t, $exact);
            $dirty = true;
            continue;
        }
        $todo[] = $t;
    }
    $prepared = [];
    foreach ($todo as $t) {
        [$mixed, $tokens] = st_i18n_sense_prepare($t);
        if (!st_i18n_sense_still_en($mixed)) {
            $got = st_i18n_sense_finish($mixed, $tokens, $t);
            $out[$t] = $got;
            st_i18n_remember($cache, 'en', 'uk', $t, $got);
            $dirty = true;
            continue;
        }
        $prepared[] = [$t, $mixed, $tokens];
    }
    foreach (array_chunk($prepared, 8) as $chunk) {
        $mixed = array_map(static fn ($row) => $row[1], $chunk);
        $packed = st_i18n_sense_pack($mixed);
        $raw = st_i18n_raw($packed, 'uk', 'en');
        $unpacked = st_i18n_sense_unpack($raw, count($chunk));
        foreach ($chunk as $i => $row) {
            [$src, $mix, $tokens] = $row;
            $g = ($unpacked[$i] ?? '');
            if ($g !== '' && $g !== $src) {
                $got = st_i18n_sense_finish($g, $tokens, $src);
            } else {
                $got = '';
            }
            if ($got === '' || !st_i18n_usable($src, $got) || st_i18n_sense_still_en($got)) {
                $got = st_i18n_once($src, 'uk', 'en');
            }
            if (st_i18n_usable($src, $got)) {
                st_i18n_remember($cache, 'en', 'uk', $src, $got);
                $dirty = true;
                $out[$src] = $got;
            } else {
                $out[$src] = $src;
            }
        }
    }
    if ($dirty) {
        $cdir = dirname(ST_I18N_CACHE);
        if (!is_dir($cdir)) @mkdir($cdir, 0755, true);
        @file_put_contents(ST_I18N_CACHE, json_encode($cache, JSON_UNESCAPED_UNICODE) . "\n");
    }
    return $out;
}

function st_i18n_many(array $texts, string $source, string $target): array
{
    if ($source === 'en' && $target === 'uk') return st_i18n_many_en_uk($texts);
    $out = [];
    $seen = [];
    $todo = [];
    $cache = [];
    if (is_file(ST_I18N_CACHE)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_CACHE), true);
        if (is_array($decoded)) $cache = $decoded;
    }
    foreach ($texts as $raw) {
        $t = trim(preg_replace('/\s+/', ' ', (string) $raw) ?? (string) $raw);
        if ($t === '' || isset($seen[$t])) continue;
        $seen[$t] = true;
        if (st_i18n_skip($t, $source)) {
            $out[$t] = $t;
            continue;
        }
        $key = st_i18n_pair_key($source, $target, $t);
        $hit = $cache[$key] ?? '';
        if (is_string($hit) && st_i18n_usable($t, $hit)) {
            $out[$t] = $hit;
            continue;
        }
        $todo[$t] = $key;
    }
    if (!$todo) return $out;
    $got = st_i18n_batch(array_keys($todo), $target, $source);
    $dirty = false;
    foreach ($todo as $t => $key) {
        $g = $got[$t] ?? '';
        if (!st_i18n_usable($t, $g)) $g = st_i18n_once($t, $target, $source);
        if (st_i18n_usable($t, $g)) {
            st_i18n_remember($cache, $source, $target, $t, $g);
            $dirty = true;
            $out[$t] = $g;
        } else {
            $out[$t] = $t;
        }
    }
    if ($dirty) {
        $cdir = dirname(ST_I18N_CACHE);
        if (!is_dir($cdir)) @mkdir($cdir, 0755, true);
        @file_put_contents(ST_I18N_CACHE, json_encode($cache, JSON_UNESCAPED_UNICODE) . "\n");
    }
    return $out;
}

function st_i18n_explode(string $s): array
{
    $pieces = [];
    if (str_contains($s, '<')) {
        if (preg_match_all('/(?:aria-label|alt|title|placeholder|data-title|data-ask-topic)="([^"]+)"/', $s, $m)) {
            foreach ($m[1] as $v) $pieces[] = html_entity_decode($v, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        if (preg_match_all('/>([^<]+)</', $s, $m)) {
            foreach ($m[1] as $v) $pieces[] = html_entity_decode($v, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        $pieces[] = st_cms_strip($s);
    } else {
        $pieces[] = $s;
        if (str_contains($s, '|') || str_contains($s, '>>')) {
            foreach (preg_split('/\s*\|\s*|\s*>>\s*/', $s) ?: [] as $p) $pieces[] = $p;
        }
    }
    $out = [];
    $seen = [];
    foreach ($pieces as $p) {
        $p = trim(preg_replace('/\s+/', ' ', html_entity_decode($p, ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? $p);
        if ($p !== '' && !isset($seen[$p])) {
            $seen[$p] = true;
            $out[] = $p;
        }
    }
    return $out;
}

function st_i18n_collect(mixed $node, array &$acc, ?string $key = null): void
{
    static $skip = [
        'id' => true, 'video' => true, 'href' => true, 'image' => true, 'email' => true,
        'url' => true, 'og' => true, 'pl' => true, 'prio' => true, 'nav' => true,
        'out' => true, 'file' => true, 'kind' => true, 'phone' => true, 'phoneTel' => true,
        'youtube' => true, 'instagram' => true, 'company' => true, 'key' => true,
        'phones' => true, 'present' => true, 'src' => true, 'webp' => true, 'label' => true,
        'added' => true, 'alt' => true, 'plain' => true, 'crop' => true, 'section' => true,
    ];
    if ($key !== null && isset($skip[$key])) return;
    if (is_array($node)) {
        $isList = $node === [] || array_keys($node) === range(0, count($node) - 1);
        foreach ($node as $k => $v) {
            st_i18n_collect($v, $acc, $isList ? $key : (string) $k);
        }
        return;
    }
    if (is_string($node)) {
        foreach (st_i18n_explode($node) as $p) $acc[] = $p;
    }
}

function st_i18n_from_page(array $page): array
{
    $acc = [];
    foreach (['meta', 'hero', 'stats', 'areas', 'tiles', 'models', 'films', 'copy', 'mach', 'faq', 'people', 'html'] as $k) {
        if (isset($page[$k])) st_i18n_collect($page[$k], $acc, $k === 'html' ? 'html' : null);
    }
    return $acc;
}

function st_i18n_bump_js(string $stamp): void
{
    $repl = 'nakladka-jezyk.js?v=' . $stamp;
    $skip = ['_src', '_private', '_backup', 'node_modules', '.git'];
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(ST_ROOT, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $f) {
        if (!$f->isFile() || strtolower($f->getExtension()) !== 'html') continue;
        $path = $f->getPathname();
        $ok = true;
        foreach ($skip as $s) {
            if (str_contains($path, DIRECTORY_SEPARATOR . $s . DIRECTORY_SEPARATOR)) {
                $ok = false;
                break;
            }
        }
        if (!$ok) continue;
        $html = (string) file_get_contents($path);
        $nxt = preg_replace('/(?:i18n-cms|nakladka-jezyk)\.js\?v=[^"\']+/', $repl, $html) ?? $html;
        if ($nxt !== $html) file_put_contents($path, $nxt);
    }
}

function st_i18n_write(array $overlay): void
{
    $dir = dirname(ST_I18N_JSON);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $jsDir = dirname(ST_I18N_JS);
    if (!is_dir($jsDir)) mkdir($jsDir, 0755, true);
    file_put_contents(ST_I18N_JSON, json_encode($overlay, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
    file_put_contents(ST_I18N_JS, 'window.ST_I18N_CMS=' . json_encode($overlay, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n");
    st_i18n_bump_js((string) time());
}

function st_i18n_plain(string $s): string
{
    $t = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/<[^>]+>/', ' ', $t) ?? $t;
    $t = str_replace("\u{00A0}", ' ', $t);
    $t = preg_replace('/[\x{2018}\x{2019}\x{02BC}\x{02B9}\x{201B}]/u', "'", $t) ?? $t;
    $t = preg_replace('/[\x{2010}-\x{2015}\x{2212}]/u', '-', $t) ?? $t;
    return trim(preg_replace('/\s+/', ' ', $t) ?? $t);
}

function st_i18n_author_ok(string $uk, string $en): bool
{
    if ($uk === '' || $en === '' || $uk === $en) return false;
    if (st_i18n_skip($uk, 'uk')) return false;
    if (!preg_match('/[A-Za-z]/', $en) || preg_match('/\p{Cyrillic}/u', $en)) return false;
    return true;
}

function st_i18n_author_pairs(array $pairs): int
{
    $overlay = [];
    if (is_file(ST_I18N_JSON)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_JSON), true);
        if (is_array($decoded)) $overlay = $decoded;
    }
    $cache = [];
    if (is_file(ST_I18N_CACHE)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_CACHE), true);
        if (is_array($decoded)) $cache = $decoded;
    }
    $n = 0;
    foreach ($pairs as $row) {
        if (!is_array($row)) continue;
        $ukRaw = (string) ($row['uk'] ?? '');
        $enRaw = (string) ($row['en'] ?? '');
        $items = [];
        $ukPlain = st_i18n_plain($ukRaw);
        $enPlain = st_i18n_plain($enRaw);
        if ($ukPlain !== '' && $enPlain !== '') $items[] = [$ukPlain, $enPlain];
        $uks = str_contains($ukRaw, '<') ? st_i18n_explode($ukRaw) : [];
        $ens = str_contains($enRaw, '<') ? st_i18n_explode($enRaw) : [];
        if (count($uks) === count($ens) && count($uks) > 1) {
            foreach ($uks as $i => $u) $items[] = [st_i18n_plain($u), st_i18n_plain($ens[$i])];
        }
        $seen = [];
        foreach ($items as [$uk, $en]) {
            $sig = $uk . "\n" . $en;
            if (isset($seen[$sig]) || !st_i18n_author_ok($uk, $en)) continue;
            $seen[$sig] = true;
            if (!isset($overlay[$uk]) || !is_array($overlay[$uk])) $overlay[$uk] = [];
            if (($overlay[$uk]['en'] ?? '') === $en && ($overlay[$uk]['a'] ?? '') === '1') continue;
            $overlay[$uk]['en'] = $en;
            $overlay[$uk]['a'] = '1';
            $cache['auth:en:' . substr(sha1($uk), 0, 16)] = $en;
            $cache['en:' . substr(sha1($uk), 0, 16)] = $en;
            $cache[st_i18n_pair_key('en', 'uk', $en)] = $uk;
            $n++;
        }
        $ruPlain = st_i18n_plain((string) ($row['ru'] ?? ''));
        if ($ukPlain !== '' && $ruPlain !== '' && $ruPlain !== $ukPlain && !st_i18n_skip($ukPlain, 'uk')) {
            if (!isset($overlay[$ukPlain]) || !is_array($overlay[$ukPlain])) $overlay[$ukPlain] = [];
            if (($overlay[$ukPlain]['ru'] ?? '') !== $ruPlain) {
                $overlay[$ukPlain]['ru'] = $ruPlain;
                $overlay[$ukPlain]['a'] = '1';
                $cache['auth:ru:' . substr(sha1($ukPlain), 0, 16)] = $ruPlain;
                $n++;
            }
        }
    }
    if ($n) {
        st_i18n_write($overlay);
        $cdir = dirname(ST_I18N_CACHE);
        if (!is_dir($cdir)) mkdir($cdir, 0755, true);
        file_put_contents(ST_I18N_CACHE, json_encode($cache, JSON_UNESCAPED_UNICODE) . "\n");
    }
    return $n;
}

function st_i18n_sync(array $texts): array
{
    $unique = [];
    $seen = [];
    foreach ($texts as $raw) {
        foreach (st_i18n_explode((string) $raw) as $t) {
            $t = trim(preg_replace('/\s+/', ' ', $t) ?? $t);
            if ($t === '' || isset($seen[$t]) || st_i18n_skip($t)) continue;
            $seen[$t] = true;
            $unique[] = $t;
        }
    }
    $overlay = [];
    if (is_file(ST_I18N_JSON)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_JSON), true);
        if (is_array($decoded)) $overlay = $decoded;
    }
    $cache = [];
    if (is_file(ST_I18N_CACHE)) {
        $decoded = json_decode((string) file_get_contents(ST_I18N_CACHE), true);
        if (is_array($decoded)) $cache = $decoded;
    }
    $translated = 0;
    foreach ($unique as $text) {
        if (!isset($overlay[$text]) || !is_array($overlay[$text])) $overlay[$text] = [];
        // Public site: uk (source) + en. The panel edits in English too, so PL is no longer synced.
        foreach (['en'] as $lang) {
            if (($overlay[$text]['a'] ?? '') === '1' && !empty($overlay[$text][$lang])) {
                continue;
            }
            $hash = $lang . ':' . substr(sha1($text), 0, 16);
            $authored = $cache['auth:' . $hash] ?? '';
            if (is_string($authored) && st_i18n_usable($text, $authored)) {
                $overlay[$text][$lang] = $authored;
                $overlay[$text]['a'] = '1';
                continue;
            }
            $dictEn = st_i18n_sense_uk_en($text);
            if ($dictEn !== '') {
                $overlay[$text][$lang] = $dictEn;
                continue;
            }
            // Cache first: it holds the latest wording (incl. reverse pairs from the editor).
            $existing = $cache[$hash] ?? $overlay[$text][$lang] ?? '';
            if (is_string($existing) && st_i18n_usable($text, $existing)) {
                $overlay[$text][$lang] = $existing;
                continue;
            }
            $got = st_i18n_once($text, $lang);
            if (!st_i18n_usable($text, $got)) continue;
            $overlay[$text][$lang] = $got;
            $cache[$hash] = $got;
            $translated++;
        }
    }
    if ($unique || $translated) st_i18n_write($overlay);
    if ($translated) {
        $cdir = dirname(ST_I18N_CACHE);
        if (!is_dir($cdir)) mkdir($cdir, 0755, true);
        file_put_contents(ST_I18N_CACHE, json_encode($cache, JSON_UNESCAPED_UNICODE) . "\n");
    }
    return ['ok' => true, 'queued' => count($unique), 'translated' => $translated];
}

function st_i18n_safe(array $texts): array
{
    try {
        return st_i18n_sync($texts);
    } catch (Throwable $e) {
        return ['ok' => false, 'error' => $e->getMessage(), 'translated' => 0];
    }
}
