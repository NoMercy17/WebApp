@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: Book Library - Quick Run for Windows
:: 1 - Ensure firebaseConfig.js exists
:: 2 - Start a local web server (Python preferred, else Node npx serve, else open file)
:: 3 - Open the app in default browser

set ROOT_DIR=%~dp0
set PUBLIC_DIR=%ROOT_DIR%public
set PORT=5500

if not exist "%PUBLIC_DIR%" (
  echo [ERROR] Public folder not found: %PUBLIC_DIR%
  echo Run this script from the project root where run.bat is located.
  exit /b 1
)

pushd "%PUBLIC_DIR%" >nul

:: Ensure firebaseConfig.js exists
if not exist "firebaseConfig.js" (
  echo [INFO] firebaseConfig.js not found in /public
  if exist "firebaseConfig.example.js" (
    echo [INFO] Creating firebaseConfig.js from example... (please edit with your Firebase settings)
    copy /Y "firebaseConfig.example.js" "firebaseConfig.js" >nul
  ) else (
    echo [WARN] firebaseConfig.example.js not found. Create public\firebaseConfig.js manually.
  )
)

:: Try Python (py or python)
where py >nul 2>nul
if not errorlevel 1 (
  echo [INFO] Starting Python HTTP server on port %PORT% ...
  start "BookLibraryServer" cmd /c "py -m http.server %PORT%"
  goto :open_browser
)

where python >nul 2>nul
if not errorlevel 1 (
  echo [INFO] Starting Python HTTP server on port %PORT% ...
  start "BookLibraryServer" cmd /c "python -m http.server %PORT%"
  goto :open_browser
)

:: Try Node npx serve
where npx >nul 2>nul
if not errorlevel 1 (
  echo [INFO] Starting npx serve on port %PORT% ... (this may download first time)
  start "BookLibraryServer" cmd /c "npx serve -l %PORT% ."
  goto :open_browser
)

:: Fallback: open file directly (Google sign-in may not work on file protocol)
echo [WARN] No Python or Node found. Opening index.html directly.
start "BookLibrary" "index.html"
goto :end

:open_browser
:: Give the server a moment to start
>nul timeout /t 2 /nobreak

set BASE=http://localhost:%PORT%

echo [INFO] Opening app page:
echo   - %BASE%/index.html

start "BookLibrary-Index" "%BASE%/index.html"

goto :end

:end
popd >nul
endlocal
exit /b 0
