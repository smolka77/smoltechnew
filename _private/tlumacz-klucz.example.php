<?php
declare(strict_types=1);

/**
 * Copy this file to _private/tlumacz-klucz.php (that copy is not committed).
 * English edits are translated into Ukrainian and Russian with this key.
 * Leave the key empty to keep the English text and mark it untranslated.
 *
 * DeepL (recommended — keeps bold, italic, links and colour on the translated words):
 *   1. Create a key at https://www.deepl.com/pro-api
 *   2. A free key ends with :fx and uses api-free.deepl.com
 *   3. A Pro key uses api.deepl.com
 *   engine = deepl
 *
 * Google Cloud Translation (basic v2):
 *   1. Enable Cloud Translation API on a Google Cloud project
 *   2. Create an API key
 *   engine = google
 *
 * Or set the same values in _private/auth.env:
 *   ST_TRANSLATE_ENGINE=deepl
 *   ST_TRANSLATE_KEY=your-key
 */
return [
    'engine' => 'deepl',
    'key' => '',
    'url' => '',
];
