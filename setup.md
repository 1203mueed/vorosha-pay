# VoroshaPay Setup Guide

Complete setup guide for the VoroshaPay digital escrow platform.

## 🎯 Overview

This guide will help you set up the complete VoroshaPay application stack:
- **Backend**: Java Spring Boot API server
- **Frontend**: Next.js React application  
- **OCR Service**: Python FastAPI service for document processing

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space
- **Internet**: Required for downloading dependencies

### Software Requirements
- **Java**: 17 or higher
- **Node.js**: 18.18.0 or higher
- **Python**: 3.8 or higher
- **Maven**: 3.6 or higher
- **Git**: Latest version
- **Tesseract OCR**: 4.0 or higher (for OCR service)

## 🚀 Quick Start (5 Minutes)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vorosha
```

### 2. Backend Setup
```bash
cd vorosha-pay-java-backend
mvn clean install
mvn spring-boot:run
```
✅ Backend running at: http://localhost:8000

### 3. Frontend Setup
```bash
cd ../vorosha-pay-frontend
npm install
npm run dev
```
✅ Frontend running at: http://localhost:3000

### 4. OCR Service Setup (Optional)
```bash
cd ../vorosha-pay-ocr-service
pip install -r requirements.txt
python app.py
```
✅ OCR Service running at: http://localhost:8500

## 🔧 Detailed Setup

### Step 1: Environment Setup

#### Install Java 17+
**Windows**:
1. Download from [Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
2. Install and add to PATH
3. Verify: `java -version`

**macOS**:
```bash
brew install openjdk@17
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

