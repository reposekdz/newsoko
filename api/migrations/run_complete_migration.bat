@echo off
REM Complete Migration Batch File for Rwanda Locations
REM This script runs all necessary migrations

echo ============================================
echo Running Complete Rwanda Locations Migration
echo ============================================

REM Check if mysql is available
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo MySQL found. Running migration...
    mysql -u root -p < rwanda_locations_complete.sql
    if %errorlevel% equ 0 (
        echo Migration completed successfully!
    ) else (
        echo Migration failed. Please check the SQL file for errors.
    )
) else (
    echo MySQL command not found. Please run the SQL file manually:
    echo.
    echo 1. Open MySQL client (mysql -u root -p)
    echo 2. Run: SOURCE rwanda_locations_complete.sql
    echo.
    echo Or use a tool like phpMyAdmin or MySQL Workbench to import:
    echo api/migrations/rwanda_locations_complete.sql
)

pause
