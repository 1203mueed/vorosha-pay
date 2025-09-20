# VoroshaPay API Documentation

Complete API documentation for the VoroshaPay digital escrow platform.

## 🌐 Base URLs

- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

All API endpoints (except authentication) require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📋 Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

## 🔑 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+880123456789",
  "roles": ["BUYER"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+880123456789",
      "roles": ["BUYER"],
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+880123456789",
      "roles": ["BUYER"],
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Demo Login
```http
POST /api/auth/demo-login
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "BUYER"  // BUYER, SELLER, or ADMIN
}
```

**Response**: Same as login response with demo user data.

### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+880123456789",
      "roles": ["BUYER"],
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+880123456789",
      "roles": ["BUYER"],
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 💰 Transaction Endpoints

### Get User Transactions
```http
GET /api/transactions
Authorization: Bearer <token>
```

**Query Parameters**:
- `status` (optional): Filter by transaction status
- `page` (optional): Page number for pagination
- `limit` (optional): Number of transactions per page

**Response**:
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": 1,
        "transactionId": "TXN-20240115-001",
        "buyerId": 1,
        "sellerId": 2,
        "amount": 1000.00,
        "description": "Purchase of electronics",
        "status": "PENDING",
        "paymentMethod": "bKash",
        "dueDate": "2024-01-20T23:59:59Z",
        "notes": "Urgent delivery required",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "sellerId": 2,
  "amount": 1000.00,
  "description": "Purchase of electronics",
  "paymentMethod": "bKash",
  "dueDate": "2024-01-20T23:59:59Z",
  "notes": "Urgent delivery required"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "PENDING",
      "paymentMethod": "bKash",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Accept Transaction
```http
PUT /api/transactions/{id}/accept
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction accepted successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "ACCEPTED",
      "paymentMethod": "bKash",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### Fund Transaction
```http
PUT /api/transactions/{id}/fund
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction funded successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "FUNDED",
      "paymentMethod": "bKash",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:40:00Z"
    }
  }
}
```

### Deliver Transaction
```http
PUT /api/transactions/{id}/deliver
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction delivered successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "DELIVERED",
      "paymentMethod": "bKash",
      "deliveryProof": "delivery-photo-1.jpg,delivery-photo-2.jpg",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:45:00Z"
    }
  }
}
```

### Complete Transaction
```http
PUT /api/transactions/{id}/complete
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction completed successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "COMPLETED",
      "paymentMethod": "bKash",
      "deliveryProof": "delivery-photo-1.jpg,delivery-photo-2.jpg",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:50:00Z",
      "completedAt": "2024-01-15T10:50:00Z"
    }
  }
}
```

### Cancel Transaction
```http
PUT /api/transactions/{id}/cancel
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction cancelled successfully",
  "data": {
    "transaction": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "buyerId": 1,
      "sellerId": 2,
      "amount": 1000.00,
      "description": "Purchase of electronics",
      "status": "CANCELLED",
      "paymentMethod": "bKash",
      "dueDate": "2024-01-20T23:59:59Z",
      "notes": "Urgent delivery required",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:55:00Z"
    }
  }
}
```

## 💬 Chat Endpoints

### Get Transaction Messages
```http
GET /api/chat/transactions/{transactionId}/messages
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": 1,
        "transactionId": "TXN-20240115-001",
        "senderId": 1,
        "receiverId": 2,
        "message": "Hello, when will you deliver?",
        "sentAt": "2024-01-15T10:30:00Z",
        "isRead": true
      }
    ],
    "canChat": true
  }
}
```

### Send Message
```http
POST /api/chat/transactions/{transactionId}/messages
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "Hello, when will you deliver?"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "senderId": 1,
      "receiverId": 2,
      "message": "Hello, when will you deliver?",
      "sentAt": "2024-01-15T10:30:00Z",
      "isRead": false
    }
  }
}
```

### Mark Messages as Read
```http
PUT /api/chat/transactions/{transactionId}/read
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "readCount": 5
  }
}
```

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Number of notifications per page
- `unread` (optional): Filter unread notifications only

**Response**:
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": 1,
        "userId": 1,
        "type": "info",
        "title": "Transaction Accepted",
        "message": "Seller has accepted your transaction: Purchase of electronics",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 1,
    "unreadCount": 1
  }
}
```

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "id": 1,
      "userId": 1,
      "type": "info",
      "title": "Transaction Accepted",
      "message": "Seller has accepted your transaction: Purchase of electronics",
      "isRead": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### Create Test Notification
```http
POST /api/notifications/test
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Test notification created",
  "data": {
    "notification": {
      "id": 2,
      "userId": 1,
      "type": "info",
      "title": "Test Notification",
      "message": "This is a test notification",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 💳 Payment Endpoints

### Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "transactionId": "TXN-20240115-001",
  "paymentMethod": "bKash"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "paymentId": "PAY-20240115-001",
    "status": "initiated",
    "paymentMethod": "bKash",
    "amount": 1000.00
  }
}
```

