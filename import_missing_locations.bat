@echo off
echo ============================================================
echo Import Missing Rwanda Locations Complete File
echo ============================================================
echo.

set MYSQL_USER=root
set MYSQL_PASSWORD=
set DB_NAME=rental_marketplace
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

echo Importing rwanda_locations_complete.sql...
echo This will add location support to users and products tables.
echo.

"%MYSQL_PATH%" -u%MYSQL_USER% %DB_NAME% < "api\migrations\rwanda_locations_complete.sql"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to import rwanda_locations_complete.sql
    echo This might be because the columns already exist.
    echo Check the error message above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo SUCCESS! Rwanda locations complete file imported.
echo ============================================================
echo.
echo Added features:
echo - User location fields (province, district, sector)
echo - Product location fields (province, district, sector)
echo - Additional missing sectors
echo - Performance indexes for location queries
echo.
pause
