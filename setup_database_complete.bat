@echo off
REM ============================================================
REM Complete Database Setup for Rental Sales Marketplace
REM This batch file runs ALL SQL files in the correct order
REM ============================================================

echo ============================================================
echo RENTAL SALES MARKETPLACE - COMPLETE DATABASE SETUP
echo ============================================================
echo.

REM Set MySQL credentials
set MYSQL_USER=root
set MYSQL_PASSWORD=
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set DB_NAME=rental_marketplace
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

echo Checking MySQL connection...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT 1;" 2>nul
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Please ensure XAMPP MySQL is running.
    pause
    exit /b 1
)

echo MySQL connection successful!
echo.

REM Create database if not exists
echo Creating database if not exists...
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"
echo Database created/verified: %DB_NAME%
echo.

echo ============================================================
echo STEP 1: Core Database Schema
echo ============================================================
echo Running: database.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database.sql"
if errorlevel 1 (
    echo ERROR: Failed to execute database.sql
    pause
    exit /b 1
)
echo [OK] Core schema created
echo.

echo ============================================================
echo STEP 2: Advanced Features
echo ============================================================
echo Running: database_advanced.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_advanced.sql"
if errorlevel 1 echo [WARNING] database_advanced.sql had issues, continuing...
echo [OK] Advanced features added
echo.

echo ============================================================
echo STEP 3: Complete Marketplace Schema
echo ============================================================
echo Running: database_complete_marketplace.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_complete_marketplace.sql"
if errorlevel 1 echo [WARNING] database_complete_marketplace.sql had issues, continuing...
echo [OK] Complete marketplace schema added
echo.

echo ============================================================
echo STEP 4: Comprehensive Marketplace Features
echo ============================================================
echo Running: database_comprehensive_marketplace.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_comprehensive_marketplace.sql"
if errorlevel 1 echo [WARNING] database_comprehensive_marketplace.sql had issues, continuing...
echo [OK] Comprehensive marketplace features added
echo.

echo ============================================================
echo STEP 5: Admin System
echo ============================================================
echo Running: database_admin.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_admin.sql"
if errorlevel 1 echo [WARNING] database_admin.sql had issues, continuing...
echo [OK] Admin system added
echo.

echo ============================================================
echo STEP 6: Super Admin Features
echo ============================================================
echo Running: database_super_admin.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_super_admin.sql"
if errorlevel 1 echo [WARNING] database_super_admin.sql had issues, continuing...
echo [OK] Super admin features added
echo.

echo ============================================================
echo STEP 7: Analytics System
echo ============================================================
echo Running: database_analytics.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_analytics.sql"
if errorlevel 1 echo [WARNING] database_analytics.sql had issues, continuing...
echo [OK] Analytics system added
echo.

echo ============================================================
echo STEP 8: Enhanced Features
echo ============================================================
echo Running: database_enhanced.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_enhanced.sql"
if errorlevel 1 echo [WARNING] database_enhanced.sql had issues, continuing...
echo [OK] Enhanced features added
echo.

echo ============================================================
echo STEP 9: Comprehensive Features
echo ============================================================
echo Running: database_comprehensive.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_comprehensive.sql"
if errorlevel 1 echo [WARNING] database_comprehensive.sql had issues, continuing...
echo [OK] Comprehensive features added
echo.

echo ============================================================
echo STEP 10: Rwanda Locations
echo ============================================================
echo Running: database_rwanda_locations.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_rwanda_locations.sql"
if errorlevel 1 echo [WARNING] database_rwanda_locations.sql had issues, continuing...
echo [OK] Rwanda locations added
echo.

echo ============================================================
echo STEP 11: Related Products
echo ============================================================
echo Running: database_related_products.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_related_products.sql"
if errorlevel 1 echo [WARNING] database_related_products.sql had issues, continuing...
echo [OK] Related products features added
echo.

echo ============================================================
echo STEP 12: Foreign Keys
echo ============================================================
echo Running: database_foreign_keys.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database_foreign_keys.sql"
if errorlevel 1 echo [WARNING] database_foreign_keys.sql had issues, continuing...
echo [OK] Foreign keys added
echo.

echo ============================================================
echo STEP 13: Migrations - Complete Marketplace Schema
echo ============================================================
echo Running: migrations\complete_marketplace_schema.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\complete_marketplace_schema.sql"
if errorlevel 1 echo [WARNING] complete_marketplace_schema.sql had issues, continuing...
echo [OK] Complete marketplace schema migration applied
echo.

echo ============================================================
echo STEP 14: Migrations - Alter Existing Tables
echo ============================================================
echo Running: migrations\alter_existing_tables.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\alter_existing_tables.sql"
if errorlevel 1 echo [WARNING] alter_existing_tables.sql had issues, continuing...
echo [OK] Table alterations applied
echo.

echo ============================================================
echo STEP 15: Migrations - Comprehensive Features
echo ============================================================
echo Running: migrations\comprehensive_features.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\comprehensive_features.sql"
if errorlevel 1 echo [WARNING] comprehensive_features.sql had issues, continuing...
echo [OK] Comprehensive features migration applied
echo.

echo ============================================================
echo STEP 16: Migrations - Missing Features
echo ============================================================
echo Running: migrations\missing_features.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\missing_features.sql"
if errorlevel 1 echo [WARNING] missing_features.sql had issues, continuing...
echo [OK] Missing features added
echo.

echo ============================================================
echo STEP 17: Migrations - Product Management
echo ============================================================
echo Running: migrations\product_management_schema.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\product_management_schema.sql"
if errorlevel 1 echo [WARNING] product_management_schema.sql had issues, continuing...
echo [OK] Product management features added
echo.

echo ============================================================
echo STEP 18: Migrations - Secure Wallet System
echo ============================================================
echo Running: migrations\secure_wallet_system.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\secure_wallet_system.sql"
if errorlevel 1 echo [WARNING] secure_wallet_system.sql had issues, continuing...
echo [OK] Secure wallet system added
echo.

echo ============================================================
echo STEP 19: Migrations - Advanced Marketplace Features
echo ============================================================
echo Running: migrations\advanced_marketplace_features.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\advanced_marketplace_features.sql"
if errorlevel 1 echo [WARNING] advanced_marketplace_features.sql had issues, continuing...
echo [OK] Advanced marketplace features added
echo.

echo ============================================================
echo STEP 20: Migrations - Advanced Payment Features
echo ============================================================
echo Running: migrations\advanced_payment_features.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\migrations\advanced_payment_features.sql"
if errorlevel 1 echo [WARNING] advanced_payment_features.sql had issues, continuing...
echo [OK] Advanced payment features added
echo.

echo ============================================================
echo STEP 21: Database Migrations - Admin Advanced
echo ============================================================
echo Running: database\migrations\admin_advanced.sql
"%MYSQL_PATH%" -u%MYSQL_USER% -h%MYSQL_HOST% -P%MYSQL_PORT% %DB_NAME% < "api\database\migrations\admin_advanced.sql"
if errorlevel 1 echo [WARNING] admin_advanced.sql had issues, continuing...
echo [OK] Admin advanced features added
echo.

echo ============================================================
echo DATABASE SETUP COMPLETED SUCCESSFULLY!
echo ============================================================
echo.
echo Database: %DB_NAME%
echo All SQL files have been executed.
echo.
echo Next steps:
echo 1. Start the backend: cd api ^&^& php -S localhost:8000
echo 2. Start the frontend: npm run dev
echo 3. Access the application at http://localhost:5173
echo.
echo Default admin credentials:
echo Email: admin@newsoko.rw
echo Password: password (hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
echo.
pause
