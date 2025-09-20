@echo off
echo ========================================
echo    VoroshaPay Service Starter
echo ========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17+ and add it to PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18.18.0+ and add it to PATH
    pause
    exit /b 1
)

REM Check if Maven is installed
mvn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven 3.6+ and add it to PATH
    pause
    exit /b 1
)

echo Starting VoroshaPay services...
echo.

REM Start Backend
echo [1/3] Starting Backend Service...
start "VoroshaPay Backend" cmd /k "cd vorosha-pay-java-backend && mvn spring-boot:run"

REM Wait a moment for backend to start
timeout /t 10 /nobreak >nul

REM Start Frontend
echo [2/3] Starting Frontend Service...
start "VoroshaPay Frontend" cmd /k "cd vorosha-pay-frontend && npm run dev"

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

REM Check if Python is available for OCR service
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [3/3] Starting OCR Service...
    start "VoroshaPay OCR" cmd /k "cd vorosha-pay-ocr-service && python app.py"
) else (
    echo [3/3] Skipping OCR Service (Python not found)
)

echo.
echo ========================================
echo    Services Starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo OCR API:  http://localhost:8500
echo.
echo Demo Login:
echo Customer: customer@demo.com / demo123
echo Merchant: merchant@demo.com / demo123
echo Admin:    admin@demo.com / demo123
echo.
echo Press any key to close this window...
pause >nul
