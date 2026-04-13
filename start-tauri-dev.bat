@echo off
setlocal

cd /d "%~dp0"

echo Starting Tauri dev in:
echo %CD%
echo.

npm run tauri:dev
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo npm run tauri:dev exited with code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
