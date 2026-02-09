@echo off
echo ========================================
echo Rental and Sales Marketplace Database Setup
echo ========================================
echo.

REM Configuration
set MYSQL_PATH=C:\xampp\mysql\bin
set DB_NAME=rental_marketplace
set DB_USER=root
set DB_PASS=

echo [1/6] Creating database...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% -e "DROP DATABASE IF EXISTS %DB_NAME%; CREATE DATABASE %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)
echo Database created successfully!
echo.

echo [2/6] Importing main schema (database_advanced.sql)...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_advanced.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to import database_advanced.sql
    pause
    exit /b 1
)
echo Main schema imported!
echo.

echo [3/6] Importing analytics schema (database_analytics.sql)...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_analytics.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to import database_analytics.sql
    pause
    exit /b 1
)
echo Analytics schema imported!
echo.

echo [4/6] Importing comprehensive features (database_comprehensive.sql)...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_comprehensive.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to import database_comprehensive.sql
    pause
    exit /b 1
)
echo Comprehensive features imported!
echo.

echo [5/6] Importing admin system (database_admin.sql)...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_admin.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to import database_admin.sql
    pause
    exit /b 1
)
echo Admin system imported!
echo.

echo [6/6] Verifying installation...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% -e "SHOW TABLES;"
echo.

echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database Name: %DB_NAME%
echo Total Tables: Check output above
echo.
echo You can now start using the application!
echo.
pause
