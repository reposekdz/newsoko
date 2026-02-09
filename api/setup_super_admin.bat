@echo off
echo ========================================
echo Super Admin Management Setup
echo ========================================
echo.

set MYSQL_PATH=C:\xampp\mysql\bin
set DB_NAME=rental_marketplace
set DB_USER=root

echo [1/6] Creating base database...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% < database.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create base database
    pause
    exit /b 1
)
echo Base database created successfully!
echo.

echo [2/6] Setting up admin system...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_admin.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup admin system
    pause
    exit /b 1
)
echo Admin system setup successfully!
echo.

echo [3/6] Adding foreign keys and constraints...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_foreign_keys.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to add foreign keys
    pause
    exit /b 1
)
echo Foreign keys added successfully!
echo.

echo [4/6] Installing super admin features...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_super_admin.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to install super admin features
    pause
    exit /b 1
)
echo Super admin features installed successfully!
echo.

echo [5/6] Setting up enhanced features...
if exist database_enhanced.sql (
    "%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_enhanced.sql
    echo Enhanced features installed!
) else (
    echo Enhanced features file not found, skipping...
)
echo.

echo [6/6] Setting up analytics...
if exist database_analytics.sql (
    "%MYSQL_PATH%\mysql.exe" -u%DB_USER% %DB_NAME% < database_analytics.sql
    echo Analytics setup complete!
) else (
    echo Analytics file not found, skipping...
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Database: %DB_NAME%
echo Super Admin User: First user (ID: 1)
echo.
echo Next steps:
echo 1. Start your development server: npm run dev
echo 2. Login with the first user account
echo 3. Access Super Admin Dashboard
echo.
pause
