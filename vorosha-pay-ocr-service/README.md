# VoroshaPay OCR Service

Python FastAPI service for National ID (NID) card optical character recognition using Tesseract OCR and external OCR APIs.

## 🏗️ Technology Stack

- **Python**: 3.8+
- **FastAPI**: Modern, fast web framework
- **Tesseract OCR**: Open-source OCR engine
- **PIL/Pillow**: Python Imaging Library
- **Requests**: HTTP client for external APIs
- **Uvicorn**: ASGI server for FastAPI

## 🚀 Quick Setup

### Prerequisites
- **Python**: 3.8 or higher
- **Tesseract OCR**: 4.0 or higher
- **Git**

### Installation Steps

1. **Clone and navigate**:
```bash
git clone <repository-url>
cd vorosha/vorosha-pay-ocr-service
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Install Tesseract OCR**:

**Windows**:
```bash
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install and add to PATH
# Verify installation
tesseract --version
```

**macOS**:
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-ben  # Bengali language support
```

5. **Start the service**:
```bash
python app.py
```

6. **Access the service**:
   - API Documentation: http://localhost:8500/docs
   - Health Check: http://localhost:8500/health
   - Base URL: http://localhost:8500

## ⚙️ Configuration

### Environment Variables
Create `.env` file:
```env
UPLOAD_DIR=./uploads/nid_documents
OCR_SERVICE_PORT=8500
TESSERACT_PATH=/usr/bin/tesseract
LANGUAGE=ben+eng
```

### Application Configuration
Edit `app.py`:
```python
# OCR Service Configuration
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8500")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads/nid_documents")
TESSERACT_PATH = os.getenv("TESSERACT_PATH", "tesseract")
LANGUAGE = os.getenv("LANGUAGE", "ben+eng")  # Bengali + English
```

## 📁 Project Structure

```
vorosha-pay-ocr-service/
├── app.py                    # Main FastAPI application
├── requirements.txt          # Python dependencies
├── README.md                # This file
├── uploads/                 # File upload directory
│   └── nid_documents/       # NID document storage
└── .env                     # Environment variables (optional)
```

## 🔌 API Endpoints

### Health Check
```http
GET /health
```
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### NID OCR Processing
```http
POST /ocr/nid
Content-Type: multipart/form-data
```

**Parameters**:
- `front_image`: Front side of NID card (file)
- `back_image`: Back side of NID card (file)
- `user_id`: User ID for file organization (query parameter)

**Response**:
```json
{
  "success": true,
  "data": {
    "front": {
      "name": "জনাব আব্দুল করিম",
      "father_name": "মোঃ আব্দুল হামিদ",
      "mother_name": "মোসাঃ রোকসানা বেগম",
      "date_of_birth": "01/01/1985",
      "nid_number": "1234567890123"
    },
    "back": {
      "address": "গ্রাম: দক্ষিণ পাইকপাড়া, ডাকঘর: পাইকপাড়া",
      "issue_date": "01/01/2010"
    }
  },
  "confidence": 0.85,
  "processing_time": 2.5
}
```

### File Upload
```http
POST /upload
Content-Type: multipart/form-data
```

**Parameters**:
- `file`: Image file to upload
- `user_id`: User ID for organization

**Response**:
```json
{
  "success": true,
  "filename": "nid_1234567890_front.jpg",
  "path": "/uploads/nid_documents/nid_1234567890_front.jpg"
}
```

## 🛠️ Development

### Running in Development Mode
```bash
# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app:app --reload --host 0.0.0.0 --port 8500
```

### Running with Custom Configuration
```bash
# Set environment variables and run
export UPLOAD_DIR=./custom_uploads
export OCR_SERVICE_PORT=8501
python app.py
```

### Testing the Service
```bash
# Test health endpoint
curl http://localhost:8500/health

# Test OCR endpoint with sample images
curl -X POST "http://localhost:8500/ocr/nid?user_id=test123" \
  -H "Content-Type: multipart/form-data" \
  -F "front_image=@front_nid.jpg" \
  -F "back_image=@back_nid.jpg"
```

## 📊 OCR Processing

### Supported Languages
- **Bengali (ben)**: Primary language for Bangladesh NID cards
- **English (eng)**: Secondary language for mixed content
- **Combined**: `ben+eng` for optimal recognition

