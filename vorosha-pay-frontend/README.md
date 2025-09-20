# VoroshaPay Frontend

Modern React/Next.js frontend for VoroshaPay digital escrow platform with Bengali and English support.

## 🏗️ Technology Stack

- **Next.js**: 14.x with App Router
- **React**: 18.x with TypeScript
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API calls
- **Next Fonts**: Google Fonts integration (Poppins, Hind Siliguri)
- **TypeScript**: Type-safe development

## 🚀 Quick Setup

### Prerequisites
- **Node.js**: 18.18.0 or higher
- **npm**: 8.0 or higher
- **Git**

### Installation Steps

1. **Clone and navigate**:
```bash
git clone <repository-url>
cd vorosha/vorosha-pay-frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start development server**:
```bash
npm run dev
```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - API Base: http://localhost:8000/api (backend must be running)

## ⚙️ Configuration

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=VoroshaPay
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### API Configuration
Edit `lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

### Font Configuration
The app uses Bengali and English fonts:
- **Poppins**: Primary font for English text
- **Hind Siliguri**: Primary font for Bengali text

## 🎨 Features

### User Interface
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Automatic theme detection
- **Multi-language**: Bengali and English support
- **Modern UI**: Clean, professional design
- **Accessibility**: WCAG compliant components

### Authentication
- **Login/Register**: Secure authentication forms
- **Demo Login**: Quick access to demo accounts
- **Password Management**: Change password functionality
- **Session Management**: JWT token handling

### Transaction Management
- **Create Transactions**: Easy transaction creation
- **Transaction History**: Complete transaction tracking
- **Status Updates**: Real-time status changes
- **Payment Integration**: Multiple payment methods

### Communication
- **Real-time Chat**: Transaction-specific messaging
- **Notifications**: In-app notification system
- **Email Notifications**: External notification support

### Admin Features
- **Admin Dashboard**: Comprehensive admin interface
- **User Management**: User account management
- **Dispute Resolution**: Dispute handling system
- **Analytics**: Transaction and user analytics

## 📁 Project Structure

```
app/
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout component
├── page.tsx                    # Home page
├── page.module.css             # Home page styles
├── admin/
│   └── page.tsx               # Admin dashboard
├── auth/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── register/
│       └── page.tsx           # Registration page
├── dashboard/
│   └── page.tsx               # User dashboard
├── disputes/
│   ├── page.tsx               # Disputes list
│   └── create/
│       └── page.tsx           # Create dispute
├── profile/
│   └── page.tsx               # User profile
└── transactions/
    ├── page.tsx               # Transactions list
    ├── create/
    │   └── page.tsx           # Create transaction
    └── [id]/
        ├── page.tsx           # Transaction details
        ├── delivery/
        │   └── page.tsx       # Delivery management
        └── payment/
            └── page.tsx       # Payment processing

components/
├── layout/
│   ├── Header.tsx             # Header component
│   ├── Sidebar.tsx            # Sidebar navigation
│   └── Footer.tsx             # Footer component
└── ui/
    ├── BkashPayment.tsx       # bKash payment component
    ├── DeliveryPhotos.tsx     # Delivery photo upload
    ├── NIDVerification.tsx    # NID verification component
    ├── NotificationDropdown.tsx # Notification system
    ├── PaymentModal.tsx       # Payment modal
    └── TransactionChat.tsx    # Chat component

lib/
└── api.ts                     # API client configuration

utils/
└── [utility functions]        # Helper functions

public/
├── assets/
│   ├── bank_logo.png          # Bank logos
│   ├── bkash_logo.png         # bKash logo
│   ├── nagad_logo.png         # Nagad logo
│   ├── sslcommerz_logo.png    # SSLCommerz logo
│   └── voroshapay_logo.png    # VoroshaPay logo
└── [static assets]            # Other static files
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Code Quality
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

### Development Workflow

1. **Start development server**:
```bash
npm run dev
```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Hot reload enabled for instant updates

3. **Make changes**:
   - Edit any file in the `app/` or `components/` directories
   - Changes will be reflected immediately

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Type Checking
```bash
npm run type-check
```

## 🎨 Styling

### Tailwind CSS Configuration
The project uses Tailwind CSS for styling with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['var(--font-poppins)'],
        'hind-siliguri': ['var(--font-hind-siliguri)'],
      },
    },
  },
  plugins: [],
}
```

### Custom CSS Classes
Global styles are defined in `app/globals.css`:
- Base styles for Bengali and English text
- Custom utility classes
- Theme-specific styles
- Responsive breakpoints

## 🌐 Internationalization

### Language Support
- **Bengali (বাংলা)**: Primary language for Bangladesh market
- **English**: Secondary language for international users

### Font Integration
```typescript
// app/layout.tsx
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
});
```

### Text Direction
- **LTR**: Left-to-right for English content
- **RTL**: Right-to-left support for Arabic (if needed)

## 🔌 API Integration

### API Client Setup
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Authentication Integration
```typescript
// Request interceptor for JWT tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling
```typescript
// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement for larger screens.

## 🔒 Security Features

### Authentication
- JWT token management
- Secure token storage
- Automatic token refresh
- Session timeout handling

### Data Protection
- Input sanitization
- XSS protection
- CSRF protection
- Secure API communication

## 🧪 Testing

### Running Tests
```bash
npm test                    # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Test Structure
```
__tests__/
├── components/            # Component tests
├── pages/                # Page tests
├── utils/                # Utility function tests
└── setup.ts              # Test setup
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. **Connect to Vercel**:
   - Import project from GitHub
   - Configure environment variables
   - Deploy automatically

2. **Environment Variables**:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to your hosting provider
# Upload the .next folder and package.json
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Node.js version mismatch**:
```bash
# Check Node.js version
node --version
# Should be 18.18.0 or higher
```

2. **Port 3000 already in use**:
```bash
# Kill process using port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

3. **Build errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

4. **API connection issues**:
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints

5. **Hydration errors**:
   - Check for server/client mismatches
   - Ensure consistent rendering
   - Handle browser extensions (like Grammarly)

### Development Tools
- **React Developer Tools**: Browser extension
- **Next.js DevTools**: Built-in development tools
- **ESLint**: Code linting and formatting
- **TypeScript**: Type checking and IntelliSense

## 📊 Performance Optimization

### Next.js Optimizations
- **Automatic Code Splitting**: Route-based splitting
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization
- **Bundle Analysis**: Built-in bundle analyzer

### React Optimizations
- **Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for large components
- **Virtual Scrolling**: For large lists
- **Debounced Input**: For search and form inputs

## 🔄 State Management

### Local State
- React hooks (useState, useEffect)
- Context API for global state
- Custom hooks for reusable logic

### Server State
- Axios for API calls
- React Query for caching and synchronization
- SWR for data fetching

## 📝 License

This project is licensed under the MIT License.

---

**VoroshaPay Frontend** - Modern, Responsive, and User-Friendly 🚀