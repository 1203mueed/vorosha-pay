# VoroshaPay Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the VoroshaPay application.

## 🚨 Quick Fixes

### Service Not Starting
```bash
# Check if ports are available
netstat -an | grep :8000  # Backend
netstat -an | grep :3000  # Frontend
netstat -an | grep :8500  # OCR Service

# Kill processes using ports
lsof -ti:8000 | xargs kill -9  # macOS/Linux
taskkill /PID $(netstat -ano | findstr :8000 | awk '{print $5}') /F  # Windows
```

### Database Issues
```bash
# Reset database
rm vorosha-pay-java-backend/data/database.xlsx
cd vorosha-pay-java-backend
mvn spring-boot:run
```

## 🔧 Common Issues & Solutions

### 1. Java Issues

#### Java Version Problems
**Error**: `java: command not found` or `UnsupportedClassVersionError`

**Solution**:
```bash
# Check Java version
java -version

# Install Java 17+ (Ubuntu/Debian)
sudo apt update
sudo apt install openjdk-17-jdk

# Install Java 17+ (macOS)
brew install openjdk@17

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

#### Maven Issues
**Error**: `mvn: command not found` or build failures

**Solution**:
```bash
# Install Maven
sudo apt install maven  # Ubuntu/Debian
brew install maven      # macOS

# Verify installation
mvn --version

# Clean and rebuild
mvn clean install -U
```

### 2. Node.js Issues

#### Node.js Version Problems
**Error**: `Node.js version mismatch` or `npm: command not found`

**Solution**:
```bash
# Check Node.js version
node --version

# Install Node.js 18.18.0+ (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18.18.0
nvm use 18.18.0

# Or download from nodejs.org
```

#### npm Install Failures
**Error**: `npm ERR!` or dependency installation fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific registry if needed
npm install --registry https://registry.npmjs.org/
```

### 3. Backend Issues

#### Spring Boot Won't Start
**Error**: `Port 8000 already in use` or `Application failed to start`

**Solution**:
```bash
# Check what's using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
export SERVER_PORT=8001
mvn spring-boot:run
```

#### Database Lock Issues
**Error**: `Cannot open Excel file` or `File locked`

**Solution**:
```bash
# Close Excel application
# Or delete lock file
rm "vorosha-pay-java-backend/data/~$database.xlsx"

# Restart backend
cd vorosha-pay-java-backend
mvn spring-boot:run
```

#### JWT/Authentication Issues
**Error**: `JWT token invalid` or `Authentication failed`

**Solution**:
```bash
# Clear browser storage
# Or restart backend to reset JWT secret
cd vorosha-pay-java-backend
mvn spring-boot:run
```

### 4. Frontend Issues

#### Next.js Build Failures
**Error**: `Build failed` or `Module not found`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### Hydration Errors
**Error**: `Hydration mismatch` or `Server/client mismatch`

**Solution**:
```bash
# Check for browser extensions (Grammarly, etc.)
# Disable extensions temporarily

# Clear browser cache
# Or use incognito mode

# Check for server/client differences in code
```

#### API Connection Issues
**Error**: `Failed to fetch` or `CORS error`

**Solution**:
```bash
# Ensure backend is running
curl http://localhost:8000/api/health

# Check CORS configuration in backend
# Verify API_BASE_URL in frontend
```

### 5. OCR Service Issues

#### Python/Tesseract Issues
**Error**: `python: command not found` or `tesseract: command not found`

**Solution**:
```bash
# Install Python 3.8+
sudo apt install python3 python3-pip python3-venv  # Ubuntu/Debian
brew install python@3.9  # macOS

# Install Tesseract
sudo apt install tesseract-ocr tesseract-ocr-ben  # Ubuntu/Debian
brew install tesseract tesseract-lang  # macOS

# Verify installation
python3 --version
tesseract --version
```

#### OCR Processing Failures
**Error**: `OCR processing failed` or `No text detected`

**Solution**:
```bash
# Check image quality (300+ DPI recommended)
# Ensure Bengali language pack is installed
sudo apt install tesseract-ocr-ben  # Ubuntu/Debian

# Test with simple image first
# Check image format (JPG, PNG supported)
```

#### FastAPI Issues
**Error**: `Port 8500 already in use` or `Module not found`

**Solution**:
```bash
# Check port usage
lsof -i :8500

# Install dependencies
pip install -r requirements.txt

# Use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 6. Database Issues

#### Excel Database Corruption
**Error**: `Database corrupted` or `Invalid Excel file`

**Solution**:
```bash
# Backup current database
cp vorosha-pay-java-backend/data/database.xlsx backup.xlsx

