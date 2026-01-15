# PowerShell script to initialize the backend server
# Run this from the project root: .\server\init.ps1

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location server
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Initializing database..." -ForegroundColor Cyan
    npm run init-db
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend initialization complete!" -ForegroundColor Green
    } else {
        Write-Host "Database initialization failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "npm install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
