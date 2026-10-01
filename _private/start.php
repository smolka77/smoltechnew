<?php
declare(strict_types=1);

if (!defined('ST_BOOT')) {
    define('ST_BOOT', true);
}

const ST_PRIVATE = __DIR__;
const ST_DATA = __DIR__ . '/data';
const ST_SESSIONS = __DIR__ . '/sessions';
const ST_INBOX = ST_DATA . '/magazyn.php';
const ST_INBOX_LEGACY = ST_DATA . '/zapytania.json';
const ST_RATE = ST_DATA . '/limity-logowan.json';
const ST_SESSION_IDLE = 28800;

function st_env(): array
{
    static $env = null;
    if ($env !== null) {
        return $env;
    }
    $env = [];
    $path = ST_PRIVATE . '/auth.env';
    if (!is_readable($path)) {
        return $env;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) {
        return $env;
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $i = strpos($line, '=');
        if ($i === false) {
            continue;
        }
        $env[trim(substr($line, 0, $i))] = trim(substr($line, $i + 1));
    }
    return $env;
}

function st_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function st_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
    header('Cache-Control: no-store, no-cache, must-revalidate, private');
    header('Pragma: no-cache');
    header(
        "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com; font-src 'self'; connect-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
}

function st_json(array $payload, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function st_client_ip(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    if (str_starts_with($ip, '::ffff:')) {
        $ip = substr($ip, 7);
    }
    return $ip;
}

function st_client_key(): string
{
    $ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 180);
    return hash('sha256', st_client_ip() . '|' . $ua);
}

function st_bind_key(): string
{
    return hash('sha256', st_client_ip());
}

function st_request_host(): string
{
    return strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
}

function st_origin_ok(): bool
{
    $host = st_request_host();
    if ($host === '') {
        return false;
    }
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '') {
        $oh = strtolower((string) parse_url($origin, PHP_URL_HOST));
        return $oh !== '' && hash_equals($host, $oh);
    }
    $ref = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    if ($ref !== '') {
        $rh = strtolower((string) parse_url($ref, PHP_URL_HOST));
        return $rh !== '' && hash_equals($host, $rh);
    }
    return false;
}

function st_session_reset_auth(): void
{
    unset(
        $_SESSION['auth'],
        $_SESSION['pending'],
        $_SESSION['pending_exp'],
        $_SESSION['totp_used'],
        $_SESSION['bind'],
        $_SESSION['seen']
    );
}

function st_b32_decode(string $in): string
{
    $in = strtoupper(preg_replace('/[^A-Z2-7]/', '', $in) ?? '');
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $buffer = 0;
    $bits = 0;
    $out = '';
    $len = strlen($in);
    for ($i = 0; $i < $len; $i++) {
        $val = strpos($alphabet, $in[$i]);
        if ($val === false) {
            continue;
        }
        $buffer = ($buffer << 5) | $val;
        $bits += 5;
        if ($bits >= 8) {
            $bits -= 8;
            $out .= chr(($buffer >> $bits) & 0xFF);
        }
    }
    return $out;
}

function st_totp_at(string $secret, int $counter): string
{
    $key = st_b32_decode($secret);
    $bin = pack('N*', 0) . pack('N*', $counter);
    $h = hash_hmac('sha1', $bin, $key, true);
    $o = ord($h[19]) & 0x0F;
    $code = unpack('N', substr($h, $o, 4))[1] & 0x7FFFFFFF;
    return str_pad((string) ($code % 1000000), 6, '0', STR_PAD_LEFT);
}

function st_totp_verify(string $secret, string $code): bool
{
    $code = preg_replace('/\s+/', '', $code) ?? '';
    if (!preg_match('/^\d{6}$/', $code) || $secret === '') {
        return false;
    }
    $t = intdiv(time(), 30);
    $ok = false;
    for ($i = -1; $i <= 1; $i++) {
        if (hash_equals(st_totp_at($secret, $t + $i), $code)) {
            $ok = true;
        }
    }
    return $ok;
}

