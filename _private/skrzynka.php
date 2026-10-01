<?php
declare(strict_types=1);

require_once __DIR__ . '/start.php';

function st_inbox_encode(array $items): string
{
    $json = json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return '';
    }
    return "<?php\ndeclare(strict_types=1);\nif (!defined('ST_BOOT')) { http_response_code(403); exit; }\nreturn json_decode(<<<'ST_INBOX_JSON_V1'\n{$json}\nST_INBOX_JSON_V1, true) ?: [];\n";
}

function st_inbox_parse(?string $raw): array
{
    if (!is_string($raw) || $raw === '') {
        return [];
    }
    $trim = ltrim($raw);
    if (str_starts_with($trim, '<?php')) {
        if (!preg_match("/<<<'ST_INBOX_JSON_V1'\\r?\\n(.*)\\r?\\nST_INBOX_JSON_V1/s", $trim, $m)) {
            return [];
        }
        $decoded = json_decode($m[1], true);
        return is_array($decoded) ? $decoded : [];
    }
    $decoded = json_decode($trim, true);
    return is_array($decoded) ? $decoded : [];
}

function st_inbox_ensure_dir(): void
{
    if (!is_dir(ST_DATA)) {
        @mkdir(ST_DATA, 0700, true);
    }
}

function st_inbox_load(): array
{
    st_inbox_ensure_dir();
    if (is_readable(ST_INBOX)) {
        return st_inbox_parse((string) file_get_contents(ST_INBOX));
    }
    if (is_readable(ST_INBOX_LEGACY)) {
        return st_inbox_parse((string) file_get_contents(ST_INBOX_LEGACY));
    }
    return [];
}

function st_inbox_write_locked($fp, array $items): bool
{
    $encoded = st_inbox_encode($items);
    if ($encoded === '') {
        return false;
    }
    rewind($fp);
    if (!ftruncate($fp, 0)) {
        return false;
    }
    $ok = fwrite($fp, $encoded) !== false;
    fflush($fp);
    return $ok;
}

function st_inbox_open()
{
    st_inbox_ensure_dir();
    $fp = fopen(ST_INBOX, 'c+');
    if ($fp === false) {
        $fp = fopen(ST_INBOX, 'c+');
    }
    return $fp;
}

function st_inbox_read_locked($fp): array
{
    rewind($fp);
    $raw = stream_get_contents($fp);
    $items = st_inbox_parse(is_string($raw) ? $raw : '');
    if ($items === [] && is_readable(ST_INBOX_LEGACY) && (filesize(ST_INBOX) === 0 || $raw === '')) {
        return st_inbox_parse((string) file_get_contents(ST_INBOX_LEGACY));
    }
    return $items;
}

function st_inbox_save(array $items): bool
{
    $fp = st_inbox_open();
    if ($fp === false) {
        return false;
    }
    flock($fp, LOCK_EX);
    $ok = st_inbox_write_locked($fp, array_values($items));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

/**
 * @param array<string,string> $row
 */
function st_inbox_append(array $row): bool
{
    $fp = st_inbox_open();
    if ($fp === false) {
        return false;
    }
    flock($fp, LOCK_EX);
    $items = st_inbox_read_locked($fp);
    array_unshift($items, $row);
    if (count($items) > 4000) {
        $items = array_slice($items, 0, 4000);
    }
    $ok = st_inbox_write_locked($fp, $items);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

function st_inbox_public_list(): array
{
    $out = [];
    foreach (st_inbox_load() as $row) {
        if (!is_array($row) || empty($row['id'])) {
            continue;
        }
        $out[] = [
            'id' => (string) $row['id'],
            'created' => (string) ($row['created'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'company' => (string) ($row['company'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'topic' => (string) ($row['topic'] ?? ''),
            'preview' => mb_substr(preg_replace('/\s+/', ' ', (string) ($row['message'] ?? '')) ?? '', 0, 140),
            'read' => !empty($row['read']),
        ];
    }
    return $out;
}

function st_inbox_find(string $id): ?array
{
    if ($id === '' || !preg_match('/^[a-f0-9]{32}$/', $id)) {
        return null;
    }
    foreach (st_inbox_load() as $row) {
        if (is_array($row) && ($row['id'] ?? '') === $id) {
            return $row;
        }
    }
    return null;
}

function st_inbox_patch(string $id, callable $mut): bool
{
    $fp = st_inbox_open();
    if ($fp === false) {
        return false;
    }
    flock($fp, LOCK_EX);
    $items = st_inbox_read_locked($fp);
    $found = false;
    foreach ($items as $i => $row) {
        if (is_array($row) && ($row['id'] ?? '') === $id) {
            $items[$i] = $mut($row);
            $found = true;
            break;
        }
    }
    $ok = $found && st_inbox_write_locked($fp, $items);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

function st_inbox_delete(string $id): bool
{
    $fp = st_inbox_open();
    if ($fp === false) {
        return false;
    }
    flock($fp, LOCK_EX);
    $items = st_inbox_read_locked($fp);
    $next = [];
    $found = false;
    foreach ($items as $row) {
        if (is_array($row) && ($row['id'] ?? '') === $id) {
            $found = true;
            continue;
        }
        $next[] = $row;
    }
    $ok = $found && st_inbox_write_locked($fp, $next);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}
