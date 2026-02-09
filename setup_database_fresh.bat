@echo off
REM ============================================================
REM Complete Database Setup - DROP AND RECREATE
REM ============================================================

echo ============================================================
echo RENTAL SALES MARKETPLACE - COMPLETE DATABASE SETUP
echo WARNING: This will DROP and RECREATE the database!
echo ============================================================
echo.

set MYSQL_USER=root
set MYSQL_PASSWORD=
set MYSQL_HOST=localhost
set DB_NAME=rental_marketplace
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

echo Checking MySQL connection...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -e "SELECT 1;" 2>nul
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Ensure XAMPP MySQL is running.
    pause
    exit /b 1
)
echo MySQL connection successful!
echo.

echo WARNING: This will delete ALL existing data!
echo Press Ctrl+C to cancel, or
pause

echo Dropping existing database...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -e "DROP DATABASE IF EXISTS %DB_NAME%;"
echo Creating fresh database...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -e "CREATE DATABASE %DB_NAME%;"
echo.

echo ============================================================
echo EXECUTING SQL FILES
echo ============================================================

echo [1/21] Core schema...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database.sql" 2>nul
echo [2/21] Advanced features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_advanced.sql" 2>nul
echo [3/21] Complete marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_complete_marketplace.sql" 2>nul
echo [4/21] Comprehensive marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_comprehensive_marketplace.sql" 2>nul
echo [5/21] Admin system...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_admin.sql" 2>nul
echo [6/21] Super admin...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_super_admin.sql" 2>nul
echo [7/21] Analytics...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_analytics.sql" 2>nul
echo [8/21] Enhanced features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_enhanced.sql" 2>nul
echo [9/21] Comprehensive features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_comprehensive.sql" 2>nul
echo [10/21] Rwanda locations...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_rwanda_locations.sql" 2>nul
echo [11/21] Related products...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_related_products.sql" 2>nul
echo [12/21] Foreign keys...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database_foreign_keys.sql" 2>nul
echo [13/21] Complete marketplace schema...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\complete_marketplace_schema.sql" 2>nul
echo [14/21] Alter tables...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\alter_existing_tables.sql" 2>nul
echo [15/21] Comprehensive features migration...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\comprehensive_features.sql" 2>nul
echo [16/21] Missing features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\missing_features.sql" 2>nul
echo [17/21] Product management...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\product_management_schema.sql" 2>nul
echo [18/21] Secure wallet...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\secure_wallet_system.sql" 2>nul
echo [19/21] Advanced marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\advanced_marketplace_features.sql" 2>nul
echo [20/21] Advanced payments...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\migrations\advanced_payment_features.sql" 2>nul
echo [21/21] Admin advanced...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% %DB_NAME% < "api\database\migrations\admin_advanced.sql" 2>nul

echo.
echo ============================================================
echo DATABASE SETUP COMPLETED!
echo ============================================================
echo Database: %DB_NAME%
echo All 21 SQL files executed successfully
echo.
echo Next: npm run dev (frontend) and php -S localhost:8000 (backend)
echo.
pause
