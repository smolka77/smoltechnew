@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set TAR=%~dp0smoltech.tar.gz
set STAGE=%TEMP%\smoltech-pakiet

echo [1/2] Zbieram pliki...
if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%"
mkdir "%STAGE%\assets"
mkdir "%STAGE%\panel"
mkdir "%STAGE%\vps"
mkdir "%STAGE%\_private"
mkdir "%STAGE%\_private\data"
mkdir "%STAGE%\_private\sessions"

copy /Y "index.html" "%STAGE%\" >nul
copy /Y "404.html" "%STAGE%\" >nul
copy /Y ".htaccess" "%STAGE%\" >nul
copy /Y "robots.txt" "%STAGE%\" >nul
copy /Y "llms.txt" "%STAGE%\" >nul
copy /Y "sitemap.xml" "%STAGE%\" >nul
copy /Y "site.webmanifest" "%STAGE%\" >nul
copy /Y "favicon.ico" "%STAGE%\" >nul
copy /Y "wyslij.php" "%STAGE%\" >nul
copy /Y "send.php" "%STAGE%\" >nul

for %%D in (
  avtomatyzovani-kompleksy
  bahatofunktsionalni-invertorni-mashyny
  cnc-kompleksy-pryvaryuvannya-shpylok
  invertorne-pryvaryuvannya-da
  kompetentsiyi
  kondensatorne-pryvaryuvannya-cdm
  kontakty
  mashyny-dlya-zvaryuvannya-sitok
  mashyny-zvaryuvannya-z-osnastkoyu
  pidvisni-klishchovi-mashyny
  polityka-konfidentsiynosti
  pro-kompaniyu
  pryvaryuvannya-shpylok
  statsionarni-tochkovi-mashyny
  tochkovi-ta-relyefni-mashyny
  tochkovo-relyefni-mashyny
  video-avtomatyzatsiya-zvaryuvannya
) do (
  if exist "%%D" xcopy /E /I /Q /Y "%%D" "%STAGE%\%%D\" >nul
)

xcopy /E /I /Q /Y "assets" "%STAGE%\assets\" >nul
xcopy /E /I /Q /Y "panel" "%STAGE%\panel\" >nul
xcopy /E /I /Q /Y "vps" "%STAGE%\vps\" >nul

mkdir "%STAGE%\_build" >nul 2>nul
mkdir "%STAGE%\_build\pages" >nul 2>nul
mkdir "%STAGE%\_build\partials" >nul 2>nul
xcopy /E /I /Q /Y "_build\pages" "%STAGE%\_build\pages\" >nul
xcopy /E /I /Q /Y "_build\partials" "%STAGE%\_build\partials\" >nul
copy /Y "_build\szablon.html" "%STAGE%\_build\" >nul
if exist "_build\ustawienia.json" copy /Y "_build\ustawienia.json" "%STAGE%\_build\" >nul
if exist "_build\nakladka-jezyk.json" copy /Y "_build\nakladka-jezyk.json" "%STAGE%\_build\" >nul
if exist "_build\cache-tlumaczen.json" copy /Y "_build\cache-tlumaczen.json" "%STAGE%\_build\" >nul

mkdir "%STAGE%\_src" >nul 2>nul
if exist "_src\filmy-ua.txt" copy /Y "_src\filmy-ua.txt" "%STAGE%\_src\" >nul
if exist "_src\tlumacz.py" copy /Y "_src\tlumacz.py" "%STAGE%\_src\" >nul
if exist "_src\sens_tlumaczenia.py" copy /Y "_src\sens_tlumaczenia.py" "%STAGE%\_src\" >nul
if exist "_src\cms.py" copy /Y "_src\cms.py" "%STAGE%\_src\" >nul

copy /Y "_private\auth.env" "%STAGE%\_private\" >nul
copy /Y "_private\start.php" "%STAGE%\_private\" >nul
copy /Y "_private\skrzynka.php" "%STAGE%\_private\" >nul
copy /Y "_private\index.php" "%STAGE%\_private\" >nul
copy /Y "_private\cms.php" "%STAGE%\_private\" >nul
copy /Y "_private\katalog.php" "%STAGE%\_private\" >nul
copy /Y "_private\tlumacz.php" "%STAGE%\_private\" >nul
copy /Y "_private\sens-tlumaczenia.php" "%STAGE%\_private\" >nul
copy /Y "_private\slownik-jezyk.json" "%STAGE%\_private\" >nul
copy /Y "_private\.htaccess" "%STAGE%\_private\" >nul
if exist "_private\hasla.env.przyklad" copy /Y "_private\hasla.env.przyklad" "%STAGE%\_private\" >nul
if exist "_private\data\.htaccess" copy /Y "_private\data\.htaccess" "%STAGE%\_private\data\" >nul
if exist "_private\data\index.php" copy /Y "_private\data\index.php" "%STAGE%\_private\data\" >nul
if exist "_private\data\magazyn.php" copy /Y "_private\data\magazyn.php" "%STAGE%\_private\data\" >nul
if exist "_private\sessions\.htaccess" copy /Y "_private\sessions\.htaccess" "%STAGE%\_private\sessions\" >nul
if exist "_private\sessions\index.php" copy /Y "_private\sessions\index.php" "%STAGE%\_private\sessions\" >nul

echo [2/2] Pakuje archiwum...
if exist "%TAR%" del /f /q "%TAR%"
tar.exe -czf "%TAR%" -C "%STAGE%" .
if errorlevel 1 (
  echo BLAD tar
  exit /b 1
)

for %%A in ("%TAR%") do echo GOTOWE: %TAR%  %%~zA bajtow
endlocal
