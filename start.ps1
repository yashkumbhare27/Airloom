# start.ps1 – One-click start for Airloom (frontend + proxy)
# Run from the airloom/ folder: .\start.ps1

Write-Host "🌿 Starting Airloom..." -ForegroundColor Green

# Start proxy
$proxy = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$PSScriptRoot\proxy'; Write-Host 'Proxy starting on :3001' -ForegroundColor Cyan; npm start" `
  -WindowStyle Normal -PassThru

Start-Sleep -Seconds 2

# Start frontend
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$PSScriptRoot'; Write-Host 'Frontend starting on :5173' -ForegroundColor Cyan; npm run dev" `
  -WindowStyle Normal -PassThru

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "✅ Airloom is running:" -ForegroundColor Green
Write-Host "   App:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Proxy: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop, or close the terminal windows." -ForegroundColor Gray

Start-Process "http://localhost:5173"
