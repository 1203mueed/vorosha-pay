# VoroshaPay Java Backend

Java Spring Boot backend implementation of VoroshaPay digital escrow platform with Excel-based database.

## 🏗️ Technology Stack

- **Java**: 17+
- **Spring Boot**: 3.2.0
- **Spring Security**: JWT-based authentication
- **Spring Data**: Custom Excel database implementation
- **Apache POI**: Excel file manipulation
- **Jackson**: JSON processing
- **Maven**: Build automation
- **H2 Database**: Development database (optional)

## 🚀 Quick Setup

### Prerequisites
- Java 17 or higher
- Maven 3.6 or higher
- Git

### Installation Steps

1. **Clone and navigate**:
```bash
git clone <repository-url>
cd vorosha/vorosha-pay-java-backend
```

2. **Build the project**:
```bash
mvn clean install
```

3. **Run the application**:
```bash
mvn spring-boot:run
```

4. **Access the API**:
   - Base URL: http://localhost:8000
   - API Endpoints: http://localhost:8000/api
   - Health Check: http://localhost:8000/api/health

## 📊 Database Configuration

### Excel Database
The application uses a custom Excel-based database located at:
```
vorosha-pay-java-backend/data/database.xlsx
```

### Database Sheets
- **users**: User accounts and profiles
- **transactions**: Transaction records with status tracking
- **payments**: Payment information and history
- **disputes**: Dispute records and resolution
- **chat_messages**: Transaction-specific chat history
- **notifications**: User notification system

### Database Initialization
The Excel database is automatically created on first run with demo data:
- 3 demo users (customer, merchant, admin)
- Sample transaction data
- Initial notification records

## ⚙️ Configuration

### Application Properties
Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8000
server.servlet.context-path=/

# Excel Database Path
excel.database.path=./data/database.xlsx

# JWT Configuration
jwt.secret=your-jwt-secret-key-here
jwt.expiration=86400000

# bKash Payment Gateway
bkash.app.key=bka_MDS_sandbox_app_key
bkash.app.secret=bka_MDS_sandbox_app_secret
bkash.base.url=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# OCR Service Integration
ocr.service.url=http://localhost:8500

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### Environment Variables
You can override properties using environment variables:
```bash
export SERVER_PORT=8000
export JWT_SECRET=your-secret-key
export EXCEL_DATABASE_PATH=./data/database.xlsx
```

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/demo-login
GET  /api/auth/profile
PUT  /api/auth/password
```

### Transaction Management
```http
GET  /api/transactions
POST /api/transactions
PUT  /api/transactions/{id}/accept
PUT  /api/transactions/{id}/fund
PUT  /api/transactions/{id}/deliver
PUT  /api/transactions/{id}/complete
PUT  /api/transactions/{id}/cancel
```

### Chat & Communication
```http
GET  /api/chat/transactions/{id}/messages
POST /api/chat/transactions/{id}/messages
PUT  /api/chat/transactions/{id}/read
```

### Notifications
```http
GET /api/notifications
PUT /api/notifications/{id}/read
POST /api/notifications/test
```

### Payment Processing
```http
POST /api/payments/initiate
POST /api/payments/process/{paymentId}
GET  /api/payments/status/{paymentId}
```

### Dispute Resolution
```http
GET  /api/disputes
POST /api/disputes
PUT  /api/disputes/{id}/resolve
GET  /api/disputes/{id}/evidence
```

### bKash Integration
```http
POST /api/bkash/grant-token
POST /api/bkash/create-payment
POST /api/bkash/execute-payment
GET  /api/bkash/query-payment
```

### File Management
```http
POST /api/delivery/transactions/{id}/deliver
GET  /api/delivery/transactions/{id}/delivery
POST /api/ocr/verify-nid
```

## 👥 Demo Users

The system comes with pre-configured demo users:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Customer | `customer@demo.com` | `demo123` | Buyer account |
| Merchant | `merchant@demo.com` | `demo123` | Seller account |
| Admin | `admin@demo.com` | `demo123` | Administrator account |

## 🔧 Development

### Running in Development Mode
```bash
mvn spring-boot:run
```

### Running with Custom Profile
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Building JAR File
```bash
mvn clean package -DskipTests
java -jar target/vorosha-pay-*.jar
```

### Running Tests
```bash
mvn test
```

### Code Quality Checks
```bash
mvn compile
mvn checkstyle:check
```

## 📁 Project Structure

```
src/main/java/com/voroshapay/
├── VoroshaPayApplication.java    # Main application class
├── config/
│   ├── ExcelConfig.java          # Excel database configuration
│   └── SecurityConfig.java       # Security and CORS configuration
├── controller/
│   ├── AuthController.java       # Authentication endpoints
│   ├── TransactionController.java # Transaction management
│   ├── ChatController.java       # Chat functionality
│   ├── NotificationController.java # Notification system
│   ├── PaymentController.java    # Payment processing
│   ├── DisputeController.java    # Dispute resolution
│   ├── DeliveryController.java   # Delivery management
│   ├── BkashController.java      # bKash integration
│   └── UserController.java       # User management
├── dto/
│   ├── ApiResponse.java          # Standard API response wrapper
│   ├── LoginRequest.java         # Login request DTO
│   ├── RegisterRequest.java      # Registration request DTO
│   └── UserResponse.java         # User response DTO
├── entity/
│   ├── User.java                 # User entity
│   ├── Transaction.java          # Transaction entity
│   ├── Dispute.java              # Dispute entity
│   ├── Payment.java              # Payment entity
│   ├── TransactionStatus.java    # Transaction status enum
│   ├── PaymentStatus.java        # Payment status enum
│   ├── DisputeStatus.java        # Dispute status enum
│   └── UserRole.java             # User role enum
├── excel/
│   └── ExcelDatabase.java        # Custom Excel database implementation
├── repository/
│   ├── UserRepository.java       # User data access
│   ├── TransactionRepository.java # Transaction data access
│   ├── PaymentRepository.java    # Payment data access
│   └── DisputeRepository.java    # Dispute data access
├── service/
│   ├── UserService.java          # User business logic
│   ├── TransactionService.java   # Transaction business logic
│   ├── ChatService.java          # Chat business logic
│   ├── NotificationService.java  # Notification business logic
│   ├── BkashService.java         # bKash integration logic
│   └── OcrService.java           # OCR service integration
└── util/
    └── JwtUtil.java              # JWT token utilities
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (BUYER, SELLER, ADMIN)
- Password encryption using BCrypt
- Secure session management