function st_verify_password(string $pass): bool
{
    $env = st_env();
    $iters = (int) ($env['ADMIN_PASS_ITERS'] ?? 310000);
    $iters = max(100000, min($iters, 600000));
    $salt = base64_decode((string) ($env['ADMIN_PASS_SALT'] ?? ''), true);
    $stored = base64_decode((string) ($env['ADMIN_PASS_HASH'] ?? ''), true);
    if (!is_string($salt) || $salt === '') {
        $salt = random_bytes(16);
    }
    $calc = hash_pbkdf2('sha256', $pass, $salt, $iters, 32, true);
    if (!is_string($stored) || strlen($stored) !== 32) {
        hash_equals(str_repeat("\0", 32), $calc);
        return false;
    }
    return hash_equals($stored, $calc);
}

function st_verify_user(string $user): bool
{
    $expected = (string) (st_env()['ADMIN_USER'] ?? '');
    if ($expected === '' || $user === '') {
        return false;
    }
    return hash_equals($expected, $user);
}

function st_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    if (!is_dir(ST_SESSIONS)) {
        @mkdir(ST_SESSIONS, 0700, true);
    }
    session_name('STSESSID');
    session_save_path(ST_SESSIONS);
    ini_set('session.gc_maxlifetime', (string) ST_SESSION_IDLE);
    $https = st_is_https();
    if (!headers_sent()) {
        // Kill the duplicate cookie from path=/panel (broke CSRF / login).
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => '/panel',
            'secure' => $https,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
    session_set_cookie_params([
        'lifetime' => ST_SESSION_IDLE,
        'path' => '/panel/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.use_only_cookies', '1');
    session_start();
}

function st_csrf_token(): string
{
    st_session_start();
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function st_csrf_ok(?string $token): bool
{
    $have = $_SESSION['csrf'] ?? '';
    return is_string($have) && is_string($token) && $token !== '' && hash_equals($have, $token);
}

function st_csrf_fail(): never
{
    st_json(['ok' => false, 'error' => 'Sesja wygasła. Odśwież stronę.', 'csrf' => st_csrf_token()], 400);
}

function st_auth_step(): string
{
    st_session_start();
    $bind = (string) ($_SESSION['bind'] ?? '');
    $bindOk = $bind !== '' && hash_equals($bind, st_bind_key());

    if (($_SESSION['auth'] ?? null) === true) {
        if (!$bindOk) {
            $_SESSION['bind'] = st_bind_key();
        }
        $seen = (int) ($_SESSION['seen'] ?? 0);
        if ($seen > 0 && (time() - $seen) > ST_SESSION_IDLE) {
            st_session_reset_auth();
            return 'login';
        }
        $_SESSION['seen'] = time();
        return 'app';
    }

    $exp = (int) ($_SESSION['pending_exp'] ?? 0);
    if (!empty($_SESSION['pending']) && $exp >= time()) {
        if (!$bindOk) {
            st_session_reset_auth();
            return 'login';
        }
        return 'totp';
    }
    unset($_SESSION['pending'], $_SESSION['pending_exp']);
    return 'login';
}

function st_rate_hit(string $bucket, int $max, int $window): bool
{
    if (!is_dir(ST_DATA)) {
        @mkdir(ST_DATA, 0700, true);
    }
    $all = [];
    $fp = fopen(ST_RATE, 'c+');
    if ($fp === false) {
        return true;
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $all = $decoded;
        }
    }
    $now = time();
    $hits = array_values(array_filter(
        array_map('intval', $all[$bucket] ?? []),
        static fn (int $t): bool => $t > ($now - $window)
    ));
    $blocked = count($hits) >= $max;
    if (!$blocked) {
        $hits[] = $now;
    }
    $all[$bucket] = $hits;
    foreach ($all as $k => $list) {
        $keep = array_values(array_filter(array_map('intval', $list), static fn (int $t): bool => $t > ($now - 3600)));
        if ($keep) {
            $all[$k] = $keep;
        } else {
            unset($all[$k]);
        }
    }
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($all));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $blocked;
}

function st_require_configured(): void
{
    $env = st_env();
    if (
        ($env['ADMIN_USER'] ?? '') === ''
        || ($env['ADMIN_PASS_HASH'] ?? '') === ''
        || ($env['ADMIN_TOTP_SECRET'] ?? '') === ''
    ) {
        st_json(['ok' => false, 'error' => 'Panel nie jest skonfigurowany.'], 503);
    }
}
