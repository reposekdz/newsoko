@echo off
REM Newsoko Marketplace - Production Setup Script
REM This script sets up the complete database with all features

echo ============================================
echo Newsoko Marketplace - Production Setup
echo ============================================
echo.

REM Check if PHP is available
where php >nul 2>&1
if %errorlevel% equ 0 (
    echo [1] Running PHP database setup...
    php api/setup_production_db.php
    echo.
    echo Setup completed!
) else (
    echo [1] PHP not found. Please run manually:
    echo.
    echo Option A - Using PHP:
    echo   php api/setup_production_db.php
    echo.
    echo Option B - Using MySQL command line:
    echo   mysql -u root -p < api/migrations/rwanda_locations_complete.sql
    echo.
    echo Option C - Import in phpMyAdmin:
    echo   1. Open phpMyAdmin (http://localhost/phpmyadmin)
    echo   2. Create a database named 'newsoko'
    echo   3. Import api/migrations/rwanda_locations_complete.sql
)

echo.
echo ============================================
echo Next Steps:
echo ============================================
echo.
echo [1] Update .env with your database credentials:
echo   DB_HOST=localhost
echo   DB_NAME=newsoko
echo   DB_USER=root
echo   DB_PASS=your_password
echo.
echo [2] Start the development server:
echo   npm run dev
echo.
echo [3] Test the APIs:
echo   Login: POST /api/controllers/users.php
echo   ^{"action":"login","email":"jb.mugabo@example.rw","password":"password123"^}
echo.
echo   Get Provinces: GET /api/controllers/rwanda_locations.php?action=provinces
echo.
echo ============================================

pause
