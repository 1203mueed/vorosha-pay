'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  User,
  Calendar,
  FileText,
  CreditCard,
  Upload,
  Eye,
  X,
  Check,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import { tokenUtils, transactionAPI, deliveryAPI } from '../../../lib/api'
import { useToast } from '../../../contexts/ToastContext'
import { useVerification } from '../../../contexts/VerificationContext'
import DeliveryPhotos from '../../../components/ui/DeliveryPhotos'
import TransactionChat from '../../../components/ui/TransactionChat'

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  serviceFee?: number;
  totalAmount?: number;
  serviceChargePaymentOption?: string;
  description: string;
  status: string;
  paymentMethod: string;
  deliveryProof?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  userRole: 'buyer' | 'seller';
  buyer: any;
  seller: any;
  counterparty: any;
}

export default function TransactionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const { showVerificationModal } = useVerification()
  const [user, setUser] = useState<any>(null)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [deliveryProof, setDeliveryProof] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/auth/login')
      return
    }

    const userData = tokenUtils.getUser()
    setUser(userData)
    loadTransaction()
  }, [router, params.id])

  const loadTransaction = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await transactionAPI.getTransaction(params.id as string)
      
      if (response.success) {
        setTransaction(response.data.transaction)
      } else {
        setError(response.message || 'Transaction not found')
      }
    } catch (error: any) {
      console.error('Error loading transaction:', error)
      
      // Check if it's a verification error
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load transaction'
      const errorData = error.response?.data
      
      if (errorMessage.includes('VERIFICATION_REQUIRED') || 
          (errorData && errorData.message && errorData.message.includes('VERIFICATION_REQUIRED'))) {
        showVerificationModal()
        setError('Verification required to access this transaction')
        return // Don't set loading to false, keep the modal open
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (action: string, data?: any) => {
    setIsUpdating(true)
    setError('')
    setSuccess('')

    try {
      let response;
      
      switch (action) {
        case 'accept':
          response = await transactionAPI.acceptTransaction(transaction!.id);
          break;
        case 'fund':
        case 'pay':
          // Redirect to payment page instead of directly funding
          router.push(`/transactions/${transaction!.id}/payment`);
          return;
        case 'deliver':
          response = await transactionAPI.deliverTransaction(transaction!.id, deliveryProof);
          break;
        case 'complete':
        case 'confirm-delivery':
          response = await transactionAPI.completeTransaction(transaction!.id);
          break;
        case 'cancel':
          response = await transactionAPI.cancelTransaction(transaction!.id, data?.reason);
          break;
        case 'upload-delivery':
          router.push(`/transactions/${transaction!.id}/delivery`);
          return;
        case 'dispute':
          response = await transactionAPI.disputeTransaction(transaction!.id, data?.reason || 'Dispute filed');
          break;
        default:
          throw new Error('Invalid action');
      }

      // Check if response indicates success (be more permissive)
      if (response && response.success !== false) {
        const successMessage = response.message || 'Action completed successfully'
        setSuccess(successMessage)
        showToast('success', successMessage)
        await loadTransaction() // Reload transaction data
        setShowCancelForm(false)
        setShowDisputeForm(false)
        setCancelReason('')
        setDisputeReason('')
        setDeliveryProof('')
      } else {
        const errorMessage = response?.message || 'Action failed'
        setError(errorMessage)
        showToast('error', errorMessage)
      }
    } catch (error: any) {
      console.error('Status update error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update transaction'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const openChat = () => {
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatOpen(false)
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock, 
        text: 'Pending Seller Acceptance',
        bengali: 'বিক্রেতার গ্রহণের অপেক্ষায়'
      },
      accepted: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle, 
        text: 'Accepted - Awaiting Buyer Payment',
        bengali: 'গৃহীত - ক্রেতার পেমেন্টের অপেক্ষায়'
      },
      funded: { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Shield, 
        text: 'Funded - Awaiting Delivery',
        bengali: 'অর্থায়িত - সরবরাহের অপেক্ষায়'
      },
      delivered: { 
        color: 'bg-purple-100 text-purple-800', 
        icon: CheckCircle, 
        text: 'Delivered - Awaiting Buyer Confirmation',
        bengali: 'সরবরাহকৃত - ক্রেতার নিশ্চিতকরণের অপেক্ষায়'
      },
      completed: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        text: 'Completed - Payment Released',
        bengali: 'সম্পন্ন - পেমেন্ট প্রদান করা হয়েছে'
      },
      disputed: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertTriangle, 
        text: 'Disputed - Under Review',
        bengali: 'বিরোধপূর্ণ - পর্যালোচনাধীন'
      },
      cancelled: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: X, 
        text: 'Cancelled',
        bengali: 'বাতিল'
      }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.pending
  }

  const getAvailableActions = () => {
    if (!transaction || !user) return []

    const actions = []
    const { status, userRole } = transaction

    // Seller actions
    if (userRole === 'seller') {
      if (status === 'pending') {
        actions.push({ 
          key: 'accept', 
          label: 'Accept Transaction', 
          color: 'bg-blue-600 hover:bg-blue-700',
          bengali: 'লেনদেন গ্রহণ করুন'
        })
      }
      if (status === 'funded') {
        // Remove the direct "Mark as Delivered" option - only allow upload with photos
        actions.push({ 
          key: 'upload-delivery', 
          label: 'Upload Delivery Photos & Mark Delivered', 
          color: 'bg-purple-600 hover:bg-purple-700',
          bengali: 'সরবরাহের ছবি আপলোড ও সম্পন্ন করুন'
        })
      }
    }

    // Buyer actions
    if (userRole === 'buyer') {
      if (status === 'accepted') {
        actions.push({ 
          key: 'fund', 
          label: 'Make Payment to Escrow', 
          color: 'bg-indigo-600 hover:bg-indigo-700',
          bengali: 'এসক্রোতে পেমেন্ট করুন'
        })
      }
      if (status === 'delivered') {
        actions.push({ 
          key: 'complete', 
          label: 'Complete Transaction', 
          color: 'bg-green-600 hover:bg-green-700',
          bengali: 'লেনদেন সম্পন্ন করুন'
        })
      }
    }

    // Common actions
    if (['pending', 'accepted'].includes(status)) {
      actions.push({ 
        key: 'cancel', 
        label: 'Cancel Transaction', 
        color: 'bg-gray-600 hover:bg-gray-700',
        bengali: 'লেনদেন বাতিল করুন'
      })
    }

    if (['funded', 'delivered'].includes(status)) {
      actions.push({ 
        key: 'dispute', 
        label: 'File Dispute', 
        color: 'bg-red-600 hover:bg-red-700',
        bengali: 'বিরোধ দায়ের করুন'
      })
    }

    return actions
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction...</p>
        </div>
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/transactions"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transactions
          </Link>
        </div>
      </div>
    )
  }

  if (!transaction) return null

  const statusInfo = getStatusInfo(transaction.status)
  const StatusIcon = statusInfo.icon
  const availableActions = getAvailableActions()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/transactions" className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
                <p className="bengali text-sm text-gray-500">লেনদেনের বিবরণ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={loadTransaction}
                className="p-2 text-gray-500 hover:text-gray-700 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusInfo.text}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Transaction Information</h2>
                <span className="text-sm text-gray-500 font-mono">{transaction.transactionId}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-lg font-medium text-gray-900">{transaction.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                  <div className="text-lg font-bold text-gray-900">
                    ৳{transaction.amount.toLocaleString()}
                    {/* Show different fee information based on user role */}
                    {transaction.userRole === 'buyer' ? (
                      // Buyer's view
                      <>
                        {transaction.serviceChargePaymentOption === 'BUYER_PAYS' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            + ৳{(transaction.serviceFee || (transaction.amount * 0.02)).toLocaleString()} fee (2%)
                          </span>
                        )}
                        {transaction.serviceChargePaymentOption === 'SPLIT' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            + ৳{Math.round((transaction.serviceFee || (transaction.amount * 0.02)) / 2).toLocaleString()} fee (1%)
                          </span>
                        )}
                        {transaction.serviceChargePaymentOption === 'SELLER_PAYS' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            (seller pays 2% fee)
                          </span>
                        )}
                      </>
                    ) : (
                      // Seller's view
                      <>
                        {transaction.serviceChargePaymentOption === 'BUYER_PAYS' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            (buyer pays 2% fee)
                          </span>
                        )}
                        {transaction.serviceChargePaymentOption === 'SPLIT' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            - ৳{Math.round((transaction.serviceFee || (transaction.amount * 0.02)) / 2).toLocaleString()} fee (1%)
                          </span>
                        )}
                        {transaction.serviceChargePaymentOption === 'SELLER_PAYS' && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            - ৳{(transaction.serviceFee || (transaction.amount * 0.02)).toLocaleString()} fee (2%)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {transaction.userRole === 'buyer' ? (
                      `Total: ৳${(transaction.totalAmount || (transaction.amount + (transaction.amount * 0.02))).toLocaleString()}`
                    ) : (
                      `You receive: ৳${
                        transaction.serviceChargePaymentOption === 'BUYER_PAYS' ? 
                          transaction.amount.toLocaleString() :
                          transaction.serviceChargePaymentOption === 'SPLIT' ?
                          Math.round(transaction.amount - (transaction.serviceFee || (transaction.amount * 0.02)) / 2).toLocaleString() :
                          Math.round(transaction.amount - (transaction.serviceFee || (transaction.amount * 0.02))).toLocaleString()
                      }`
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Service charge: {transaction.userRole === 'buyer' ? (
                      transaction.serviceChargePaymentOption === 'BUYER_PAYS' ? 'You pay full service charge' : 
                      transaction.serviceChargePaymentOption === 'SPLIT' ? 'You and seller split service charge' : 
                      'Seller pays service charge'
                    ) : (
                      transaction.serviceChargePaymentOption === 'BUYER_PAYS' ? 'Buyer pays service charge' : 
                      transaction.serviceChargePaymentOption === 'SPLIT' ? 'You and buyer split service charge' : 
                      'You pay service charge'
                    )}
                  </p>
                </div>

                {transaction.dueDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                    <p className="text-gray-900">{new Date(transaction.dueDate).toLocaleDateString()}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Payment Method</label>
                  <p className="text-gray-900 capitalize">{transaction.paymentMethod}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</p>
                </div>

                {transaction.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Completed</label>
                    <p className="text-gray-900">{new Date(transaction.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {transaction.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{transaction.notes}</p>
                </div>
              )}
            </div>

            {/* Parties Involved */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Parties Involved</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buyer */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {transaction.buyer?.fullName?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Buyer (Paying)</h4>
                      <p className="bengali text-xs text-blue-700">ক্রেতা</p>
                    </div>
                    {transaction.userRole === 'buyer' && (
                      <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded">You</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{transaction.buyer?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{transaction.buyer?.email || 'No email'}</p>
                </div>

                {/* Seller */}
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {transaction.seller?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Seller (Receiving)</h4>
                      <p className="bengali text-xs text-green-700">বিক্রেতা</p>
                    </div>
                    {transaction.userRole === 'seller' && (
                      <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded">You</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{transaction.seller?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{transaction.seller?.email || 'No email'}</p>
                </div>
              </div>
            </div>

            {/* Delivery Proof */}
            {transaction.deliveryProof && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Proof</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Uploaded by seller:</p>
                  <p className="text-gray-900">{transaction.deliveryProof}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Actions
                <span className="bengali text-sm text-gray-500 ml-2">কার্যক্রম</span>
              </h3>

              {/* Chat Button */}
              <button
                onClick={openChat}
                className="w-full flex items-center justify-center px-4 py-3 text-emerald-600 bg-emerald-50 font-medium rounded-lg hover:bg-emerald-100 transition mb-4"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with {transaction.userRole === 'buyer' ? 'Seller' : 'Buyer'}
              </button>

              {/* Available Actions */}
              <div className="space-y-3">
                {availableActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => {
                      if (action.key === 'cancel') {
                        setShowCancelForm(true)
                      } else if (action.key === 'dispute') {
                        setShowDisputeForm(true)
                      } else if (action.key === 'upload-delivery') {
                        router.push(`/transactions/${transaction!.id}/delivery`);
                      } else {
                        handleStatusUpdate(action.key)
                      }
                    }}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-center px-4 py-3 text-white font-medium rounded-lg transition disabled:opacity-50 ${action.color}`}
                  >
                    {isUpdating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : null}
                    {action.label}
                  </button>
                ))}

                {availableActions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <StatusIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No actions available</p>
                    <p className="text-sm">
                      {transaction.status === 'completed' && 'Transaction is complete'}
                      {transaction.status === 'cancelled' && 'Transaction was cancelled'}
                      {transaction.status === 'disputed' && 'Awaiting admin resolution'}
                    </p>
                  </div>
                )}
              </div>

              {/* Cancel Form */}
              {showCancelForm && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-3">Cancel Transaction</h4>
                  <textarea
                    placeholder="Reason for cancellation..."
                    className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="flex items-center space-x-3 mt-3">
                    <button
                      onClick={() => handleStatusUpdate('cancel', { reason: cancelReason })}
                      disabled={isUpdating || !cancelReason.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelForm(false)
                        setCancelReason('')
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Dispute Form */}
              {showDisputeForm && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-3">File Dispute</h4>
                  <textarea
                    placeholder="Detailed reason for dispute (minimum 10 characters)..."
                    className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm"
                    rows={4}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  <div className="flex items-center space-x-3 mt-3">
                    <button
                      onClick={() => handleStatusUpdate('dispute', { reason: disputeReason })}
                      disabled={isUpdating || disputeReason.trim().length < 10}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                    >
                      File Dispute
                    </button>
                    <button
                      onClick={() => {
                        setShowDisputeForm(false)
                        setDisputeReason('')
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction Timeline */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Transaction Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                    <span className="text-gray-500">Created: {new Date(transaction.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      ['accepted', 'funded', 'delivered', 'completed'].includes(transaction.status) 
                        ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className={
                      ['accepted', 'funded', 'delivered', 'completed'].includes(transaction.status)
                        ? 'text-gray-900' : 'text-gray-400'
                    }>
                      {['accepted', 'funded', 'delivered', 'completed'].includes(transaction.status) 
                        ? 'Accepted' : 'Pending acceptance'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      ['funded', 'delivered', 'completed'].includes(transaction.status) 
                        ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className={
                      ['funded', 'delivered', 'completed'].includes(transaction.status)
                        ? 'text-gray-900' : 'text-gray-400'
                    }>
                      {['funded', 'delivered', 'completed'].includes(transaction.status) 
                        ? 'Funded' : 'Awaiting payment'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      ['delivered', 'completed'].includes(transaction.status) 
                        ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className={
                      ['delivered', 'completed'].includes(transaction.status)
                        ? 'text-gray-900' : 'text-gray-400'
                    }>
                      {['delivered', 'completed'].includes(transaction.status) 
                        ? 'Delivered' : 'Awaiting delivery'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      transaction.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className={
                      transaction.status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                    }>
                      {transaction.status === 'completed' ? 'Completed' : 'Awaiting completion'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Photos */}
            {['funded', 'delivered', 'completed'].includes(transaction.status) && (
              <div className="mt-6">
                <DeliveryPhotos transactionId={transaction.transactionId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <TransactionChat
        transactionId={transaction.transactionId}
        isOpen={chatOpen}
        onClose={closeChat}
        counterpartyName={
          transaction.userRole === 'buyer' 
            ? transaction.seller?.fullName || 'Seller'
            : transaction.buyer?.fullName || 'Buyer'
        }
      />
    </div>
  )
} 