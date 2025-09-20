import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Small helper to unwrap { success, message, data } or return original data
const unwrap = (res: any) => {
  // If it's already unwrapped (has success property), return as is
  if (res?.success !== undefined) return res;
  // If it's wrapped in axios response, extract data
  if (res?.data) return res.data;
  // Otherwise return as is
  return res;
};

// Auth API functions
export const authAPI = {
  register: async (userData: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  demoLogin: async (role: string = 'customer') => {
    const response = await api.post('/api/auth/demo-login', { role });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: { fullName?: string; phone?: string }) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: { 
    currentPassword: string; 
    newPassword: string 
  }) => {
    const response = await api.put('/api/auth/password', passwordData);
    return response.data;
  },

  verifyPhone: async (verificationCode: string) => {
    const response = await api.post('/api/auth/verify-phone', { verificationCode });
    return response.data;
  },
};

// Transaction API functions
export const transactionAPI = {
  getUserTransactions: async (params?: { 
    status?: string; 
    limit?: number; 
    page?: number; 
    sort?: string 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit !== undefined && params?.limit !== null) queryParams.append('limit', String(params.limit));
    if (params?.page !== undefined && params?.page !== null) queryParams.append('page', String(params.page));
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const response = await api.get(`/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    // backend returns { success, message, data } where data is list or object
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/api/transactions/stats');
    return response.data;
  },

  createTransaction: async (transactionData: {
    amount: number;
    description: string;
    counterpartyEmail: string;
    dueDate?: string;
    notes?: string;
  }) => {
    const response = await api.post('/api/transactions', transactionData);
    return response.data;
  },

  getTransaction: async (id: string) => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  getTransactionByRef: async (transactionId: string) => {
    const response = await api.get(`/api/transactions/ref/${transactionId}`);
    return response.data;
  },

  // Status update methods
  acceptTransaction: async (id: string) => {
    const response = await api.put(`/api/transactions/${id}/accept`);
    return unwrap(response);
  },

  fundTransaction: async (id: string, paymentMethod: string = 'mock') => {
    const response = await api.put(`/api/transactions/${id}/fund`, { paymentMethod });
    return unwrap(response);
  },

  deliverTransaction: async (id: string, deliveryProof?: string) => {
    const response = await api.put(`/api/transactions/${id}/deliver`, { deliveryProof });
    return unwrap(response);
  },

  completeTransaction: async (id: string) => {
    const response = await api.put(`/api/transactions/${id}/complete`);
    return unwrap(response);
  },

  cancelTransaction: async (id: string, reason?: string) => {
    const response = await api.put(`/api/transactions/${id}/cancel`, { reason });
    return unwrap(response);
  },

  disputeTransaction: async (id: string, reason: string) => {
    const response = await api.put(`/api/transactions/${id}/dispute`, { reason });
    return unwrap(response);
  },

  // Legacy method
  updateTransactionStatus: async (id: string, status: string, deliveryProof?: string, reason?: string) => {
    const response = await api.put(`/api/transactions/${id}/status`, {
      status,
      deliveryProof,
      reason
    });
    return unwrap(response);
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },
  sendPhoneVerification: async (payload?: { phone?: string }) => {
    const response = await api.post('/api/users/send-verification', payload ?? {});
    return response.data;
  },
  verifyPhone: async (payload: { verificationCode: string }) => {
    const response = await api.post('/api/users/verify-phone', payload);
    return response.data;
  },
  verifyNID: (formData: FormData) => api.post('/api/users/verify-nid', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getNIDInfo: () => api.get('/api/users/nid-info'),
  getNIDImage: (filename: string) => {
    return `${api.defaults.baseURL}/api/users/nid-documents/${filename}`;
  },
};

// Payment API functions
export const paymentAPI = {
  getPaymentMethods: async () => unwrap(await api.get('/api/payments/methods')),

  initiatePayment: async (transactionId: string, paymentMethod: string) => {
    const response = await api.post('/api/payments/initiate', {
      transactionId,
      paymentMethod
    });
    return unwrap(response);
  },

  processPayment: async (paymentId: string) => unwrap(await api.post(`/api/payments/process/${paymentId}`)),

  getPaymentStatus: async (paymentId: string) => unwrap(await api.get(`/api/payments/${paymentId}/status`)),

  getPaymentHistory: async (params?: { status?: string; limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    const response = await api.get(`/api/payments/history?${queryParams.toString()}`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  },

  cancelPayment: async (paymentId: string) => unwrap(await api.put(`/api/payments/${paymentId}/cancel`)),

  getPaymentStats: async () => unwrap(await api.get('/api/payments/stats')),
};

// Helper functions for token management
export const tokenUtils = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  },

  getToken: () => {
    return (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  },

  setUser: (user: any) => {
    if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('user');
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};

// Delivery API
export const deliveryAPI = {
  uploadDeliveryPhotos: async (transactionId: string, formData: FormData) => {
    const response = await api.post(`/api/delivery/transactions/${transactionId}/deliver`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  confirmDelivery: async (transactionId: string) => {
    const response = await api.post(`/api/delivery/transactions/${transactionId}/confirm`);
    return response.data;
  },

  getDeliveryDetails: async (transactionId: string) => {
    const response = await api.get(`/api/delivery/transactions/${transactionId}/delivery`);
    return response.data;
  },

  getDeliveryPhoto: (filename: string) => {
    return `${api.defaults.baseURL}/api/delivery/photos/${filename}`;
  },

  getUserDeliveries: async () => {
    const response = await api.get(`/api/delivery/my-deliveries`);
    return response.data;
  }
};

// Dispute API
export const disputeAPI = {
  createDispute: async (formData: FormData) => {
    const response = await api.post(`/api/disputes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDispute: async (disputeId: string) => {
    const response = await api.get(`/api/disputes/${disputeId}`);
    return response.data;
  },

  getUserDisputes: async () => {
    const response = await api.get(`/api/disputes/my-disputes`);
    return response.data;
  },

  getAllDisputes: async (status?: string) => {
    const queryParams = status ? `?status=${status}` : '';
    const response = await api.get(`/api/disputes${queryParams}`);
    return response.data;
  },

  resolveDispute: async (disputeId: string, resolution: string, action: 'resolve' | 'reject' | 'investigate') => {
    const response = await api.put(`/api/disputes/${disputeId}/resolve`, { resolution, action });
    return response.data;
  },

  getEvidenceFile: (filename: string) => {
    return `${api.defaults.baseURL}/api/disputes/evidence/${filename}`;
  },

  getDisputeStats: async () => {
    const response = await api.get(`/api/disputes/admin/stats`);
    return response.data;
  }
};

// Admin API functions
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getActivities: (limit?: number) => api.get(`/api/admin/activities${limit ? `?limit=${limit}` : ''}`),
  
  // User management
  getAllUsers: (params?: { search?: string; filter?: string; limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return api.get(`/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  getUserDetails: (id: string) => api.get(`/api/admin/users/${id}`),
  updateUserVerification: (id: string, data: { phoneVerified?: boolean; nidVerified?: boolean }) =>
    api.put(`/api/admin/users/${id}/verification`, data),
  suspendUser: (id: string, data: { suspended: boolean; reason?: string }) =>
    api.put(`/api/admin/users/${id}/suspend`, data),
  
  // Dispute management
  getAllDisputes: (params?: { status?: string; limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    return api.get(`/api/admin/disputes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
  resolveDispute: (id: string, data: { resolution: string; refundAmount?: number; notes?: string }) =>
    api.put(`/api/admin/disputes/${id}/resolve`, data),
};

export const notificationAPI = {
  getMyNotifications: async () => {
    const res = await api.get('/api/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await api.put(`/api/notifications/${id}/read`);
    return res.data;
  }
};

// Chat API
export const chatAPI = {
  getTransactionMessages: async (transactionId: string) => {
    const response = await api.get(`/api/chat/transactions/${transactionId}/messages`);
    return response.data;
  },

  sendMessage: async (transactionId: string, message: string) => {
    const response = await api.post(`/api/chat/transactions/${transactionId}/messages`, {
      message: message.trim()
    });
    return response.data;
  },

  markMessagesAsRead: async (transactionId: string) => {
    const response = await api.put(`/api/chat/transactions/${transactionId}/messages/read`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/chat/unread-count');
    return response.data;
  }
};

// bKash API functions
export const bkashAPI = {
  // Phase 1: Grant Token
  grantToken: () => api.post('/api/bkash/grant-token'),
  
  // Phase 2: Create Payment (Authorization)
  createPayment: (data: {
    idToken: string;
    amount: string;
    customerMsisdn: string;
    merchantInvoiceNumber: string;
    transactionId: string;
  }) => api.post('/api/bkash/create-payment', data),
  
  // Phase 3: Execute Payment (Capture)
  executePayment: (data: {
    idToken: string;
    paymentId: string;
  }) => api.post('/api/bkash/execute-payment', data),
  
  // Query Payment Status
  queryPayment: (data: {
    idToken: string;
    paymentId: string;
  }) => api.post('/api/bkash/query-payment', data),
  
  // Get transaction lists
  getAuthorizedTransactions: () => api.get('/api/bkash/authorized-transactions'),
  getCapturedTransactions: () => api.get('/api/bkash/captured-transactions'),
  
  // Auto-capture payment
  autoCapturePayment: (transactionId: string) => api.post(`/api/bkash/auto-capture/${transactionId}`),
};

export default api; 