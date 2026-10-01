<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/_private/start.php';
st_security_headers();
st_session_start();
st_csrf_token();
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/panel.html');
