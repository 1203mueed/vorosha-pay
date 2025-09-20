#!/bin/bash

echo "========================================"
echo "    VoroshaPay Service Starter"
echo "========================================"
echo

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is not installed or not in PATH"
    echo "Please install Java 17+ and add it to PATH"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js 18.18.0+ and add it to PATH"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven is not installed or not in PATH"
    echo "Please install Maven 3.6+ and add it to PATH"
    exit 1
fi

echo "Starting VoroshaPay services..."
echo

# Start Backend
echo "[1/3] Starting Backend Service..."
cd vorosha-pay-java-backend
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 10

# Start Frontend
echo "[2/3] Starting Frontend Service..."
cd vorosha-pay-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Check if Python is available for OCR service
if command -v python3 &> /dev/null || command -v python &> /dev/null; then
    echo "[3/3] Starting OCR Service..."
    cd vorosha-pay-ocr-service
    
    # Use python3 if available, otherwise python
    if command -v python3 &> /dev/null; then
        python3 app.py &
    else
        python app.py &
    fi
    
    OCR_PID=$!
    cd ..
else
    echo "[3/3] Skipping OCR Service (Python not found)"
    OCR_PID=""
fi

echo
echo "========================================"
echo "    Services Starting..."
echo "========================================"
echo
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "OCR API:  http://localhost:8500"
echo
echo "Demo Login:"
echo "Customer: customer@demo.com / demo123"
echo "Merchant: merchant@demo.com / demo123"
echo "Admin:    admin@demo.com / demo123"
echo

# Function to cleanup processes on exit
cleanup() {
    echo
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    if [ ! -z "$OCR_PID" ]; then
        kill $OCR_PID 2>/dev/null
    fi
    echo "Services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "Press Ctrl+C to stop all services..."
echo

# Wait for user to stop services
wait
