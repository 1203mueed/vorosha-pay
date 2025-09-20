'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Shield, 
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { tokenUtils, transactionAPI } from '../../../../lib/api'
import BkashPayment from '../../../../components/ui/BkashPayment'

interface PaymentMethod {
  key: string;
  name: string;
  backgroundUrl: string;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    key: 'bkash',
    name: 'bKash',
    backgroundUrl: '/assets/bkash_logo.png'
  },
  {
    key: 'nagad',
    name: 'Nagad',
    backgroundUrl: '/assets/nagad_logo.png'
  },
  {
    key: 'bank',
    name: 'Bank',
    backgroundUrl: '/assets/bank_logo.png'
  },
  {
    key: 'sslcommerz',
    name: 'SSLCommerz',
    backgroundUrl: '/assets/sslcommerz_logo.png'
  }
];

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('bkash')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
  const [bkashModalOpen, setBkashModalOpen] = useState(false)

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
        const txn = response.data.transaction
        
        // Check if user is the buyer
        if (txn.userRole !== 'buyer') {
          setError('Only the buyer can make payment for this transaction')
          return
        }

        // Check if transaction is in correct status
        if (txn.status !== 'accepted') {
          setError(`Transaction must be accepted before payment. Current status: ${txn.status}`)
          return
        }

        setTransaction(txn)
      } else {
        setError(response.message || 'Transaction not found')
      }
    } catch (error: any) {
      console.error('Error loading transaction:', error)
      setError(error.response?.data?.message || 'Failed to load transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!transaction || !selectedMethod) return

    // Enable bKash payment
    if (selectedMethod === 'bkash') {
      setBkashModalOpen(true)
      return
    }

    // Other payment methods are placeholders in demo phase
    setError('Payment methods other than bKash are currently in development. This is a demo interface.')
    return
  }

  const handleBkashPaymentComplete = async (paymentResult: any) => {
    try {
      setBkashModalOpen(false)
      
      // Fund the transaction with bKash payment method
      const fundResponse = await transactionAPI.fundTransaction(transaction.id, 'bkash')
      
      if (fundResponse.success) {
        setPaymentStatus('completed')
        setSuccess(`Payment authorized successfully! ৳${paymentResult.amount} has been frozen for transaction ${transaction.transactionId}. The money will be auto-captured after buyer confirms transaction completion.`)
        
        // Redirect to transaction details after 3 seconds
        setTimeout(() => {
          router.push(`/transactions/${transaction.id}`)
        }, 3000)
      } else {
        setError('Payment was authorized but failed to update transaction status. Please contact support.')
      }
      
    } catch (error) {
      console.error('Error handling payment completion:', error)
      setError('Payment was authorized but there was an error updating the transaction status.')
    }
  }

  const resetPayment = () => {
    setPaymentStatus('idle')
    setError('')
    setSuccess('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment page...</p>
        </div>
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href={`/transactions/${params.id}`}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transaction
          </Link>
        </div>
      </div>
    )
  }

  if (!transaction) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Link href={`/transactions/${transaction.id}`} className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
              <p className="bengali text-sm text-gray-500">পেমেন্ট</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">Processing Payment...</h3>
            <p className="text-blue-700">Please wait while we process your payment securely.</p>
            <p className="bengali text-sm text-blue-600 mt-1">অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        )}

        {paymentStatus === 'completed' && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-900 mb-2">Payment Successful!</h3>
            <p className="text-green-700">{success}</p>
            <p className="bengali text-sm text-green-600 mt-1">পেমেন্ট সফল হয়েছে!</p>
            <p className="text-sm text-green-600 mt-2">Redirecting to transaction details...</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <X className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">Payment Failed</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={resetPayment}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Select Payment Method
                <span className="bengali text-sm text-gray-500 ml-2">পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
              </h2>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {MOCK_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setSelectedMethod(method.key)}
                    disabled={paymentStatus === 'processing' || (method.key !== 'bkash' && method.key !== 'mock')}
                                          className={`p-4 border-2 rounded-xl transition ${
                        (method.key !== 'bkash' && method.key !== 'mock') ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'disabled:opacity-50'
                      } ${
                      selectedMethod === method.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <div
                        className="mr-4 h-10 w-10 rounded bg-center bg-contain bg-no-repeat"
                        style={{ backgroundImage: `url(${method.backgroundUrl})` }}
                      />
                      <div className="text-left">
                        <div className={`font-medium ${(method.key !== 'bkash' && method.key !== 'mock') ? 'text-gray-500' : 'text-gray-900'}`}>
                          {method.name}
                        </div>
                      </div>
                      {selectedMethod === method.key && (
                        <Check className="w-5 h-5 text-emerald-600 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment System Notice - removed */}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing || paymentStatus === 'processing' || paymentStatus === 'completed'}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Processing Payment...
                  </>
                ) : paymentStatus === 'completed' ? (
                  <>
                    <Check className="w-6 h-6 mr-3" />
                    Payment Completed
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6 mr-3" />
                    Pay ৳{transaction.totalAmount?.toLocaleString()} Securely
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-3">
                🔒 Your payment is protected by our secure escrow system
              </p>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Payment Summary
                <span className="bengali text-sm text-gray-500 ml-2">পেমেন্ট সারসংক্ষেপ</span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm text-gray-900">{transaction.transactionId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="text-gray-900 text-right">{transaction.description}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <span className="text-gray-900">{transaction.seller?.fullName}</span>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between">
                  <span className="text-gray-600">Item Amount:</span>
                  <span className="text-gray-900">৳{transaction.amount?.toLocaleString()}</span>
                </div>

                {/* Service Fee Display based on payment option */}
                {transaction.serviceChargePaymentOption === 'BUYER_PAYS' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee (2%):</span>
                    <span className="text-gray-900">৳{transaction.serviceFee?.toLocaleString()}</span>
                  </div>
                )}
                
                {transaction.serviceChargePaymentOption === 'SPLIT' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Service Fee (1%):</span>
                      <span className="text-gray-900">৳{Math.round((transaction.serviceFee || 0) / 2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seller's Service Fee (1%):</span>
                      <span className="text-gray-900">৳{Math.round((transaction.serviceFee || 0) / 2).toLocaleString()}</span>
                    </div>
                  </>
                )}
                
                {transaction.serviceChargePaymentOption === 'SELLER_PAYS' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee (2% - paid by seller):</span>
                    <span className="text-gray-500">৳{transaction.serviceFee?.toLocaleString()}</span>
                  </div>
                )}

                <hr className="border-gray-200" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">You Pay:</span>
                  <span className="text-emerald-600">৳{transaction.totalAmount?.toLocaleString()}</span>
                </div>
                
                {/* Show seller receives amount */}
                {transaction.serviceChargePaymentOption === 'SPLIT' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Seller Receives:</span>
                    <span>৳{Math.round((transaction.amount || 0) - (transaction.serviceFee || 0) / 2).toLocaleString()}</span>
                  </div>
                )}
                
                {transaction.serviceChargePaymentOption === 'SELLER_PAYS' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Seller Receives:</span>
                    <span>৳{Math.round((transaction.amount || 0) - (transaction.serviceFee || 0)).toLocaleString()}</span>
                  </div>
                )}
                
                {transaction.serviceChargePaymentOption === 'BUYER_PAYS' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Seller Receives:</span>
                    <span>৳{transaction.amount?.toLocaleString()}</span>
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-800 mb-1">Escrow Protection</h4>
                      <p className="text-sm text-emerald-700">
                        Your payment will be held securely until the seller delivers and you confirm receipt.
                      </p>
                      <p className="bengali text-xs text-emerald-600 mt-1">
                        আপনার অর্থ নিরাপদে সংরক্ষিত থাকবে
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Payment Method */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Method</h4>
                  <div className="flex items-center">
                    <div
                      className="mr-3 h-8 w-8 rounded bg-center bg-contain bg-no-repeat"
                      style={{ backgroundImage: `url(${MOCK_PAYMENT_METHODS.find(m => m.key === selectedMethod)?.backgroundUrl || ''})` }}
                    />
                    <div className="font-medium text-gray-900">
                      {MOCK_PAYMENT_METHODS.find(m => m.key === selectedMethod)?.name}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">What happens next?</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">Payment processed & funds secured</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-gray-500">Seller delivers the item</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-gray-500">You confirm delivery</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-gray-500">Payment released to seller</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bKash Payment Modal */}
      {transaction && (
        <BkashPayment
          isOpen={bkashModalOpen}
          onClose={() => setBkashModalOpen(false)}
          transaction={transaction}
          onPaymentComplete={handleBkashPaymentComplete}
        />
      )}
    </div>
  )
} 