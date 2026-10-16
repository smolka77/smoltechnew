'use strict';

var assert = require('assert');
var JSDOM = require('jsdom').JSDOM;
var STColor = require('./kolor.js');

function host(html) {
  var dom = new JSDOM('<!doctype html><body><p id="h">' + html + '</p></body>');
  return dom.window.document.getElementById('h');
}

function paint(html, start, end, value) {
  var el = host(html);
  var res = STColor.applyOffsets(el, start, end, 'color', value);
  assert.strictEqual(res.ok, true, 'apply failed for ' + JSON.stringify(html));
  return el;
}

var word = 'projection welders';

var colored = paint(word, 1, 9, '#d10a11');
assert.strictEqual(colored.textContent, word);
assert.strictEqual(colored.innerHTML, 'p<span style="color:#d10a11">rojectio</span>n welders');

var cleared = paint(colored.innerHTML, 1, 9, '');
assert.strictEqual(cleared.textContent, word);
assert.strictEqual(cleared.innerHTML, word);
assert.ok(!/</.test(cleared.innerHTML));

var partial = paint('p<span style="color:#d10a11">rojectio</span>n welders', 3, 7, '');
assert.strictEqual(partial.textContent, word);
assert.strictEqual(partial.innerHTML, 'p<span style="color:#d10a11">ro</span>ject<span style="color:#d10a11">io</span>n welders');

var blue = paint('p<span style="color:#d10a11">rojectio</span>n welders', 1, 9, '#00f');
assert.strictEqual(blue.textContent, word);
assert.strictEqual(blue.innerHTML, 'p<span style="color:#0000ff">rojectio</span>n welders');
var again = STColor.applyOffsets(blue, 1, 9, 'color', '#112233');
assert.strictEqual(again.ok, true);
assert.strictEqual(blue.textContent, word);
assert.strictEqual(blue.innerHTML, 'p<span style="color:#112233">rojectio</span>n welders');

var build = paint('build', 0, 5, '#d10a11');
assert.strictEqual(build.innerHTML, '<span style="color:#d10a11">build</span>');
var midBlue = STColor.applyOffsets(build, 1, 4, 'color', '#1d4ed8');
assert.strictEqual(midBlue.ok, true);
assert.strictEqual(build.textContent, 'build');
assert.strictEqual(build.innerHTML, '<span style="color:#d10a11">b</span><span style="color:#1d4ed8">uil</span><span style="color:#d10a11">d</span>');

var letter = paint(word, 4, 5, '#d10a11');
assert.strictEqual(letter.textContent, word);
assert.strictEqual(letter.innerHTML, 'proj<span style="color:#d10a11">e</span>ction welders');

var bold = paint('<strong>projection</strong>', 1, 9, '#d10a11');
assert.strictEqual(bold.textContent, 'projection');
assert.strictEqual(bold.innerHTML, '<strong>p<span style="color:#d10a11">rojectio</span>n</strong>');

var nested = host('TECNA<span style="color:#2dcd6a"><span style="color:#d10a11">+</span></span>');
STColor.normalize(nested);
assert.strictEqual(nested.textContent, 'TECNA+');
assert.strictEqual(nested.innerHTML, 'TECNA<span style="color:#d10a11">+</span>');

var dup = host('Industry-proven <span style="color:#af5555">exp<u>erienc</u></span><span style="color:#af5555">e</span> — dozens');
STColor.normalize(dup);
assert.strictEqual(dup.innerHTML, 'Industry-proven <span style="color:#af5555">exp<u>erienc</u>e</span> — dozens');

var empty = host('ab<span></span>c<span style="color:#d10a11"></span>d');
STColor.normalize(empty);
assert.strictEqual(empty.innerHTML, 'abcd');
assert.strictEqual(empty.textContent, 'abcd');

function keepWords(html, text) {
  var el = host(html);
  STColor.normalize(el);
  assert.strictEqual(el.textContent, text, html);
  return el;
}

keepWords('Зварюємо в <span style="color:#d10a11">Польщі</span> і Німеччині', 'Зварюємо в Польщі і Німеччині');
keepWords('Варим в <span style="color:#d10a11">Польше</span> и Германии', 'Варим в Польше и Германии');
keepWords('I <span style="color:#d10a11">am</span> a welder', 'I am a welder');

var am = host('I am a welder');
var amRes = STColor.applyOffsets(am, 2, 4, 'color', '#d10a11');
assert.strictEqual(amRes.ok, true);
assert.strictEqual(am.textContent, 'I am a welder');
assert.strictEqual(am.innerHTML, 'I <span style="color:#d10a11">am</span> a welder');

var plus = host('<span class="stats__v" data-count="15">15</span><span>+</span>');
STColor.normalize(plus);
assert.strictEqual(plus.innerHTML, '<span class="stats__v" data-count="15">15</span><span>+</span>');

var kept = host('Our <span style="color:#000000">machines</span> run');
var keptHtml = kept.innerHTML;
STColor.normalize(kept);
assert.strictEqual(kept.innerHTML, keptHtml);
assert.strictEqual(kept.textContent, 'Our machines run');

var sized = host('<span style="font-size:1.2rem"><span style="color:#d10a11">+</span></span>');
STColor.normalize(sized);
assert.strictEqual(sized.innerHTML, '<span style="color:#d10a11;font-size:1.2rem">+</span>');

var serial = STColor.serialize(host('a<span style="color:#d10a11;-webkit-text-fill-color:#d10a11" data-stb-paint="">b</span>c'));
assert.strictEqual(serial, 'a<span style="color:#d10a11">b</span>c');
assert.ok(serial.indexOf('webkit') < 0);
assert.ok(serial.indexOf('data-stb-paint') < 0);

var rangeHost = host(word);
var range = STColor.rangeAt(rangeHost, 1, 9);
var applied = STColor.apply(rangeHost, range, 'color', '#d10a11');
assert.strictEqual(applied.ok, true);
assert.strictEqual(applied.start, 1);
assert.strictEqual(applied.end, 9);
assert.strictEqual(rangeHost.textContent, word);
assert.strictEqual(rangeHost.innerHTML, 'p<span style="color:#d10a11">rojectio</span>n welders');

console.log('kolor.test.js: ok');