# Delete and recreate
rm vorosha-pay-java-backend/data/database.xlsx
cd vorosha-pay-java-backend
mvn spring-boot:run
```

#### Data Not Persisting
**Error**: `Data not saved` or `Changes lost`

**Solution**:
```bash
# Check file permissions
ls -la vorosha-pay-java-backend/data/

# Ensure write permissions
chmod 755 vorosha-pay-java-backend/data/

# Check disk space
df -h
```

### 7. Network Issues

#### CORS Errors
**Error**: `CORS policy` or `Access blocked`

**Solution**:
```bash
# Check backend CORS configuration
# Verify frontend URL in CORS settings
# Use same origin for development
```

#### API Timeout
**Error**: `Request timeout` or `Connection timeout`

**Solution**:
```bash
# Check network connectivity
ping localhost

# Increase timeout values
# Check firewall settings
# Verify service is running
```

## 🔍 Debugging Steps

### 1. Check Service Status
```bash
# Backend health
curl http://localhost:8000/api/health

# OCR service health
curl http://localhost:8500/health

# Frontend (check browser console)
```

### 2. Check Logs
```bash
# Backend logs
tail -f vorosha-pay-java-backend/server.log

# Frontend logs (browser console)
# OCR service logs (terminal output)
```

### 3. Verify Dependencies
```bash
# Java
java -version

# Node.js
node --version
npm --version

# Python
python3 --version

# Maven
mvn --version

# Tesseract
tesseract --version
```

### 4. Check File Permissions
```bash
# Check project directory permissions
ls -la

# Check database file permissions
ls -la vorosha-pay-java-backend/data/

# Fix permissions if needed
chmod -R 755 .
```

## 🛠️ Advanced Troubleshooting

### Performance Issues

#### Slow Response Times
```bash
# Check system resources
top
htop

# Monitor database file size
ls -lh vorosha-pay-java-backend/data/database.xlsx

# Check for memory leaks
jstat -gc <java_pid>
```

#### High CPU Usage
```bash
# Identify high CPU processes
top -o %CPU

# Check for infinite loops in logs
grep -i "loop\|recursion" vorosha-pay-java-backend/server.log
```

### Memory Issues

#### Out of Memory Errors
```bash
# Increase JVM heap size
export MAVEN_OPTS="-Xmx2g -Xms1g"
mvn spring-boot:run

# Or run with specific memory settings
java -Xmx2g -Xms1g -jar target/vorosha-pay-*.jar
```

#### Memory Leaks
```bash
# Monitor memory usage
jstat -gc <java_pid> 1s

# Check for file handle leaks
lsof -p <java_pid>
```

### Database Performance

#### Slow Database Operations
```bash
# Check database file size
ls -lh vorosha-pay-java-backend/data/database.xlsx

# Monitor file access
strace -e trace=file -p <java_pid>

# Check for file locks
lsof vorosha-pay-java-backend/data/database.xlsx
```

## 📞 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Verify all prerequisites are installed**
3. **Check service logs for error messages**
4. **Try the quick fixes above**
5. **Document the exact error message**

### Information to Provide

When asking for help, include:
- Operating system and version
- Java, Node.js, Python versions
- Exact error message
- Steps to reproduce the issue
- Log files (if applicable)

### Useful Commands for Support

```bash
# System information
uname -a
java -version
node --version
python3 --version
mvn --version

# Service status
curl http://localhost:8000/api/health
curl http://localhost:8500/health

# Process information
ps aux | grep java
ps aux | grep node
ps aux | grep python

# Network information
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000
netstat -tulpn | grep :8500
```

## 🔄 Reset Everything

If nothing else works, try a complete reset:

```bash
# Stop all services
pkill -f java
pkill -f node
pkill -f python

# Clean all build artifacts
cd vorosha-pay-java-backend
mvn clean
cd ../vorosha-pay-frontend
rm -rf node_modules .next
cd ../vorosha-pay-ocr-service
rm -rf venv __pycache__

# Reset database
rm vorosha-pay-java-backend/data/database.xlsx

# Reinstall everything
cd vorosha-pay-java-backend
mvn clean install
cd ../vorosha-pay-frontend
npm install
cd ../vorosha-pay-ocr-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start services
cd ../vorosha-pay-java-backend
mvn spring-boot:run &
cd ../vorosha-pay-frontend
npm run dev &
cd ../vorosha-pay-ocr-service
source venv/bin/activate
python app.py &
```

---

**VoroshaPay Troubleshooting** - Getting you back on track! 🚀