### Image Processing Pipeline
1. **Image Validation**: Check file format and size
2. **Preprocessing**: Enhance image quality
3. **OCR Processing**: Extract text using Tesseract
4. **Post-processing**: Clean and format extracted data
5. **Result Packaging**: Structure data for API response

### Data Extraction
The service extracts the following information from NID cards:

**Front Side**:
- Full name (Bengali)
- Father's name
- Mother's name
- Date of birth
- NID number

**Back Side**:
- Address information
- Issue date
- Additional details

## 🔧 Configuration Options

### Tesseract Configuration
```python
# Tesseract settings
tesseract_config = {
    'path': '/usr/bin/tesseract',
    'language': 'ben+eng',
    'config': '--psm 6 --oem 3',  # Page segmentation and OCR engine modes
    'timeout': 30  # Processing timeout in seconds
}
```

### Image Processing Settings
```python
# Image preprocessing settings
image_settings = {
    'max_file_size': 10 * 1024 * 1024,  # 10MB
    'allowed_formats': ['jpg', 'jpeg', 'png', 'bmp'],
    'dpi': 300,  # Recommended DPI for OCR
    'contrast_enhancement': True,
    'noise_reduction': True
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Tesseract not found**:
```bash
# Check Tesseract installation
tesseract --version

# Add to PATH if needed
export PATH=$PATH:/usr/bin/tesseract
```

2. **Bengali language support missing**:
```bash
# Install Bengali language pack
sudo apt-get install tesseract-ocr-ben

# Or download from: https://github.com/tesseract-ocr/tessdata
```

3. **Permission denied for uploads directory**:
```bash
# Create and set permissions
mkdir -p uploads/nid_documents
chmod 755 uploads/nid_documents
```

4. **Port 8500 already in use**:
```bash
# Find and kill process
lsof -i :8500
kill -9 <PID>

# Or use different port
export OCR_SERVICE_PORT=8501
```

5. **OCR accuracy issues**:
   - Ensure high-quality images (300 DPI minimum)
   - Check image orientation and lighting
   - Verify Bengali language pack installation
   - Test with different PSM modes

### Debug Mode
```bash
# Run with debug logging
export DEBUG=true
python app.py
```

### Logs
- **Application logs**: Console output
- **Error logs**: Detailed error information
- **Processing logs**: OCR processing details

## 🔒 Security Features

### File Upload Security
- File type validation
- File size limits
- Secure file storage
- Path traversal prevention

### Input Validation
- Image format validation
- User ID validation
- Parameter sanitization

### Error Handling
- Graceful error responses
- Detailed error logging
- Timeout handling

## 📈 Performance Optimization

### OCR Performance
- **Image Preprocessing**: Enhance image quality before OCR
- **Language Optimization**: Use appropriate language packs
- **PSM Modes**: Optimize page segmentation modes
- **Caching**: Cache processed results

### API Performance
- **Async Processing**: Non-blocking operations
- **File Streaming**: Efficient file handling
- **Memory Management**: Optimize memory usage
- **Response Compression**: Compress large responses

## 🚀 Deployment

### Production Deployment
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8500
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ben \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8500

CMD ["python", "app.py"]
```

### Environment Configuration
```bash
# Production environment variables
export UPLOAD_DIR=/app/uploads
export OCR_SERVICE_PORT=8500
export TESSERACT_PATH=/usr/bin/tesseract
export LANGUAGE=ben+eng
export DEBUG=false
```

## 🔄 Integration

### Backend Integration
The OCR service integrates with the VoroshaPay Java backend:

```java
// Java backend calls OCR service
String ocrUrl = "http://localhost:8500/ocr/nid?user_id=" + userId;
ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
    ocrUrl, 
    requestEntity, 
    Map.class
);
```

### Frontend Integration
The frontend uploads images to the OCR service:

```typescript
// Frontend upload to OCR service
const formData = new FormData();
formData.append('front_image', frontImageFile);
formData.append('back_image', backImageFile);

const response = await fetch(`http://localhost:8500/ocr/nid?user_id=${userId}`, {
  method: 'POST',
  body: formData
});
```

## 📊 Monitoring

### Health Monitoring
```bash
# Check service health
curl http://localhost:8500/health

# Monitor processing time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8500/health
```

### Performance Metrics
- Processing time per image
- Success rate of OCR extraction
- File upload/download times
- Error rates and types

## 📝 License

This project is licensed under the MIT License.

---

**VoroshaPay OCR Service** - Accurate, Fast, and Reliable Document Processing 🚀
