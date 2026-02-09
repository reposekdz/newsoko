@echo off
echo ========================================
echo  NEWSOKO API IMPORT UPDATER
echo ========================================
echo.
echo This script will update all component imports to use centralized API
echo.

powershell -ExecutionPolicy Bypass -Command ^
"$files = Get-ChildItem -Path 'src' -Filter '*.tsx' -Recurse; " ^
"$count = 0; " ^
"foreach ($file in $files) { " ^
"  $content = Get-Content $file.FullName -Raw; " ^
"  $updated = $false; " ^
"  if ($content -match \"import.*from.*['\\\"].*services/api['\\\"]\" -and $content -notmatch \"import.*completeApi\") { " ^
"    $content = $content -replace \"import\s*\{\s*api\s*\}\s*from\s*['\\\"].*services/api['\\\"]\", \"import { api, completeApi } from '@/services'\"; " ^
"    $content = $content -replace \"import\s*\{\s*api\s*\}\s*from\s*['\\\"]@/services/api['\\\"]\", \"import { api, completeApi } from '@/services'\"; " ^
"    $updated = $true; " ^
"  } " ^
"  if ($updated) { " ^
"    Set-Content -Path $file.FullName -Value $content -NoNewline; " ^
"    Write-Host \"✓ Updated: $($file.Name)\" -ForegroundColor Green; " ^
"    $count++; " ^
"  } " ^
"} " ^
"Write-Host \"`n========================================\" -ForegroundColor Cyan; " ^
"Write-Host \"Total files updated: $count\" -ForegroundColor Yellow; " ^
"Write-Host \"========================================\" -ForegroundColor Cyan"

echo.
echo Done! All imports have been updated.
echo.
pause
