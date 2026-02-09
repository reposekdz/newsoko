@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  NEWSOKO - POWERFUL API UPDATER
echo ========================================
echo.
echo Updating ALL component files...
echo.

set "count=0"
set "updated=0"

for /r "src" %%f in (*.tsx *.ts) do (
    set /a count+=1
    set "needsUpdate=0"
    
    findstr /C:"from '../../../services/api'" "%%f" >nul 2>&1
    if !errorlevel! equ 0 set "needsUpdate=1"
    
    findstr /C:"from '../../services/api'" "%%f" >nul 2>&1
    if !errorlevel! equ 0 set "needsUpdate=1"
    
    findstr /C:"from '../services/api'" "%%f" >nul 2>&1
    if !errorlevel! equ 0 set "needsUpdate=1"
    
    if !needsUpdate! equ 1 (
        echo [UPDATING] %%~nxf
        powershell -Command "$content = Get-Content '%%f' -Raw; $content = $content -replace \"from '../../../services/api'\", \"from '@/services'\"; $content = $content -replace \"from '../../services/api'\", \"from '@/services'\"; $content = $content -replace \"from '../services/api'\", \"from '@/services'\"; $content = $content -replace 'import { api }', 'import { api, completeApi }'; Set-Content -Path '%%f' -Value $content -NoNewline"
        set /a updated+=1
    )
)

echo.
echo ========================================
echo Scanned: !count! files
echo Updated: !updated! files  
echo ========================================
echo.
echo ✓ All imports updated to centralized API!
echo.
echo Now you can use:
echo   - api.* for all existing APIs
echo   - completeApi.security.* for MFA, KYC, Escrow, Fraud
echo   - completeApi.messaging.* for enhanced messaging
echo   - completeApi.biometric.* for biometric auth
echo.
pause
