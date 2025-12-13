@echo off
REM SLCM Dashboard - Quick Start Script (Windows)

echo.
echo ============================================
echo   SLCM Donor Dashboard - Quick Start
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)

echo [OK] npm is installed
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
echo This may take 2-3 minutes
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed. Please check the error above.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All dependencies installed!
echo.

REM Ask to start dev server
echo Ready to launch!
echo.
set /p answer="Would you like to start the development server now? (y/n): "

if /i "%answer%"=="y" goto :start
if /i "%answer%"=="yes" goto :start

echo.
echo No problem! Run this command when you're ready:
echo.
echo    npm run dev
echo.
echo Next steps:
echo    1. Read PROJECT_SUMMARY.md for overview
echo    2. Read README.md for detailed setup
echo    3. Check STAFF_GUIDE.md for updating needs
echo.
pause
exit /b 0

:start
echo.
echo Starting development server...
echo Dashboard will open at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 /nobreak >nul
call npm run dev
