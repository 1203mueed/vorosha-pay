'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Eye,
  TrendingUp,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import { tokenUtils, transactionAPI } from '../../lib/api'
import { useVerification } from '../../contexts/VerificationContext'
import NotificationDropdown from '../../components/ui/NotificationDropdown'
import TransactionChat from '../../components/ui/TransactionChat'

interface UserStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalEarned: number;
  totalSpent: number;
  totalPending: number;
  netBalance: number;
}

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  userRole: 'buyer' | 'seller';
  buyer: any;
  seller: any;
}

export default function DashboardPage() {
  const router = useRouter()
  const { showVerificationModal, isFullyVerified } = useVerification()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = () => {
      if (!tokenUtils.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      const userData = tokenUtils.getUser()
      setUser(userData)
      loadDashboardData()
    }

    checkAuth()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Load user stats and recent transactions in parallel
      const [statsResponse, transactionsResponse] = await Promise.all([
        transactionAPI.getUserStats(),
        transactionAPI.getUserTransactions({ limit: 5, sort: 'newest' })
      ])

      // Unwrap stats: backend shape { success, data: { stats: {...} } }
      const statsContainer = (statsResponse && (statsResponse.data || statsResponse)) as any
      const extractedStats = (statsContainer && (statsContainer.stats || statsContainer)) as any
      setStats((extractedStats as any) || null)

      // Unwrap transactions: backend shape { success, data: { transactions: [...] } }
      const txContainer = (transactionsResponse && (transactionsResponse.data || transactionsResponse)) as any
      const txList = Array.isArray(txContainer?.transactions)
        ? txContainer.transactions
        : Array.isArray(txContainer)
          ? txContainer
          : []
      setRecentTransactions(txList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // If token is invalid, user will be redirected by API interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
  }

  const handleCreateTransaction = (e: React.MouseEvent) => {
    if (!isFullyVerified) {
      e.preventDefault()
      showVerificationModal()
    }
    // If fully verified, let the link navigate normally
  }

  const openChat = (transaction: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedTransaction(transaction)
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatOpen(false)
    setSelectedTransaction(null)
  }

  const handleLogout = () => {
    tokenUtils.logout()
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If no user data, redirect to login
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'accepted': return 'text-blue-600 bg-blue-100'
      case 'funded': return 'text-indigo-600 bg-indigo-100'
      case 'delivered': return 'text-purple-600 bg-purple-100'
      case 'disputed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      user: { text: 'New User', bengali: 'নতুন ব্যবহারকারী', color: 'bg-gray-100 text-gray-800' },
      customer: { text: 'Customer', bengali: 'ক্রেতা', color: 'bg-blue-100 text-blue-800' },
      merchant: { text: 'Merchant', bengali: 'বিক্রেতা', color: 'bg-green-100 text-green-800' },
      admin: { text: 'Admin', bengali: 'অ্যাডমিন', color: 'bg-purple-100 text-purple-800' }
    }
    return badges[role as keyof typeof badges] || badges.user
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
      return 'Recently';
    }
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid and not from the Unix epoch era
      if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (diffInMinutes < 43200) { // 30 days
        const days = Math.floor(diffInMinutes / 1440);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        // For older dates, show the actual date
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Recently';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm mr-2">
              V
            </div>
            <span className="text-lg font-bold text-emerald-800">Vorosha Pay</span>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 mb-6">
            <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold mr-3">
                {getUserInitials(user.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-emerald-800 truncate">{user.fullName}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.primaryRole).color}`}>
                    {getRoleBadge(user.primaryRole).text}
                    <span className="bengali ml-1">({getRoleBadge(user.primaryRole).bengali})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards in Sidebar */}
          <div className="px-3 mb-6 space-y-3">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Completed</span>
              </div>
              <div className="text-lg font-bold text-green-800">{stats?.completedTransactions || 0}</div>
              <div className="text-xs text-green-600">
                {stats?.totalTransactions ? 
                  `${Math.round((stats.completedTransactions / stats.totalTransactions) * 100)}% success` : 
                  'No transactions'
                }
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-600 font-medium">Trust Score</span>
              </div>
              <div className="text-lg font-bold text-emerald-800">
                {stats?.completedTransactions ? 
                  (8.5 + (stats.completedTransactions * 0.1)).toFixed(1) : 
                  'N/A'
                }/10
              </div>
              <div className="text-xs text-emerald-600">
                {user.isPhoneVerified ? 'Verified' : 'Unverified'}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 px-3">
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-emerald-600 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 mr-3" />
              Dashboard
              <span className="bengali ml-2 text-xs">ড্যাশবোর্ড</span>
            </Link>
            <Link href="/transactions" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition">
              <ArrowUpRight className="w-5 h-5 mr-3" />
              Transactions
              <span className="bengali ml-2 text-xs">লেনদেন</span>
            </Link>
            <Link href="/profile" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition">
              <User className="w-5 h-5 mr-3" />
              Profile
              <span className="bengali ml-2 text-xs">প্রোফাইল</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition w-full"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
              <span className="bengali ml-2 text-xs">সাইন আউট</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6 text-gray-500" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
                <span className="bengali text-sm text-gray-500 ml-2">ড্যাশবোর্ড</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/transactions/create"
                onClick={handleCreateTransaction}
                className="hidden sm:inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </Link>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <NotificationDropdown pendingCount={stats?.pendingTransactions || 0} />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitials(user.fullName)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                  <div className="text-xs text-gray-500">{getRoleBadge(user.primaryRole).text}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-6 text-white mb-8">
            <h2 className="text-xl font-bold mb-2">
              Welcome back, {user.fullName}!
              <span className="bengali block text-sm opacity-90">আবার স্বাগতম!</span>
            </h2>
            <p className="opacity-90">
              You're logged in as a {getRoleBadge(user.primaryRole).text.toLowerCase()}. 
              {user.primaryRole === 'user' && " Create your first transaction to start using our secure escrow system."}
              {user.primaryRole === 'customer' && user.allRoles?.includes('merchant') && " You can both buy and sell using our secure escrow system."}
              {user.primaryRole === 'customer' && !user.allRoles?.includes('merchant') && " You can create transactions and make secure payments."}
              {user.primaryRole === 'merchant' && !user.allRoles?.includes('customer') && " You can receive payments and manage your sales."}
              {user.primaryRole === 'admin' && " You have full access to manage the platform."}
            </p>
          </div>

          {/* Stats Cards - Only Total Transactions and Total Earned
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="bengali text-xs text-gray-500">মোট লেনদেন</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats?.totalTransactions || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                All time transactions
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {(user.primaryRole === 'merchant' || user.allRoles?.includes('merchant')) ? 'Total Earned' : 'Total Spent'}
                  </p>
                  <p className="bengali text-xs text-gray-500">
                    {(user.primaryRole === 'merchant' || user.allRoles?.includes('merchant')) ? 'মোট আয়' : 'মোট খরচ'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(() => {
                  const isMerchant = (user.primaryRole === 'merchant' || user.allRoles?.includes('merchant'));
                  const amount = isMerchant ? (stats?.totalEarned ?? 0) : (stats?.totalSpent ?? 0);
                  return `৳${Number(amount).toLocaleString()}`;
                })()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                All time {(user.primaryRole === 'merchant' || user.allRoles?.includes('merchant')) ? 'earnings' : 'spending'}
              </p>
            </div>
          </div> */}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
              <span className="bengali text-sm text-gray-500 ml-2">দ্রুত কার্যক্রম</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {user.role !== 'admin' && (
                <Link href="/transactions/create" onClick={handleCreateTransaction} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">New Transaction</div>
                    <div className="bengali text-xs text-gray-500">নতুন লেনদেন</div>
                  </div>
                </Link>
              )}

              <Link href="/transactions?filter=pending" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">View Pending</div>
                  <div className="bengali text-xs text-gray-500">অপেক্ষমান দেখুন</div>
                </div>
              </Link>

              <Link href="/profile" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Update Profile</div>
                  <div className="bengali text-xs text-gray-500">প্রোফাইল আপডেট</div>
                </div>
              </Link>

              <Link href="/disputes" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">File Dispute</div>
                  <div className="bengali text-xs text-gray-500">বিরোধ দায়ের</div>
                </div>
              </Link>


            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Transactions
                  <span className="bengali text-sm text-gray-500 ml-2">সাম্প্রতিক লেনদেন</span>
                </h2>
                <div className="flex items-center space-x-3">
                  {Array.isArray(recentTransactions) && recentTransactions.length > 0 && (
                    <Link href="/transactions" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition">
                      View All
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const counterparty = transaction.userRole === 'buyer' ? transaction.seller : transaction.buyer;
                  const isReceived = transaction.userRole === 'seller';
                  
                  return (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/transactions/${transaction.id}`}
                          className="flex items-center flex-1"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            isReceived ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isReceived ? (
                              <ArrowDownLeft className="w-5 h-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {isReceived ? 'Received from' : 'Paid to'} {counterparty?.fullName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ৳{transaction.amount?.toLocaleString()} • {formatDate(transaction.createdAt)}
                            </div>
                          </div>
                        </Link>
                        
                        <div className="flex items-center space-x-3">
                          {/* Chat Button */}
                          <button
                            onClick={(e) => openChat(transaction, e)}
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Chat with counterparty"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Ref: {transaction.transactionId}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No recent transactions found.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {selectedTransaction && (
        <TransactionChat
          transactionId={selectedTransaction.id}
          isOpen={chatOpen}
          onClose={closeChat}
          counterpartyName={
            selectedTransaction.userRole === 'buyer' 
              ? selectedTransaction.seller?.fullName || 'Seller'
              : selectedTransaction.buyer?.fullName || 'Buyer'
          }
        />
      )}

      {/* Floating Action Button for Mobile */}
      <Link 
        href="/transactions/create"
        onClick={handleCreateTransaction}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition z-50"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}