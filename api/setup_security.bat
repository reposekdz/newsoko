@echo off
echo ========================================
echo NEWSOKO SECURITY FEATURES SETUP
echo ========================================
echo.

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_NAME=newsoko
set DB_USER=root
set DB_PASS=

echo Installing security features...
"%MYSQL_PATH%" -u %DB_USER% %DB_NAME% < migrations\security_features.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Security features installed
    echo ========================================
    echo.
    echo Features installed:
    echo - Multi-Factor Authentication (MFA)
    echo - Biometric Login (WebAuthn)
    echo - KYC Verification
    echo - Escrow Triple Approval
    echo - Anti-Fraud Detection
    echo - Data Encryption
    echo - Rate Limiting
    echo - IP Tracking
    echo - Audit Logs
    echo - Image Verification
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR! Installation failed
    echo ========================================
    echo.
)

pause
