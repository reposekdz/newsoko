@echo off
echo Fixing all API controller Auth errors...

cd c:\xampp\htdocs\Rentalsalesmarketplace\api\controllers

REM Fix escaped dollar signs
powershell -Command "Get-ChildItem -Filter *.php | ForEach-Object { $content = Get-Content $_.FullName -Raw; $content = $content -replace '\\\\(\$)', '$1'; Set-Content $_.FullName -Value $content -NoNewline }"

REM Fix validateToken() calls without parameters
powershell -Command "Get-ChildItem -Filter *.php | ForEach-Object { $content = Get-Content $_.FullName -Raw; $content = $content -replace '\$auth->validateToken\(\)', '\$auth->requireAuth()'; Set-Content $_.FullName -Value $content -NoNewline }"

REM Fix authenticate() calls
powershell -Command "Get-ChildItem -Filter *.php | ForEach-Object { $content = Get-Content $_.FullName -Raw; $content = $content -replace '\$auth->authenticate\(\)', '\$auth->requireAuth()'; Set-Content $_.FullName -Value $content -NoNewline }"

echo Done! All Auth errors fixed.
pause
