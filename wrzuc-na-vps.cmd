@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set IP=213.239.130.251
set TAR=%TEMP%\smoltech.tar.gz
set STAGE=%TEMP%\smoltech-pakiet

echo [1/4] Zbieram pliki (ready full)...
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

echo [2/4] Pakuje archiwum...
if exist "%TAR%" del /f /q "%TAR%"
tar.exe -czf "%TAR%" -C "%STAGE%" .
if errorlevel 1 (
  echo Nie udalo sie zrobic tar. Czy masz Windows 10/11 z tar.exe?
  exit /b 1
)

echo [3/4] Wysylam na VPS. Jak zapyta o haslo — wpisz haslo root.
echo.
scp.exe -O -P 22 "%TAR%" root@%IP%:/root/smoltech.tar.gz
if errorlevel 1 (
  echo scp nie przeszedl, probuje drugi sposob...
  ssh.exe -p 22 root@%IP% "cat > /root/smoltech.tar.gz" < "%TAR%"
)
if errorlevel 1 (
  echo Wysylka nie wyszla. Sprawdz IP, port 22 i haslo.
  exit /b 1
)

echo.
echo [4/4] Reset + start na VPS. Znowu haslo root. Czekaj 1-3 min.
echo.
ssh.exe -p 22 -o ServerAliveInterval=30 root@%IP% "set -e; APP=/var/www/smoltech.com.ua; KEEP=/root/smoltech-private-keep; rm -rf $KEEP; mkdir -p $KEEP; if [ -f $APP/_private/auth.env ]; then cp -a $APP/_private/auth.env $KEEP/auth.env; fi; if [ -f $APP/_private/data/magazyn.php ]; then cp -a $APP/_private/data/magazyn.php $KEEP/magazyn.php; fi; if [ -f $APP/_private/data/zapytania.json ]; then cp -a $APP/_private/data/zapytania.json $KEEP/zapytania.json; fi; if [ -f $APP/_private/data/limity-logowan.json ]; then cp -a $APP/_private/data/limity-logowan.json $KEEP/limity-logowan.json; fi; rm -rf $APP; mkdir -p $APP; tar -xzf /root/smoltech.tar.gz -C $APP; find $APP/vps -type f -exec sed -i 's/\r$//' {} +; find $APP/vps -name '*.sh' -exec chmod +x {} +; bash $APP/vps/instaluj.sh || bash $APP/vps/napraw.sh"
if errorlevel 1 (
  echo Instalacja na VPS nie wyszla. Zaloguj sie: ssh -p 22 root@%IP%
  exit /b 1
)

echo.
echo GOTOWE.
echo Strona: http://%IP%/
echo Panel:  http://%IP%/panel/
echo Strona tez: https://xtechart.com/
echo.
endlocal
