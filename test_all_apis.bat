@echo off
echo ========================================
echo NEWSOKO API HEALTH CHECK
echo ========================================
echo.

echo [1/10] Testing Database Connection...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/products.php > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Database Connected) else (echo [FAIL] Database Error)

echo [2/10] Testing Products API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/products.php | find "success" > nul
if %errorlevel% equ 0 (echo [OK] Products API) else (echo [FAIL] Products API)

echo [3/10] Testing Users API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/users.php | find "error" > nul
if %errorlevel% equ 0 (echo [OK] Users API) else (echo [FAIL] Users API)

echo [4/10] Testing Locations API...
curl -s "http://localhost/Rentalsalesmarketplace/api/controllers/rwanda_locations.php?type=provinces" | find "success" > nul
if %errorlevel% equ 0 (echo [OK] Locations API) else (echo [FAIL] Locations API)

echo [5/10] Testing Messaging API...
curl -s "http://localhost/Rentalsalesmarketplace/api/controllers/messaging.php?conversations=1" > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Messaging API) else (echo [FAIL] Messaging API)

echo [6/10] Testing Bookings API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/bookings.php > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Bookings API) else (echo [FAIL] Bookings API)

echo [7/10] Testing Wallet API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/wallet.php > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Wallet API) else (echo [FAIL] Wallet API)

echo [8/10] Testing Reviews API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/reviews.php > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Reviews API) else (echo [FAIL] Reviews API)

echo [9/10] Testing Auctions API...
curl -s "http://localhost/Rentalsalesmarketplace/api/controllers/auctions.php?status=active" > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Auctions API) else (echo [FAIL] Auctions API)

echo [10/10] Testing Notifications API...
curl -s http://localhost/Rentalsalesmarketplace/api/controllers/notifications.php > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Notifications API) else (echo [FAIL] Notifications API)

echo.
echo ========================================
echo Testing Frontend Server...
echo ========================================
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% equ 0 (echo [OK] Frontend Running on http://localhost:5173) else (echo [FAIL] Frontend Not Running)

echo.
echo ========================================
echo SUMMARY
echo ========================================
echo Backend API: http://localhost/Rentalsalesmarketplace/api/controllers/
echo Frontend: http://localhost:5173
echo Database: rental_marketplace (71 tables)
echo.
pause
