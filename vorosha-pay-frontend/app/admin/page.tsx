'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  AlertTriangle, 
  Shield, 
  Settings, 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Ban,
  UserCheck,
  DollarSign,
  TrendingUp,
  Activity,
  LogOut,
  RefreshCw,
  Menu,
  X,
  Phone,
  Mail,
  Calendar,
  UserX
} from 'lucide-react'
import { tokenUtils, adminAPI } from '../../lib/api'

interface AdminStats {
  totalUsers: number
  verifiedUsers: number
  pendingVerifications: number
  totalTransactions: number
  activeDisputes: number
  totalRevenue: number
}

interface User {
  id: string
  fullName: string
  email: string
  phone: string
  isPhoneVerified: boolean
  isNIDVerified: boolean
  isFullyVerified: boolean
  createdAt: string
  primaryRole: string
  suspended: boolean
}

interface Dispute {
  id: string
  transactionId: string
  filedBy: string
  reason: string
  status: string
  createdAt: string
  description: string
}

interface Activity {
  id: string
  type: string
  description: string
  createdAt: string
  userId: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalTransactions: 0,
    activeDisputes: 0,
    totalRevenue: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [disputeFilter, setDisputeFilter] = useState('all')

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = () => {
      if (!tokenUtils.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      const userData = tokenUtils.getUser()
      if (!userData || userData.primaryRole !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      loadAdminData()
    }

    checkAdminAuth()
  }, [router])

  const loadAdminData = async () => {
    try {
      setIsLoading(true)
      
      // Load admin stats
      const statsResponse = await adminAPI.getStats()
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats)
      }

      // Load recent activities
      const activitiesResponse = await adminAPI.getActivities(10)
      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data.activities)
      }

      // Load initial data for other tabs
      if (activeTab === 'users') {
        await loadUsers()
      } else if (activeTab === 'disputes') {
        await loadDisputes()
      }

    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({
        search: searchTerm,
        filter: userFilter,
        limit: 50
      })
      if (response.data.success) {
        setUsers(response.data.data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadDisputes = async () => {
    try {
      const response = await adminAPI.getAllDisputes({
        status: disputeFilter === 'all' ? undefined : disputeFilter,
        limit: 50
      })
      if (response.data.success) {
        setDisputes(response.data.data.disputes)
      }
    } catch (error) {
      console.error('Error loading disputes:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAdminData()
    setIsRefreshing(false)
  }

  const handleLogout = () => {
    tokenUtils.logout()
    router.push('/auth/login')
  }

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab)
    if (tab === 'users') {
      await loadUsers()
    } else if (tab === 'disputes') {
      await loadDisputes()
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'view':
          // Navigate to user details
          router.push(`/admin/users/${userId}`)
          break
        case 'verify':
          const verifyResponse = await adminAPI.updateUserVerification(userId, {
            phoneVerified: true,
            nidVerified: true
          })
          if (verifyResponse.data.success) {
            await loadUsers()
            alert('User verified successfully')
          }
          break
        case 'suspend':
          const suspendResponse = await adminAPI.suspendUser(userId, {
            suspended: true,
            reason: 'Administrative action'
          })
          if (suspendResponse.data.success) {
            await loadUsers()
            alert('User suspended successfully')
          }
          break
      }
    } catch (error) {
      console.error('Error performing user action:', error)
      alert('Failed to perform action')
    }
  }

  const handleDisputeAction = async (disputeId: string, action: string) => {
    try {
      if (action === 'resolve') {
        const resolution = prompt('Enter resolution details:')
        if (resolution) {
          const response = await adminAPI.resolveDispute(disputeId, {
            resolution,
            notes: 'Resolved by admin'
          })
          if (response.data.success) {
            await loadDisputes()
            alert('Dispute resolved successfully')
          }
        }
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('Failed to resolve dispute')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <Users className="w-4 h-4" />
      case 'transaction_created': return <DollarSign className="w-4 h-4" />
      case 'dispute_filed': return <AlertTriangle className="w-4 h-4" />
      case 'verification_completed': return <CheckCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      disputed: 'bg-red-100 text-red-800',
      resolved: 'bg-blue-100 text-blue-800',
      suspended: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm mr-2">
              A
            </div>
            <span className="text-lg font-bold text-white">Admin Panel</span>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 mb-6">
            <div className="flex items-center p-3 bg-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold mr-3">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{user?.fullName || 'Admin'}</div>
                <div className="text-xs text-gray-400 truncate">Administrator</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 px-3">
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === 'overview' 
                  ? 'text-white bg-emerald-600' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Overview
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === 'users' 
                  ? 'text-white bg-emerald-600' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              User Management
            </button>
            <button
              onClick={() => handleTabChange('disputes')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === 'disputes' 
                  ? 'text-white bg-emerald-600' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mr-3" />
              Disputes
            </button>
            <button
              onClick={() => handleTabChange('transactions')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === 'transactions' 
                  ? 'text-white bg-emerald-600' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <DollarSign className="w-5 h-5 mr-3" />
              Transactions
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === 'settings' 
                  ? 'text-white bg-emerald-600' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </button>
            <div className="border-t border-gray-700 mt-4 pt-4">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
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
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'disputes' && 'Dispute Management'}
                {activeTab === 'transactions' && 'Transaction Management'}
                {activeTab === 'settings' && 'System Settings'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.verifiedUsers} verified users
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Require admin attention
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    ৳{stats.totalRevenue.toLocaleString()} total volume
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeDisputes}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Need resolution
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Health</p>
                      <p className="text-2xl font-bold text-green-900">Healthy</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    All systems operational
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">৳{(stats.totalRevenue * 0.02).toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    2% transaction fee
                  </p>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="p-6 flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2" />
                      <p>No recent activities</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="pending_nid">Pending NID</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button
                    onClick={loadUsers}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className={user.suspended ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold mr-3">
                                {user.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                {user.suspended && (
                                  <div className="text-xs text-red-600 font-medium">SUSPENDED</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-4 h-4 mr-1" />
                              {user.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="w-4 h-4 mr-1" />
                              {user.phone || 'Not provided'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.isPhoneVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                Phone: {user.isPhoneVerified ? 'Verified' : 'Pending'}
                              </div>
                              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.isNIDVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                NID: {user.isNIDVerified ? 'Verified' : 'Pending'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.primaryRole)}`}>
                              {user.primaryRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleUserAction(user.id, 'view')}
                                className="text-emerald-600 hover:text-emerald-900"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!user.isFullyVerified && (
                                <button 
                                  onClick={() => handleUserAction(user.id, 'verify')}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Verify User"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleUserAction(user.id, 'suspend')}
                                className="text-red-600 hover:text-red-900"
                                title={user.suspended ? "Unsuspend User" : "Suspend User"}
                              >
                                {user.suspended ? <UserX className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-6">
              {/* Dispute Filters */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-4">
                  <select
                    value={disputeFilter}
                    onChange={(e) => setDisputeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Disputes</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button
                    onClick={loadDisputes}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Disputes Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filed By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {disputes.map((dispute) => (
                        <tr key={dispute.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{dispute.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #{dispute.transactionId.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dispute.filedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dispute.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(dispute.status)}`}>
                              {dispute.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(dispute.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleDisputeAction(dispute.id, 'view')}
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {dispute.status === 'pending' && (
                                <button 
                                  onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {disputes.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p>No disputes found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Transaction Management</h3>
                <p>Coming soon - Comprehensive transaction monitoring and management tools.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-center text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">System Settings</h3>
                <p>Coming soon - Platform configuration and admin settings.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
} 