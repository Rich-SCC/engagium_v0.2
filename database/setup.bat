@echo off
REM Engagium Database Setup and Seed Script for Windows
REM This script sets up the database schema and seeds it with test data

echo.
echo ================================================
echo    Engagium Database Setup and Seed
echo ================================================
echo.

REM Check if we're in the database directory
if not exist "seed-data.sql" (
    echo [ERROR] Please run this script from the database directory
    exit /b 1
)

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL first
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js first
    exit /b 1
)

REM Check if backend .env exists
if not exist "..\backend\.env" (
    echo [WARNING] backend\.env not found
    if exist "..\backend\.env.example" (
        echo Creating from .env.example...
        copy "..\backend\.env.example" "..\backend\.env" >nul
        echo [OK] Created backend\.env
        echo [WARNING] Please update DATABASE_URL in backend\.env if needed
    ) else (
        echo [ERROR] backend\.env.example not found
        exit /b 1
    )
)

echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo.
echo [2/4] Setting up database schema...
REM Note: On Windows, you may need to enter the PostgreSQL password
REM The script will use the DATABASE_URL from backend/.env

REM Load DATABASE_URL from .env file
for /f "tokens=2 delims==" %%a in ('findstr /i "^DATABASE_URL=" ..\backend\.env') do set DATABASE_URL=%%a

if "%DATABASE_URL%"=="" (
    echo [ERROR] DATABASE_URL not found in backend\.env
    exit /b 1
)

echo Database connection string loaded
echo.

REM Apply schema
echo Applying schema.sql...
psql "%DATABASE_URL%" -f schema.sql >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Schema applied successfully
) else (
    echo [INFO] Schema may already exist ^(this is okay^)
)

echo.
echo [3/4] Seeding database with test data...
call npm run seed
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to seed database
    exit /b 1
)

echo.
echo [4/4] Verifying seed data...
call npm run verify

echo.
echo ================================================
echo          Setup Complete!
echo ================================================
echo.
echo Next steps:
echo   1. cd ..\backend ^&^& npm run dev
echo   2. cd ..\frontend ^&^& npm run dev
echo   3. Login with: john.doe@university.edu / Password123!
echo.

pause
