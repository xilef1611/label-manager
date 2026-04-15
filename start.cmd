@echo off
echo Starting Label Manager...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
start "Label Manager - Backend" cmd /k "cd /d %~dp0server && npx tsx src/index.ts"
timeout /t 2 /nobreak >nul
start "Label Manager - Frontend" cmd /k "cd /d %~dp0client && npx vite"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