#### Install Node.js 18.18.0+
**All Platforms**:
1. Download from [Node.js](https://nodejs.org/)
2. Install LTS version (18.18.0 or higher)
3. Verify: `node --version` and `npm --version`

#### Install Python 3.8+
**Windows**:
1. Download from [Python.org](https://www.python.org/downloads/)
2. Install with "Add to PATH" option
3. Verify: `python --version`

**macOS**:
```bash
brew install python@3.9
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

#### Install Maven 3.6+
**Windows**:
1. Download from [Maven](https://maven.apache.org/download.cgi)
2. Extract and add to PATH
3. Verify: `mvn --version`

**macOS**:
```bash
brew install maven
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install maven
```

#### Install Tesseract OCR (for OCR service)
**Windows**:
1. Download from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install and add to PATH
3. Download Bengali language pack from [tessdata](https://github.com/tesseract-ocr/tessdata)

**macOS**:
```bash
brew install tesseract
brew install tesseract-lang  # For Bengali support
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-ben
```

### Step 2: Project Setup

#### Clone Repository
```bash
git clone <repository-url>
cd vorosha
```

#### Verify Project Structure
```
vorosha/
├── vorosha-pay-frontend/     # Next.js Frontend
├── vorosha-pay-java-backend/ # Spring Boot Backend
├── vorosha-pay-ocr-service/  # Python OCR Service
├── README.md                 # Main documentation
└── setup.md                  # This file
```

### Step 3: Backend Configuration

#### Navigate to Backend
```bash
cd vorosha-pay-java-backend
```

#### Configure Application Properties
Edit `src/main/resources/application.properties`:
```properties
# Server Configuration
server.port=8000
server.servlet.context-path=/

# Excel Database
excel.database.path=./data/database.xlsx

# JWT Configuration
jwt.secret=your-jwt-secret-key-here
jwt.expiration=86400000

# bKash Configuration (Optional)
bkash.app.key=bka_MDS_sandbox_app_key
bkash.app.secret=bka_MDS_sandbox_app_secret
bkash.base.url=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# OCR Service Configuration
ocr.service.url=http://localhost:8500
```

#### Build and Run Backend
```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

#### Verify Backend
- Open browser: http://localhost:8000/api/health
- Expected response: `{"status":"healthy","timestamp":"..."}`

### Step 4: Frontend Configuration

#### Navigate to Frontend
```bash
cd ../vorosha-pay-frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure API Endpoint
Edit `lib/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

#### Start Frontend
```bash
npm run dev
```

#### Verify Frontend
- Open browser: http://localhost:3000
- Should see VoroshaPay login page

### Step 5: OCR Service Configuration (Optional)

#### Navigate to OCR Service
```bash
cd ../vorosha-pay-ocr-service
```

#### Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment
Create `.env` file:
```env
UPLOAD_DIR=./uploads/nid_documents
OCR_SERVICE_PORT=8500
TESSERACT_PATH=tesseract
LANGUAGE=ben+eng
```

#### Start OCR Service
```bash
python app.py
```

#### Verify OCR Service
- Open browser: http://localhost:8500/docs
- Should see FastAPI documentation

## 🧪 Testing the Setup

### 1. Test Backend API
```bash
curl http://localhost:8000/api/health
```

### 2. Test Frontend
1. Open http://localhost:3000
2. Try demo login:
   - Email: `customer@demo.com`
   - Password: `demo123`

### 3. Test OCR Service
```bash
curl http://localhost:8500/health
```

### 4. Test Complete Flow
1. Login to frontend
2. Create a transaction
3. Upload NID documents (if OCR service is running)
4. Test chat functionality
5. Test notification system

## 🎯 Demo Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Customer | `customer@demo.com` | `demo123` | Buyer account |
| Merchant | `merchant@demo.com` | `demo123` | Seller account |
| Admin | `admin@demo.com` | `demo123` | Administrator account |

## 🔧 Development Workflow

### Running All Services
```bash
# Terminal 1: Backend
cd vorosha-pay-java-backend
mvn spring-boot:run

# Terminal 2: Frontend
cd vorosha-pay-frontend
npm run dev

# Terminal 3: OCR Service (Optional)
cd vorosha-pay-ocr-service
python app.py
```

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Backend Health**: http://localhost:8000/api/health
- **OCR Service**: http://localhost:8500
- **OCR Docs**: http://localhost:8500/docs

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # macOS/Linux

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

#### 2. Java Version Issues
```bash
# Check Java version
java -version

# Set JAVA_HOME if needed
export JAVA_HOME=/path/to/java17
```

#### 3. Node.js Version Issues
```bash
# Check Node.js version
node --version

# Use nvm to manage versions
nvm install 18.18.0
nvm use 18.18.0
```

#### 4. Maven Build Failures
```bash
# Clean and rebuild
mvn clean install -U

# Check Maven version
mvn --version
```

#### 5. Excel File Locked
```bash
# Close Excel application
# Or delete lock file
rm "~$database.xlsx"
```

#### 6. OCR Service Issues
```bash
# Check Tesseract installation
tesseract --version

# Install Bengali language pack
sudo apt-get install tesseract-ocr-ben  # Linux
brew install tesseract-lang             # macOS
```

### Logs and Debugging

#### Backend Logs
- Check console output for Spring Boot logs
- Log file: `vorosha-pay-java-backend/server.log`

#### Frontend Logs
- Check browser console for errors
- Check terminal output for build errors

#### OCR Service Logs
- Check console output for FastAPI logs
- Check error messages for OCR processing issues

## 📊 Performance Optimization

### Backend Optimization
- Increase JVM heap size: `-Xmx2g`
- Use production profile: `--spring.profiles.active=prod`
- Enable compression: `server.compression.enabled=true`

### Frontend Optimization
- Use production build: `npm run build`
- Enable compression in Next.js config
- Optimize images and assets

### OCR Service Optimization
- Use high-quality images (300+ DPI)
- Optimize Tesseract configuration
- Use appropriate PSM modes

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build JAR file
mvn clean package -DskipTests

# Run with production settings
java -jar target/vorosha-pay-*.jar --spring.profiles.active=prod
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### OCR Service Deployment
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8500
```

## 📞 Support

### Getting Help
1. Check this setup guide first
2. Review individual README files in each service directory
3. Check the main project README
4. Contact the development team

### Useful Commands
```bash
# Check all services status
curl http://localhost:8000/api/health
curl http://localhost:8500/health

# View logs
tail -f vorosha-pay-java-backend/server.log

# Reset database
rm vorosha-pay-java-backend/data/database.xlsx
mvn spring-boot:run
```

---

**VoroshaPay Setup Complete** - Ready to build the future of digital payments! 🚀
