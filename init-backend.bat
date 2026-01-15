@echo off
REM Batch script to initialize the backend server
REM Run this from the project root

echo Installing backend dependencies...
cd server
call npm install

if %ERRORLEVEL% EQU 0 (
    echo Initializing database...
    call npm run init-db
    
    if %ERRORLEVEL% EQU 0 (
        echo Backend initialization complete!
    ) else (
        echo Database initialization failed!
        cd ..
        exit /b 1
    )
) else (
    echo npm install failed!
    cd ..
    exit /b 1
)

cd ..
