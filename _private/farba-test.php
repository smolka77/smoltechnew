<?php
declare(strict_types=1);

require_once __DIR__ . '/cms.php';
$GLOBALS['ST_I18N_DRY'] = true;
$GLOBALS['ST_I18N_DRY_SOURCE'] = ['v' => 1, 'byEn' => []];
$GLOBALS['ST_I18N_DRY_OVERLAY'] = [];
$GLOBALS['ST_I18N_DRY_CACHE'] = [];
require_once __DIR__ . '/tlumacz.php';

function st_paint_assert(bool $ok, string $msg): void
{
    if ($ok) return;
    fwrite(STDERR, "FAIL: $msg\n");
    exit(1);
}

$nested = st_paint_normalize('TECNA<span style="color:#2dcd6a"><span style="color:#d10a11">+</span></span>');
st_paint_assert($nested === 'TECNA<span style="color:#d10a11">+</span>', 'nested: ' . $nested);

$dup = st_paint_normalize('Industry-proven <span style="color:#af5555">exp<u>erienc</u></span><span style="color:#af5555">e</span> — dozens');
st_paint_assert($dup === 'Industry-proven <span style="color:#af5555">exp<u>erienc</u>e</span> — dozens', 'dup: ' . $dup);

$split = st_paint_normalize('p <span style="color:#d10a11">rojectio</span> n welders');
st_paint_assert($split === 'p<span style="color:#d10a11">rojectio</span>n welders', 'split: ' . $split);
st_paint_assert(st_paint_plain($split) === 'projection welders', 'split plain');

$inner = st_paint_normalize('p<span style="color:#d10a11"> rojectio </span>n welders');
st_paint_assert(st_paint_plain($inner) === 'projection welders', 'inner plain: ' . $inner);
st_paint_assert($inner === 'p<span style="color:#d10a11">rojectio</span>n welders', 'inner: ' . $inner);

$kept = 'Our <span style="color:#000000">machines</span> run';
st_paint_assert(st_paint_normalize($kept) === $kept, 'kept machines');

$structural = '<button class="burger"><span></span><span></span><span></span></button><span><span class="mega__tt">Title</span></span><dd class="stats__n"><span class="stats__v" data-count="15">15</span><span>+</span></dd>';
st_paint_assert(st_paint_normalize_document($structural) === $structural, 'structural spans: ' . st_paint_normalize_document($structural));

$empty = st_paint_normalize('ab<span></span>c<span style="color:#d10a11"></span>d');
st_paint_assert($empty === 'abcd', 'empty: ' . $empty);

$page = '<p data-st-enhtml="TECNA&lt;span style=&quot;color:#2dcd6a&quot;&gt;&lt;span style=&quot;color:#d10a11&quot;&gt;+&lt;/span&gt;&lt;/span&gt;">TECNA<span style="color:#2dcd6a"><span style="color:#d10a11">+</span></span></p>';
$normPage = st_paint_normalize_document($page);
st_paint_assert(str_contains($normPage, 'TECNA<span style="color:#d10a11">+</span>'), 'page body ' . $normPage);
st_paint_assert(str_contains($normPage, 'data-st-enhtml="TECNA&lt;span style=&quot;color:#d10a11&quot;&gt;+&lt;/span&gt;"'), 'page attr ' . $normPage);
st_paint_assert(!str_contains($normPage, '#2dcd6a'), 'outer colour gone');

st_paint_assert(st_cms_strip('p<span style="color:#d10a11">rojectio</span>n welders') === 'projection welders', 'cms strip inline');
st_paint_assert(st_i18n_plain('p<strong>rojectio</strong>n welders') === 'projection welders', 'plain inline');
st_paint_assert(st_i18n_plain_show('p<em>rojectio</em>n') === 'projection', 'plain show inline');
st_paint_assert(st_i18n_plain('<p>one</p><br>two') === 'one two', 'plain block: ' . st_i18n_plain('<p>one</p><br>two'));
st_paint_assert(st_cms_strip('a<br/>b') === 'a b', 'br space');

$mark = st_i18n_enmark_from_html('p <span style="color:#d10a11">rojectio</span> n welders');
st_paint_assert(is_string($mark) && str_contains($mark, '"t":"rojectio"') && str_contains($mark, '"at":1') && str_contains($mark, '#d10a11'), 'enmark: ' . (string) $mark);
st_paint_assert(!str_contains((string) $mark, '#000000') && !str_contains((string) $mark, 'prrojectio'), 'enmark not blackened');

$uk = 'Наш асортимент';
$oldEn = 'p <span style="color:#d10a11">rojectio</span> n welders';
$src = '<p data-st-xid="e1" data-st-enmark="{&quot;t&quot;:&quot;prrojectio n&quot;,&quot;at&quot;:23,&quot;c&quot;:&quot;#000000&quot;}" data-st-enhtml="' . htmlspecialchars($oldEn, ENT_QUOTES | ENT_HTML5, 'UTF-8') . '" data-st-ruhtml="русский">' . $uk . '</p>';
$ledgerFile = ST_I18N_SOURCE;
$overlayFile = ST_I18N_JSON;
$beforeLedger = is_file($ledgerFile) ? hash_file('sha256', $ledgerFile) : '';
$beforeOverlay = is_file($overlayFile) ? hash_file('sha256', $overlayFile) : '';
$applied = st_i18n_apply_documents(['main' => $src], [[
    'role' => 'en',
    'xid' => 'e1',
    'uk' => $uk,
    'en' => 'projection welders',
    'prevEn' => 'projection welders',
    'enHtml' => '',
    'paintOnly' => 1,
]]);
$html = (string) ($applied['docs']['main'] ?? '');
st_paint_assert(str_contains($html, $uk), 'uk text kept: ' . $html);
st_paint_assert(!str_contains($html, 'data-st-enhtml'), 'enhtml removed: ' . $html);
st_paint_assert(!str_contains($html, 'data-st-enmark'), 'enmark removed: ' . $html);
st_paint_assert(!str_contains($html, 'color:#d10a11') && !str_contains($html, '#000000'), 'old colour gone: ' . $html);
st_paint_assert(str_contains($html, 'data-st-ruhtml="русский"'), 'ruhtml kept: ' . $html);
st_paint_assert(!str_contains($html, 'data-st-xid'), 'xid stripped');
st_paint_assert((is_file($ledgerFile) ? hash_file('sha256', $ledgerFile) : '') === $beforeLedger, 'ledger rewritten');
st_paint_assert((is_file($overlayFile) ? hash_file('sha256', $overlayFile) : '') === $beforeOverlay, 'overlay rewritten');

$same = st_i18n_apply_documents(['main' => $src], [[
    'role' => 'en',
    'xid' => 'e1',
    'uk' => $uk,
    'en' => 'projection welders',
    'prevEn' => 'projection welders',
    'enHtml' => 'p<span style="color:#0000ff">rojectio</span>n welders',
]]);
$sameHtml = (string) ($same['docs']['main'] ?? '');
st_paint_assert(str_contains($sameHtml, 'color:#0000ff'), 'same words recolour: ' . $sameHtml);
st_paint_assert(str_contains($sameHtml, 'data-st-enmark='), 'same words mark: ' . $sameHtml);
st_paint_assert(str_contains($sameHtml, 'rojectio') && !str_contains($sameHtml, 'prrojectio'), 'same words mark text');
st_paint_assert(str_contains($sameHtml, $uk), 'same words uk kept');
st_paint_assert(str_contains($sameHtml, 'data-st-ruhtml="русский"'), 'same words ru kept');

echo "farba-test.php: ok\n";
