# VoroshaPay - Digital Escrow Platform

**VoroshaPay** is a comprehensive digital escrow platform designed for Bangladesh's financial ecosystem, providing secure transaction management with AI-powered protection and multi-language support.

## 🌟 Features

### Core Functionality
- **Secure Escrow System**: Complete transaction lifecycle management
- **Multi-Role Support**: Buyer, Seller, and Admin roles with distinct permissions
- **Real-time Chat**: Transaction-specific messaging system
- **Payment Integration**: bKash, Nagad, SSLCommerz support
- **Dispute Resolution**: Comprehensive dispute management system
- **NID Verification**: AI-powered National ID card verification
- **Delivery Tracking**: Photo upload and delivery confirmation
- **Notification System**: Real-time notifications for all activities

### Technical Features
- **Responsive Design**: Modern UI with Bengali and English support
- **Excel Database**: Custom database implementation for data persistence
- **OCR Service**: Python-based OCR for document processing
- **File Upload**: Secure file handling for documents and delivery photos
- **JWT Authentication**: Secure token-based authentication
- **CORS Support**: Cross-origin resource sharing configuration

## 🏗️ Architecture

```
vorosha/
├── vorosha-pay-frontend/     # Next.js React Frontend
├── vorosha-pay-java-backend/ # Spring Boot Backend
└── vorosha-pay-ocr-service/  # Python FastAPI OCR Service
```

## 🚀 Quick Start

### Prerequisites
- **Java**: 17 or higher
- **Node.js**: 18.18.0 or higher
- **Python**: 3.8 or higher
- **Maven**: 3.6 or higher
- **npm**: 8.0 or higher

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vorosha
```

### 2. Backend Setup (Java Spring Boot)
```bash
cd vorosha-pay-java-backend
mvn clean install
mvn spring-boot:run
```
Backend will be available at: http://localhost:8000

### 3. Frontend Setup (Next.js)
```bash
cd vorosha-pay-frontend
npm install
npm run dev
```
Frontend will be available at: http://localhost:3000

### 4. OCR Service Setup (Python FastAPI)
```bash
cd vorosha-pay-ocr-service
pip install -r requirements.txt
python app.py
```
OCR Service will be available at: http://localhost:8500

## 📋 Default Demo Accounts

### Users
- **Buyer**: `customer@demo.com` / `demo123`
- **Seller**: `merchant@demo.com` / `demo123`
- **Admin**: `admin@demo.com` / `demo123`

### Database
- **Location**: `vorosha-pay-java-backend/data/database.xlsx`
- **Type**: Excel-based custom database
- **Sheets**: users, transactions, payments, disputes, chat_messages, notifications

## 🔧 Configuration

### Backend Configuration
Edit `vorosha-pay-java-backend/src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8000
server.servlet.context-path=/

# Excel Database
excel.database.path=./data/database.xlsx

# JWT Configuration
jwt.secret=your-secret-key
jwt.expiration=86400000

# bKash Configuration
bkash.app.key=bka_MDS_sandbox_app_key
bkash.app.secret=bka_MDS_sandbox_app_secret
bkash.base.url=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# OCR Service
ocr.service.url=http://localhost:8500
```

### Frontend Configuration
Edit `vorosha-pay-frontend/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

### OCR Service Configuration
Set environment variables:

```bash
export UPLOAD_DIR="./uploads/nid_documents"
export OCR_SERVICE_PORT=8500
```

## 📁 Project Structure

### Backend Structure
```
src/main/java/com/voroshapay/
├── config/           # Configuration classes
├── controller/       # REST API controllers
├── dto/             # Data Transfer Objects
├── entity/          # Entity classes
├── excel/           # Excel database implementation
├── repository/      # Data access layer
├── service/         # Business logic services
└── util/            # Utility classes
```

### Frontend Structure
```
app/
├── admin/           # Admin dashboard
├── auth/            # Authentication pages
├── dashboard/       # User dashboard
├── disputes/        # Dispute management
├── profile/         # User profile
└── transactions/    # Transaction management

components/
├── layout/          # Layout components
└── ui/              # UI components
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/demo-login` - Demo login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/password` - Change password

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}/accept` - Accept transaction
- `PUT /api/transactions/{id}/fund` - Fund transaction
- `PUT /api/transactions/{id}/deliver` - Mark delivered
- `PUT /api/transactions/{id}/complete` - Complete transaction
- `PUT /api/transactions/{id}/cancel` - Cancel transaction

### Chat & Notifications
- `GET /api/chat/transactions/{id}/messages` - Get chat messages
- `POST /api/chat/transactions/{id}/messages` - Send message
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read

### Payments & Disputes
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get disputes
- `PUT /api/disputes/{id}/resolve` - Resolve dispute

## 🛠️ Development

### Running in Development Mode

1. **Start all services**:
```bash
# Terminal 1: Backend
cd vorosha-pay-java-backend && mvn spring-boot:run

# Terminal 2: Frontend
cd vorosha-pay-frontend && npm run dev

# Terminal 3: OCR Service
cd vorosha-pay-ocr-service && python app.py
```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - OCR Service: http://localhost:8500

### Building for Production

```bash
# Backend
cd vorosha-pay-java-backend
mvn clean package -DskipTests

# Frontend
cd vorosha-pay-frontend
npm run build
```

## 🧪 Testing

### Backend Testing
```bash
cd vorosha-pay-java-backend
mvn test
```

### Frontend Testing
```bash
cd vorosha-pay-frontend
npm test
```

## 📊 Database Schema

The application uses an Excel-based database with the following sheets:

- **users**: User accounts and profiles
- **transactions**: Transaction records
- **payments**: Payment information
- **disputes**: Dispute records
- **chat_messages**: Chat history
- **notifications**: User notifications

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- CORS configuration
- Input validation and sanitization
- Secure file upload handling
- Password encryption

## 🌐 Internationalization

- Bengali (বাংলা) and English support
- Responsive design for mobile and desktop
- Cultural adaptation for Bangladesh market

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, and 8500 are available
2. **Java version**: Ensure Java 17+ is installed and configured
3. **Node.js version**: Ensure Node.js 18.18.0+ is installed
4. **Excel file locked**: Close Excel if database.xlsx is open
5. **CORS errors**: Check backend CORS configuration

### Logs
- Backend logs: `vorosha-pay-java-backend/server.log`
- Frontend logs: `vorosha-pay-frontend/frontend.log`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team.

---

**VoroshaPay** - আস্থার নতুন যুগ (Trust's New Era) 🚀