### Process Payment
```http
POST /api/payments/process/{paymentId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Payment processed",
  "data": {
    "paymentId": "PAY-20240115-001",
    "status": "completed",
    "amount": 1000.00,
    "processedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Payment Status
```http
GET /api/payments/status/{paymentId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Payment status retrieved",
  "data": {
    "paymentId": "PAY-20240115-001",
    "status": "completed",
    "amount": 1000.00,
    "paymentMethod": "bKash",
    "processedAt": "2024-01-15T10:30:00Z"
  }
}
```

## 🚚 Delivery Endpoints

### Upload Delivery Photos
```http
POST /api/delivery/transactions/{transactionId}/deliver
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body**:
- `photos`: Array of image files
- `deliveryNotes` (optional): Delivery notes

**Response**:
```json
{
  "success": true,
  "message": "Delivery photos uploaded and transaction marked as delivered",
  "data": {
    "transactionId": "TXN-20240115-001",
    "uploadedFiles": ["delivery-photo-1.jpg", "delivery-photo-2.jpg"],
    "status": "delivered",
    "deliveryNotes": "Delivered successfully"
  }
}
```

### Get Delivery Details
```http
GET /api/delivery/transactions/{transactionId}/delivery
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Delivery details retrieved",
  "data": {
    "transactionId": "TXN-20240115-001",
    "status": "delivered",
    "deliveryPhotos": ["delivery-photo-1.jpg", "delivery-photo-2.jpg"],
    "deliveryNotes": "Delivered successfully",
    "deliveredAt": "2024-01-15T10:45:00Z",
    "isConfirmed": false
  }
}
```

### Confirm Delivery
```http
POST /api/delivery/transactions/{transactionId}/confirm
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Delivery confirmed",
  "data": {
    "transactionId": "TXN-20240115-001",
    "status": "confirmed"
  }
}
```

## 🏦 bKash Integration Endpoints

### Grant Token
```http
POST /api/bkash/grant-token
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Token granted successfully",
  "data": {
    "token": "bkash_access_token",
    "expiresIn": 3600
  }
}
```

### Create Payment
```http
POST /api/bkash/create-payment
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "amount": 1000.00,
  "currency": "BDT",
  "intent": "sale",
  "merchantInvoiceNumber": "TXN-20240115-001"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "paymentID": "bkash_payment_id",
    "bkashURL": "https://sandbox.pgw.bkash.com/checkout/payment/execute/..."
  }
}
```

### Execute Payment
```http
POST /api/bkash/execute-payment
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "paymentID": "bkash_payment_id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment executed successfully",
  "data": {
    "paymentID": "bkash_payment_id",
    "status": "Completed",
    "amount": 1000.00,
    "currency": "BDT"
  }
}
```

## 🆔 OCR Service Endpoints

### Verify NID
```http
POST /api/ocr/verify-nid
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body**:
- `frontImage`: Front side of NID card
- `backImage`: Back side of NID card

**Response**:
```json
{
  "success": true,
  "message": "NID verification completed",
  "data": {
    "front": {
      "name": "জনাব আব্দুল করিম",
      "fatherName": "মোঃ আব্দুল হামিদ",
      "motherName": "মোসাঃ রোকসানা বেগম",
      "dateOfBirth": "01/01/1985",
      "nidNumber": "1234567890123"
    },
    "back": {
      "address": "গ্রাম: দক্ষিণ পাইকপাড়া, ডাকঘর: পাইকপাড়া",
      "issueDate": "01/01/2010"
    },
    "confidence": 0.85
  }
}
```

## ⚖️ Dispute Endpoints

### Get Disputes
```http
GET /api/disputes
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Disputes retrieved successfully",
  "data": {
    "disputes": [
      {
        "id": 1,
        "transactionId": "TXN-20240115-001",
        "filedBy": 1,
        "reason": "Product not as described",
        "status": "PENDING",
        "evidenceFile": "evidence-1.pdf",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Create Dispute
```http
POST /api/disputes
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body**:
- `transactionId`: Transaction ID
- `reason`: Dispute reason
- `evidence` (optional): Evidence file

**Response**:
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "data": {
    "dispute": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "filedBy": 1,
      "reason": "Product not as described",
      "status": "PENDING",
      "evidenceFile": "evidence-1.pdf",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Resolve Dispute
```http
PUT /api/disputes/{id}/resolve
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "resolution": "Dispute resolved in favor of buyer",
  "status": "RESOLVED"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "dispute": {
      "id": 1,
      "transactionId": "TXN-20240115-001",
      "filedBy": 1,
      "reason": "Product not as described",
      "status": "RESOLVED",
      "resolution": "Dispute resolved in favor of buyer",
      "evidenceFile": "evidence-1.pdf",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

## 🏥 Health Check

### Health Check
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "services": {
    "ocr": "available",
    "payment": "available"
  }
}
```

## 📊 Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## 🔒 Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **Transaction endpoints**: 100 requests per minute
- **Chat endpoints**: 200 requests per minute
- **Other endpoints**: 50 requests per minute

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary amounts are in BDT (Bangladeshi Taka)
3. File uploads are limited to 10MB
4. JWT tokens expire after 24 hours
5. All endpoints support CORS for `http://localhost:3000`

---

**VoroshaPay API** - Complete, Secure, and Reliable 🚀
