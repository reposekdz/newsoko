@echo off
echo ========================================
echo NEWSOKO SECURITY API TESTING
echo ========================================
echo.

set API_URL=http://localhost/Rentalsalesmarketplace/api/controllers

echo [1/10] Testing MFA - Enable...
curl -X POST %API_URL%/mfa.php -H "Content-Type: application/json" -d "{\"action\":\"enable\",\"user_id\":1,\"method\":\"sms\",\"phone_number\":\"+250788123456\"}"
echo.
echo.

echo [2/10] Testing MFA - Send Code...
curl -X POST %API_URL%/mfa.php -H "Content-Type: application/json" -d "{\"action\":\"send_code\",\"user_id\":1,\"method\":\"sms\"}"
echo.
echo.

echo [3/10] Testing KYC - Submit...
curl -X POST %API_URL%/kyc.php -H "Content-Type: application/json" -d "{\"action\":\"submit\",\"user_id\":1,\"id_type\":\"national_id\",\"id_number\":\"1199780012345678\",\"id_front_image\":\"/uploads/id.jpg\",\"id_back_image\":\"/uploads/id_back.jpg\",\"selfie_image\":\"/uploads/selfie.jpg\"}"
echo.
echo.

echo [4/10] Testing Escrow - Create...
curl -X POST %API_URL%/escrow.php -H "Content-Type: application/json" -d "{\"action\":\"create\",\"booking_id\":1,\"amount\":50000}"
echo.
echo.

echo [5/10] Testing Fraud - Check Payment...
curl -X POST %API_URL%/fraud.php -H "Content-Type: application/json" -d "{\"action\":\"check_payment\",\"user_id\":1,\"ip_address\":\"192.168.1.1\",\"card_fingerprint\":\"card123\",\"amount\":50000}"
echo.
echo.

echo [6/10] Testing Security - Track Login...
curl -X POST %API_URL%/security.php -H "Content-Type: application/json" -d "{\"action\":\"track_login\",\"user_id\":1,\"ip_address\":\"192.168.1.1\"}"
echo.
echo.

echo [7/10] Testing Image - Verify Authenticity...
curl -X POST %API_URL%/image_verification.php -H "Content-Type: application/json" -d "{\"action\":\"verify_authenticity\",\"image_path\":\"/uploads/product.jpg\"}"
echo.
echo.

echo [8/10] Testing Biometric - Register Challenge...
curl -X POST %API_URL%/biometric.php -H "Content-Type: application/json" -d "{\"action\":\"register-challenge\",\"user_id\":1}"
echo.
echo.

echo [9/10] Testing Rate Limiting (10 rapid requests)...
for /L %%i in (1,1,10) do (
    curl -s %API_URL%/mfa.php -H "Content-Type: application/json" -d "{\"action\":\"status\",\"user_id\":1}" > nul
    echo Request %%i sent
)
echo.
echo.

echo [10/10] Testing Fraud Stats...
curl -X POST %API_URL%/fraud.php -H "Content-Type: application/json" -d "{\"action\":\"stats\",\"days\":7}"
echo.
echo.

echo ========================================
echo TESTING COMPLETE
echo ========================================
pause
