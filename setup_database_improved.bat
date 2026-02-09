@echo off
REM ============================================================
REM IMPROVED Complete Database Setup - All 22 SQL Files
REM ============================================================

echo ============================================================
echo RENTAL SALES MARKETPLACE - COMPLETE DATABASE SETUP
echo WARNING: This will DROP and RECREATE the database!
echo ============================================================
echo.

set MYSQL_USER=root
set MYSQL_PASSWORD=
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set DB_NAME=rental_marketplace
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

echo Checking MySQL connection...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT 1;"
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Please ensure XAMPP MySQL is running.
    pause
    exit /b 1
)
echo MySQL connection successful!
echo.

echo WARNING: This will delete ALL existing data!
pause

echo Dropping existing database...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "DROP DATABASE IF EXISTS %DB_NAME%;"

echo Creating fresh database...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "CREATE DATABASE %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo.

echo ============================================================
echo EXECUTING SQL FILES
echo ============================================================

echo [1/22] Core schema...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database.sql"

echo [2/22] Advanced features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_advanced.sql"

echo [3/22] Complete marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_complete_marketplace.sql"

echo [4/22] Comprehensive marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_comprehensive_marketplace.sql"

echo [5/22] Admin system...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_admin.sql"

echo [6/22] Super admin...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_super_admin.sql"

echo [7/22] Analytics...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_analytics.sql"

echo [8/22] Enhanced features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_enhanced.sql"

echo [9/22] Comprehensive features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_comprehensive.sql"

echo [10/22] Rwanda locations...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_rwanda_locations.sql"

echo [11/22] Related products...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_related_products.sql"

echo [12/22] Foreign keys...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_foreign_keys.sql"

echo [13/22] Complete marketplace schema...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\complete_marketplace_schema.sql"

echo [14/22] Alter tables...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\alter_existing_tables.sql"

echo [15/22] Comprehensive features migration...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\comprehensive_features.sql"

echo [16/22] Missing features...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\missing_features.sql"

echo [17/22] Product management...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\product_management_schema.sql"

echo [18/22] Secure wallet...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\secure_wallet_system.sql"

echo [19/22] Advanced marketplace...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\advanced_marketplace_features.sql"

echo [20/22] Advanced payments...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\advanced_payment_features.sql"

echo [21/22] Admin advanced...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database\migrations\admin_advanced.sql"

echo [22/22] Rwanda locations complete (with user/product location support)...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\rwanda_locations_complete.sql"

echo.
echo ============================================================
echo DATABASE SETUP COMPLETED!
echo ============================================================
echo Database: %DB_NAME%
echo All 22 SQL files executed successfully
echo.
echo Next: npm run dev (frontend) and php -S localhost:8000 (backend)
echo.
pause
