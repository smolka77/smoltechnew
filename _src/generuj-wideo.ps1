# Generuje _build\pages\50-video.html z _src\filmy-ua.txt
# (single source of truth for the video grid, the filter chips and VideoObject JSON-LD)
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$site = 'https://smoltech.com.ua'

$cats = New-Object Collections.Generic.List[object]
$vids = New-Object Collections.Generic.List[object]
foreach ($l in [IO.File]::ReadAllLines((Join-Path $root '_src\filmy-ua.txt'), [Text.Encoding]::UTF8)) {
  $p = $l -split "`t"
  if ($p[0] -eq 'CAT') { $cats.Add([pscustomobject]@{ key = $p[1]; label = $p[2]; desc = $p[3] }) }
  elseif ($p[0] -eq 'VID') { $vids.Add([pscustomobject]@{ cat = $p[1]; id = $p[2]; title = $p[3] }) }
}

function Esc([string]$s) {
  return $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}
function EscJson([string]$s) { return $s.Replace('\', '\\').Replace('"', '\"') }

$sb = New-Object Text.StringBuilder
$add = { param($t) [void]$sb.AppendLine($t) }

$total = $vids.Count
& $add @"
---
out: video-avtomatyzatsiya-zvaryuvannya/index.html
url: /video-avtomatyzatsiya-zvaryuvannya/
nav: video
title: Відео — автоматизація зварювання: $total реалізацій | SMOLTECH
desc: $total відео з роботи наших зварювальних комплексів: точкове та рельєфне зварювання, шовне по колу, багатоточкові лінії для сіток і автоматичне приварювання шпильок.
ogtitle: Відео — автоматизація зварювання, реалізації SMOLTECH
og: og-video.jpg
crumbs: Відео — автоматизація зварювання
prio: 0.9
pl: https://www.smoltech.pl/zgrzewarki-do-metalu-realizacje/
---

<section class="hero hero--page">
  <div class="hero__bg">
    <picture>
      <source srcset="/assets/img/band-realizacje.webp" type="image/webp">
      <img src="/assets/img/band-realizacje.jpg" alt="" width="600" height="400" fetchpriority="high" decoding="async">
    </picture>
  </div>
  <div class="wrap hero__in">
    <div class="hero__max">
      <p class="eyebrow">Реалізації</p>
      <h1 class="h-xl">Відео — автоматизація зварювання</h1>
      <p class="hero__sub">Автоматизація та роботизація зварювальних процесів — найважливіший напрям нашої діяльності. Ми створюємо спеціалізовані зварювальні комплекси: технічно передове обладнання контактного зварювання, спроєктоване з нуля під конкретне завдання. Кожну машину знято на відео, щоб показати її роботу.</p>
      <div class="hero__btns">
        <a class="btn" href="#zapyt">Обговорити проєкт</a>
        <a class="btn btn-ghost" href="https://www.youtube.com/user/SMOLTECH/videos" target="_blank" rel="noopener">Канал на YouTube</a>
      </div>
    </div>
  </div>
  <span class="spark" aria-hidden="true"></span>
</section>

<section class="sec sec-dark-2">
  <div class="wrap">
    <div class="sec-head sec-head-wide rv">
      <p class="eyebrow">$total відео</p>
      <h2 class="h-lg">Наші зварювальні комплекси в роботі</h2>
      <p class="lead">Оберіть категорію, щоб побачити відповідні реалізації. Відео завантажується з YouTube лише після натискання — сторінка не надсилає жодних запитів до сторонніх сервісів раніше.</p>
    </div>

    <div class="chips rv rv-d1" role="tablist" aria-label="Категорії відео">
      <button class="chip" type="button" role="tab" data-filter="all" aria-selected="true">Усі<small>$total</small></button>
"@

foreach ($c in $cats) {
  $n = ($vids | Where-Object { $_.cat -eq $c.key }).Count
  & $add ('      <button class="chip" type="button" role="tab" data-filter="{0}" aria-selected="false">{1}<small>{2}</small></button>' -f $c.key, (Esc $c.label), $n)
}

& $add @'
    </div>
    <p id="filter-status" class="vh" role="status" aria-live="polite"></p>

    <div class="grid g-3">
'@

$catLabel = @{}
foreach ($c in $cats) { $catLabel[$c.key] = $c.label }

$i = 0
foreach ($v in $vids) {
  $delay = @('', ' rv-d1', ' rv-d2')[$i % 3]
  $i++
  $t = Esc $v.title
  & $add ('      <article class="vcard rv{0}" data-cat="{1}">' -f $delay, $v.cat)
  & $add ('        <button class="yt" type="button" data-vid="{0}" data-title="{1}" aria-label="Дивитись відео: {1}">' -f $v.id, $t)
  & $add ('          <img src="/assets/img/yt/{0}.jpg" alt="" width="640" height="360" loading="lazy" decoding="async">' -f $v.id)
  & $add '          <span class="yt__play"><span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></span>'
  & $add '        </button>'
  & $add '        <div class="vcard__body">'
  & $add ('          <span class="vcard__kind">{0}</span>' -f (Esc $catLabel[$v.cat]))
  & $add ('          <h3>{0}</h3>' -f $t)
  & $add '        </div>'
  & $add '      </article>'
}

& $add @'
    </div>
  </div>
</section>

<section class="sec sec-paper">
  <div class="wrap">
    <div class="sec-head sec-head-wide rv">
      <p class="eyebrow">Контроль процесу</p>
      <h2 class="h-lg">Сучасні технології контролю зварювального процесу</h2>
      <p class="lead">Ступінь автоматизації процесу, час операції, рівень безпеки, а також обсяг і точність вимірювання параметрів залежать від вимог замовника. Крім контактного зварювання, у межах одного комплексу часто виконуються й інші операції: запресування деталей, калібрування, тест міцності зʼєднання, палетизація або укладання на кінцевій станції.</p>
    </div>
    <ul class="ticks ticks--2 rv rv-d1" style="max-width:96ch">
      <li>Розгорнуті системи детального вимірювання параметрів процесу зварювання зі збором даних.</li>
      <li>Контрольні рішення класу Poka-Yoke.</li>
      <li>Власні тести контрольних систем Error Proofing.</li>
      <li>Системи ідентифікації оснастки та контрольовані рівні доступу.</li>
      <li>Дистанційний онлайн-моніторинг процесів і роботи обладнання.</li>
      <li>Візуалізація процесу та моніторинг у реальному часі.</li>
    </ul>
  </div>
</section>

<section class="sec sec-paper-2">
  <div class="wrap">
    <div class="sec-head sec-head-wide rv">
      <p class="eyebrow">Галузі</p>
      <h2 class="h-lg">Виробник зварювальних машин для різних галузей промисловості</h2>
      <p class="lead">Ми проєктуємо й будуємо як окремі автоматичні машини для зварювання металу, так і розгалужені технологічні лінії, адаптовані до специфіки галузі. Як виробник машин контактного зварювання для промисловості ми співпрацюємо із заводами:</p>
    </div>
    <ul class="ticks ticks--2 rv rv-d1" style="max-width:96ch">
      <li>автомобільних компонентів і вузлів;</li>
      <li>стальних меблів;</li>
      <li>зварних огорожних і армувальних сіток;</li>
      <li>стальних корпусів і шаф;</li>
      <li>вентиляційних систем та інших металевих виробів у Польщі, Україні та світі.</li>
    </ul>
  </div>
</section>
'@

# VideoObject graph - one entry per film, so each video can surface in search
$nodes = New-Object Collections.Generic.List[string]
foreach ($v in $vids) {
  $nodes.Add(('{{"@type":"VideoObject","name":"{0}","description":"{0} — реалізація SMOLTECH Technika Zgrzewalnicza.","thumbnailUrl":"{1}/assets/img/yt/{2}.jpg","embedUrl":"https://www.youtube-nocookie.com/embed/{2}","contentUrl":"https://www.youtube.com/watch?v={2}","uploadDate":"2024-01-01","publisher":{{"@id":"{1}/#org"}}}}' -f (EscJson $v.title), $site, $v.id))
}
& $add ('<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","name":"Відео — автоматизація зварювання SMOLTECH","numberOfItems":' + $total + ',"itemListElement":[' + (($nodes | ForEach-Object { $j = $_; '{"@type":"ListItem","position":' + (++$script:pos) + ',"item":' + $j + '}' }) -join ',') + ']}</script>')

& $add ''
& $add '{{FORMULARZ}}'

$outFile = Join-Path $root '_build\pages\50-video.html'
[IO.File]::WriteAllText($outFile, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
Write-Output "wrote $outFile ($total videos, $($cats.Count) categories)"
