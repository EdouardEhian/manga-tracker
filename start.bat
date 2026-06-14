@echo off
title MangaTrack - Lancement
echo.
echo  ==========================================
echo    MANGATRACK - Installation et lancement
echo  ==========================================
echo.

cd /d "%~dp0"

echo [1/3] Installation des dependances backend...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installation des dependances frontend...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Lancement des serveurs...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set LOCAL_IP=%%a
  goto :found
)
:found
set LOCAL_IP=%LOCAL_IP: =%

echo  ----------------------------------------
echo   PC      : http://localhost:5173
echo   Telephone: http://%LOCAL_IP%:5173
echo  ----------------------------------------
echo.
echo  (telephone et PC doivent etre sur le meme Wi-Fi)
echo.

start "MangaTrack Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "MangaTrack Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
