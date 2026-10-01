<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_private/start.php';
require_once dirname(__DIR__) . '/_private/skrzynka.php';
require_once dirname(__DIR__) . '/_private/cms.php';

st_security_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    st_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

if (!st_origin_ok()) {
    st_json(['ok' => false, 'error' => 'Nieprawidłowe pochodzenie żądania.'], 403);
}

st_session_start();
st_require_configured();

$input = [];
$ctype = (string) ($_SERVER['CONTENT_TYPE'] ?? '');
if (stripos($ctype, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $decoded = json_decode(is_string($raw) ? $raw : '', true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
} else {
    $input = $_POST;
}

$action = (string) ($input['action'] ?? 'status');
$step = st_auth_step();

if ($action === 'status') {
    $list = $step === 'app' ? st_inbox_public_list() : [];
    $unread = 0;
    foreach ($list as $row) {
        if (empty($row['read'])) {
            $unread++;
        }
    }
    $payload = [
        'ok' => true,
        'step' => $step,
        'csrf' => st_csrf_token(),
        'items' => $list,
        'unread' => $unread,
        'total' => count($list),
    ];
    if ($step === 'app') {
        $payload = array_merge($payload, st_cms_overview());
    }
    st_json($payload);
}

if ($action === 'login') {
    if (!st_csrf_ok(isset($input['csrf']) ? (string) $input['csrf'] : null)) {
        st_csrf_fail();
    }
    if (st_rate_hit('login:' . st_client_key(), 8, 900)) {
        st_json(['ok' => false, 'error' => 'Zbyt wiele prób. Spróbuj za kilka minut.'], 429);
    }
    $user = trim((string) ($input['user'] ?? ''));
    $pass = (string) ($input['pass'] ?? '');
    $userOk = st_verify_user($user);
    $passOk = st_verify_password($pass);
    if (!$userOk || !$passOk) {
        usleep(random_int(120000, 280000));
        st_json(['ok' => false, 'error' => 'Nieprawidłowe dane logowania.']);
    }
    session_regenerate_id(true);
    st_session_reset_auth();
    $_SESSION['pending'] = true;
    $_SESSION['pending_exp'] = time() + 180;
    $_SESSION['bind'] = st_bind_key();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    st_json(['ok' => true, 'step' => 'totp', 'csrf' => st_csrf_token()]);
}

if ($action === 'totp') {
    if ($step !== 'totp') {
        st_json(['ok' => false, 'error' => 'Najpierw zaloguj się hasłem.', 'step' => $step], 400);
    }
    if (!st_csrf_ok(isset($input['csrf']) ? (string) $input['csrf'] : null)) {
        st_csrf_fail();
    }
    if (st_rate_hit('totp:' . st_client_key(), 8, 900)) {
        st_json(['ok' => false, 'error' => 'Zbyt wiele prób. Spróbuj za kilka minut.'], 429);
    }
    $code = (string) ($input['code'] ?? '');
    $secret = (string) (st_env()['ADMIN_TOTP_SECRET'] ?? '');
    $ok = st_totp_verify($secret, $code);
    $slot = intdiv(time(), 30);
    if ($ok && isset($_SESSION['totp_used']) && (int) $_SESSION['totp_used'] === $slot) {
        $ok = false;
    }
    if (!$ok) {
        usleep(random_int(120000, 280000));
        st_json(['ok' => false, 'error' => 'Nieprawidłowy kod uwierzytelniający.']);
    }
    session_regenerate_id(true);
    $_SESSION['auth'] = true;
    $_SESSION['totp_used'] = $slot;
    $_SESSION['bind'] = st_bind_key();
    $_SESSION['seen'] = time();
    unset($_SESSION['pending'], $_SESSION['pending_exp']);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $list = st_inbox_public_list();
    $unread = 0;
    foreach ($list as $row) {
        if (empty($row['read'])) {
            $unread++;
        }
    }
    st_json([
        'ok' => true,
        'step' => 'app',
        'csrf' => st_csrf_token(),
        'items' => $list,
        'unread' => $unread,
        'total' => count($list),
    ]);
}

if ($action === 'logout') {
    if (!st_csrf_ok(isset($input['csrf']) ? (string) $input['csrf'] : null)) {
        st_csrf_fail();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    st_json(['ok' => true, 'step' => 'login']);
}

if ($step !== 'app') {
    st_json(['ok' => false, 'error' => 'Wymagane logowanie.', 'step' => $step], 401);
}

if (!st_csrf_ok(isset($input['csrf']) ? (string) $input['csrf'] : null)) {
    st_csrf_fail();
}

$id = (string) ($input['id'] ?? '');

if ($action === 'get') {
    $row = st_inbox_find($id);
    if ($row === null) {
        st_json(['ok' => false, 'error' => 'Nie znaleziono wiadomości.'], 404);
    }
    st_inbox_patch($id, static function (array $r): array {
        $r['read'] = true;
        return $r;
    });
    $row['read'] = true;
    unset($row['ip']);
    st_json(['ok' => true, 'item' => $row]);
}

if ($action === 'unread') {
    $ok = st_inbox_patch($id, static function (array $r): array {
        $r['read'] = false;
        return $r;
    });
    st_json(['ok' => $ok]);
}

if ($action === 'delete') {
    $ok = st_inbox_delete($id);
    st_json(['ok' => $ok]);
}

if (is_string($action) && str_starts_with($action, 'cms.')) {
    $res = st_cms_handle($action, $input);
    st_json($res, !empty($res['ok']) ? 200 : 400);
}

st_json(['ok' => false, 'error' => 'Nieznane żądanie.'], 400);
