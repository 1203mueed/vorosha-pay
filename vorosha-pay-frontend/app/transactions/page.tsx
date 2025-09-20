'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  MessageCircle
} from 'lucide-react'
import { tokenUtils, transactionAPI } from '../../lib/api'
import TransactionChat from '../../components/ui/TransactionChat'

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

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/auth/login')
      return
    }

    const userData = tokenUtils.getUser()
    setUser(userData)
    loadTransactions()
  }, [router, filter, sortBy])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      
      const params = { 
        status: filter === 'all' ? undefined : filter,
        limit: -1, // Get all transactions
        sort: sortBy
      }
      const response = await transactionAPI.getUserTransactions(params)
      
      if (response?.success) {
        const list = Array.isArray(response.data) ? response.data : []
        setTransactions(list as any)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadTransactions()
    setIsRefreshing(false)
  }

  const openChat = (transaction: Transaction, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to transaction details
    e.stopPropagation()
    setSelectedTransaction(transaction)
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatOpen(false)
    setSelectedTransaction(null)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Recently';
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (transaction.description || '').toLowerCase().includes(searchLower) ||
      (transaction.transactionId || '').toLowerCase().includes(searchLower) ||
      ((transaction.userRole === 'buyer' ? transaction.seller?.fullName : transaction.buyer?.fullName)
        || '')
        .toLowerCase().includes(searchLower)
    )
  })

  const statusCounts = {
    all: transactions.length,
    pending: transactions.filter(t => t.status?.toLowerCase() === 'pending').length,
    accepted: transactions.filter(t => t.status?.toLowerCase() === 'accepted').length,
    funded: transactions.filter(t => t.status?.toLowerCase() === 'funded').length,
    delivered: transactions.filter(t => t.status?.toLowerCase() === 'delivered').length,
    completed: transactions.filter(t => t.status?.toLowerCase() === 'completed').length,
    disputed: transactions.filter(t => t.status?.toLowerCase() === 'disputed').length,
    cancelled: transactions.filter(t => t.status?.toLowerCase() === 'cancelled').length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
                <p className="bengali text-sm text-gray-500">সকল লেনদেন</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {user.role !== 'admin' && (
                <Link 
                  href="/transactions/create"
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Transaction
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All', bengali: 'সব' },
                { key: 'pending', label: 'Pending', bengali: 'অপেক্ষমান' },
                { key: 'funded', label: 'Funded', bengali: 'অর্থায়িত' },
                { key: 'completed', label: 'Completed', bengali: 'সম্পন্ন' },
                { key: 'disputed', label: 'Disputed', bengali: 'বিরোধপূর্ণ' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setFilter(status.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    filter === status.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                  <span className="bengali ml-1 text-xs">({status.bengali})</span>
                  {statusCounts[status.key as keyof typeof statusCounts] > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                      {statusCounts[status.key as keyof typeof statusCounts]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const counterparty = transaction.userRole === 'buyer' ? transaction.seller : transaction.buyer;
                const isReceived = transaction.userRole === 'seller';
                
                return (
                  <div key={transaction.id} className="block p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/transactions/${transaction.id}`}
                        className="flex items-center flex-1"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          isReceived ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {isReceived ? (
                            <ArrowDownLeft className="w-6 h-6 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-lg">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            ID: {transaction.transactionId} • 
                            {isReceived ? ' From' : ' To'} {counterparty?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {transaction.createdAt ? formatDate(transaction.createdAt) : ''}
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
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        
                        <div className="text-right">
                          <div className={`text-xl font-bold ${isReceived ? 'text-green-600' : 'text-gray-900'}`}>
                            {isReceived ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                            {String(transaction.status).toLowerCase()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.userRole === 'buyer' ? 'You are buying' : 'You are selling'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {filter === 'all' ? (
                  <ArrowUpRight className="w-10 h-10 text-gray-400" />
                ) : (
                  <Filter className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {filter === 'all' 
                  ? "You haven't created any transactions yet. Start by creating your first secure escrow transaction."
                  : `You don't have any ${filter} transactions at the moment.`
                }
              </p>
              {filter === 'all' && user.role !== 'admin' && (
                <Link 
                  href="/transactions/create"
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Transaction
                </Link>
              )}
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-emerald-600 hover:text-emerald-800 transition font-medium"
                >
                  View All Transactions
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Transaction Summary
              <span className="bengali text-sm text-gray-500 ml-2">লেনদেন সারসংক্ষেপ</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedTransaction && (
        <TransactionChat
          transactionId={selectedTransaction.transactionId}
          isOpen={chatOpen}
          onClose={closeChat}
          counterpartyName={
            selectedTransaction.userRole === 'buyer' 
              ? selectedTransaction.seller?.fullName || 'Seller'
              : selectedTransaction.buyer?.fullName || 'Buyer'
          }
        />
      )}
    </div>
  )
} 