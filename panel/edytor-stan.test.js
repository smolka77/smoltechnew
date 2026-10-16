/* node panel/edytor-stan.test.js */
var assert = require('assert');
var ST = require('./edytor-stan.js');

var uk = 'Від серійних машин точкового та рельєфного зварювання — до складних ліній.';
var en = 'From serial spot and projection welders to complex lines.';

assert.strictEqual(ST.canRevealSource(uk, 'welders'), false);
assert.strictEqual(ST.canRevealSource(uk, 'сварки'), false);
assert.strictEqual(ST.canRevealSource(uk, 'Від короткого речення.'), false);
assert.strictEqual(ST.canRevealSource(uk, en), true);
assert.strictEqual(ST.selectionWins('uil', 'build'), true);
assert.strictEqual(ST.selectionWins('build', 'build'), false);
assert.strictEqual(ST.selectionWins('', 'e'), false);
assert.strictEqual(ST.dragShrinks('build', 'uil'), true);
assert.strictEqual(ST.dragShrinks('build', 'build'), false);
assert.strictEqual(ST.dragShrinks('build', 'other'), false);
assert.strictEqual(ST.canRevealSource(uk, uk), true);
assert.strictEqual(ST.canRevealSource('projection', 'projection'), true);
assert.strictEqual(ST.applyIfCurrent(1, 2, en, uk.slice(0, 12)), en);
assert.strictEqual(ST.applyIfCurrent(3, 3, en, 'Updated English'), 'Updated English');

var gen = 1;
var started = gen;
gen = ST.bump(gen);
assert.strictEqual(ST.isCurrent(started, gen), false);
assert.strictEqual(ST.applyIfCurrent(started, gen, en, uk), en);

assert.strictEqual(ST.editorHistoryAction({ key: 'z', ctrl: true, tag: 'P' }), 'undo');
assert.strictEqual(ST.editorHistoryAction({ key: 'Z', meta: true, tag: 'P' }), 'undo');
assert.strictEqual(ST.editorHistoryAction({ key: 'y', ctrl: true, tag: 'P' }), 'redo');
assert.strictEqual(ST.editorHistoryAction({ key: 'z', ctrl: true, shift: true, tag: 'P' }), 'redo');
assert.strictEqual(ST.editorHistoryAction({ key: 'z', ctrl: true, tag: 'INPUT' }), '');
assert.strictEqual(ST.editorHistoryAction({ key: 'z', tag: 'P' }), '');

assert.strictEqual(ST.normalizeHex('d10a11'), '#d10a11');
assert.strictEqual(ST.normalizeHex('#D10A11'), '#d10a11');
assert.strictEqual(ST.normalizeHex('#abc'), '#aabbcc');
assert.strictEqual(ST.normalizeHex('255'), '');
assert.ok(ST.PALETTE.indexOf('#d10a11') >= 0);

var dirty = '<span style="letter-spacing:1px;-webkit-text-fill-color:#d10a11;white-space:nowrap;background-color:#fff">weld</span>';
assert.strictEqual(ST.plainPaste(dirty), 'weld');
assert.strictEqual(ST.plainPaste('line\r\nbreak'), 'line\nbreak');
assert.ok(!/<[a-z]/i.test(ST.plainPaste('just words')));

console.log('edytor-stan.test.js ok');
