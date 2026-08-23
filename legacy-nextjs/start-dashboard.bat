@echo off
setlocal
cd /d "%~dp0"

echo Working directory:
cd

echo.
echo Installing dependencies...
call npm install
if errorlevel 1 goto :fail_install

echo.
echo Building app...
call npm run build
if errorlevel 1 goto :fail_build

echo.
echo Opening browser...
start "" "http://localhost:3000"

echo.
echo Starting dashboard...
call npm run start
if errorlevel 1 goto :fail_start

goto :end

:fail_install
echo.
echo npm install failed.
pause
exit /b 1

:fail_build
echo.
echo npm run build failed.
pause
exit /b 1

:fail_start
echo.
echo npm run start failed.
pause
exit /b 1

:end
endlocal
pause