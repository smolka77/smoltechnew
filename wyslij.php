<?php
/**
 * Contact form handler for smoltech.com.ua
 *
 * Responds with JSON when the request comes from the AJAX path in strona.js,
 * otherwise renders a minimal HTML confirmation so the form still works
 * with JavaScript disabled.
 */

declare(strict_types=1);

const MAIL_TO      = 'biuro@smoltech.pl';
const MAIL_FROM    = 'no-reply@smoltech.com.ua';
const SITE_URL     = 'https://smoltech.com.ua';
const MIN_SECONDS  = 3;      // a human needs at least this long to fill the form
const RATE_WINDOW  = 300;    // seconds
const RATE_MAX     = 3;      // submissions per IP per window

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

/**
 * @param array<string,mixed> $extra
 */
function respond(bool $ok, string $error = '', array $extra = [])
{
    global $wantsJson;

    $status = $ok ? 200 : 400;

    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok, 'error' => $error] + $extra, JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code($ok ? 303 : $status);
    if ($ok) {
        header('Location: ' . SITE_URL . '/kontakty/?sent=1');
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($error !== '' ? $error : 'Сталася помилка.', ENT_QUOTES, 'UTF-8');
    echo <<<HTML
<!DOCTYPE html>
<html lang="uk-UA"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Не вдалося надіслати запит | SMOLTECH</title>
<link rel="stylesheet" href="/assets/css/strona.css"></head>
<body><section class="sec sec-dark"><div class="wrap wrap-tight prose">
<h1 class="h-lg">Не вдалося надіслати запит</h1>
<p>{$safe}</p>
<p>Напишіть нам на <a href="mailto:biuro@smoltech.pl">biuro@smoltech.pl</a>
або зателефонуйте <a href="tel:+48713215427">+48 71 321 54 27</a>.</p>
<p><a class="btn btn-primary" href="/kontakty/">Повернутися до контактів</a></p>
</div></section></body></html>
HTML;
    exit;
}

function field(string $key, int $max = 500, bool $multiline = false): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    // strip control characters; keep newlines only in the message body
    $pattern = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u';
    $v = preg_replace($pattern, '', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Метод не підтримується.');
}

// --- bot traps -------------------------------------------------------------
if (field('website') !== '') {
    respond(true); // honeypot filled: pretend success, send nothing
}

$started = (int) field('ts', 20);
if ($started > 0 && (time() - $started) < MIN_SECONDS) {
    respond(true);
}

// --- naive per-IP rate limit ----------------------------------------------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = sys_get_temp_dir() . '/smoltech-rl-' . sha1($ip);
$hits = [];
if (is_readable($bucket)) {
    $cutoff = time() - RATE_WINDOW;
    $hits = array_filter(
        array_map('intval', explode(',', (string) file_get_contents($bucket))),
        static function ($t) use ($cutoff) { return $t > $cutoff; }
    );
}
if (count($hits) >= RATE_MAX) {
    respond(false, 'Занадто багато запитів. Спробуйте за кілька хвилин або зателефонуйте нам.');
}
$hits[] = time();
@file_put_contents($bucket, implode(',', $hits), LOCK_EX);

// --- validation ------------------------------------------------------------
$name    = field('name', 120);
$company = field('company', 160);
$email   = field('email', 160);
$phone   = field('phone', 40);
$topic   = field('topic', 120);
$message = field('message', 4000, true);

$errors = [];
if (mb_strlen($name) < 2)                             { $errors[] = 'вкажіть імʼя'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))       { $errors[] = 'вкажіть коректний e-mail'; }
if (mb_strlen($message) < 10)                         { $errors[] = 'опишіть задачу докладніше'; }
if ($errors) {
    respond(false, 'Перевірте, будь ласка, форму: ' . implode(', ', $errors) . '.');
}

// crude spam heuristic: links in a short message
if (preg_match_all('~https?://~i', $message) > 4) {
    respond(true);
}

// --- compose ---------------------------------------------------------------
$lines = [
    'Новий запит із smoltech.com.ua',
    str_repeat('=', 40),
    '',
    'Імʼя:      ' . $name,
    'Компанія:  ' . ($company !== '' ? $company : '—'),
    'E-mail:    ' . $email,
    'Телефон:   ' . ($phone !== '' ? $phone : '—'),
    'Тема:      ' . ($topic !== '' ? $topic : '—'),
    '',
    'Повідомлення:',
    $message,
    '',
    str_repeat('-', 40),
    'IP:        ' . $ip,
    'Сторінка:  ' . field('page', 300),
    'Час:       ' . date('Y-m-d H:i:s'),
];
$body = implode("\r\n", $lines);

$subject = '[smoltech.com.ua] Запит: ' . ($topic !== '' ? $topic : $name);
$encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$headers = [
    'From: SMOLTECH UA <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: smoltech.com.ua',
];

$inboxFile = __DIR__ . '/_private/skrzynka.php';
$saved = false;
if (is_readable($inboxFile)) {
    require_once $inboxFile;
    $saved = st_inbox_append([
        'id' => bin2hex(random_bytes(16)),
        'created' => date('c'),
        'name' => $name,
        'company' => $company,
        'email' => $email,
        'phone' => $phone,
        'topic' => $topic,
        'message' => $message,
        'page' => field('page', 300),
        'src' => field('src', 80),
        'read' => false,
    ]);
}

$sent = @mail(MAIL_TO, $encoded, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$saved && !$sent) {
    error_log('smoltech.com.ua: mail() and inbox save failed for ' . $email);
    respond(false, 'Сервер не зміг надіслати повідомлення.');
}

respond(true);