### CORS Configuration
```java
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
```

### Input Validation
- Request body validation
- File upload security
- SQL injection prevention
- XSS protection

## 📊 Excel Database Features

### Performance Optimizations
- **Caching**: 30-second cache for read operations
- **File Locking**: Retry mechanism for locked files
- **Concurrent Access**: Read-write lock implementation
- **Memory Efficiency**: Stream-based processing

### Data Persistence
- Automatic backup creation
- Transaction rollback support
- Data integrity validation
- Error recovery mechanisms

## 🐛 Troubleshooting

### Common Issues

1. **Port 8000 already in use**:
```bash
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

2. **Excel file locked**:
```bash
# Close Excel application
# Or delete lock file: ~$database.xlsx
```

3. **Java version issues**:
```bash
# Check Java version
java -version
# Should be 17 or higher
```

4. **Maven build failures**:
```bash
# Clean and rebuild
mvn clean install -U
```

5. **Database initialization errors**:
```bash
# Delete existing database and restart
rm data/database.xlsx
mvn spring-boot:run
```

### Logs and Debugging
- **Application logs**: Console output
- **Error logs**: Check console for stack traces
- **Database logs**: Excel file operations logged to console

### Health Check
```bash
curl http://localhost:8000/api/health
```

## 🔄 Integration with Other Services

### Frontend Integration
- CORS enabled for `http://localhost:3000`
- RESTful API endpoints
- JSON response format
- Error handling with standard HTTP codes

### OCR Service Integration
- FastAPI service at `http://localhost:8500`
- NID document processing
- File upload handling
- Result parsing and storage

## 📈 Performance Considerations

### Database Performance
- Excel caching reduces file I/O
- Batch operations for multiple updates
- Optimized queries with direct row access
- Memory-efficient data processing

### API Performance
- Asynchronous processing where possible
- Efficient JSON serialization
- Connection pooling for external services
- Response compression

## 🚀 Deployment

### Production Deployment
1. **Build JAR**:
```bash
mvn clean package -DskipTests
```

2. **Run with production profile**:
```bash
java -jar target/vorosha-pay-*.jar --spring.profiles.active=prod
```

3. **Environment variables**:
```bash
export JWT_SECRET=your-production-secret
export EXCEL_DATABASE_PATH=/path/to/production/database.xlsx
export SERVER_PORT=8000
```

### Docker Deployment (Optional)
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/vorosha-pay-*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 📝 License

This project is licensed under the MIT License.

---

**VoroshaPay Backend** - Secure, Scalable, and Reliable 🚀