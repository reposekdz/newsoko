@echo off
echo ============================================================
echo Rwanda Complete Locations Migration
echo ============================================================
echo.

cd /d "%~dp0"

if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" run_rwanda_locations.php
) else if exist "C:\php\php.exe" (
    "C:\php\php.exe" run_rwanda_locations.php
) else (
    php run_rwanda_locations.php
)

echo.
echo ============================================================
echo Migration script completed
echo ============================================================
pause
