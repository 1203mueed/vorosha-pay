'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  User, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { transactionAPI, tokenUtils } from '../../../lib/api'
import { useToast } from '../../../contexts/ToastContext'
import { useVerification } from '../../../contexts/VerificationContext'

export default function CreateTransactionPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { showVerificationModal, isFullyVerified } = useVerification()
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    counterpartyEmail: '',
    dueDate: '',
    notes: '',
    serviceChargePaymentOption: 'BUYER_PAYS'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  // Check authentication and verification
  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      router.push('/auth/login')
      return
    }
    
    const userData = tokenUtils.getUser()
    setUser(userData)
    
    // Check if user is fully verified
    if (!isFullyVerified) {
      showVerificationModal()
      router.push('/dashboard')
      return
    }
  }, [router, isFullyVerified, showVerificationModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const transactionData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        counterpartyEmail: formData.counterpartyEmail,
        // allow date-only string for backend; send empty string if not provided
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
        serviceChargePaymentOption: formData.serviceChargePaymentOption
      }

      const res = await transactionAPI.createTransaction(transactionData)
      // Accept both wrapped and unwrapped shapes
      const success = !!(res?.success ?? true)
      const tx = res?.data?.transaction ?? res?.transaction ?? res?.data ?? res

      if (success && tx && (tx.id || tx.transactionId)) {
        localStorage.setItem('newTransactionId', String(tx.id ?? tx.transactionId))
        showToast('success', 'Transaction created successfully! The counterparty will be notified.')
        setStep(3)
      } else {
        setError(res?.message || 'Failed to create transaction')
      }
    } catch (error: any) {
      console.error('Create transaction error:', error)
      
      // Check if it's a verification error
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create transaction. Please try again.'
      const errorData = error.response?.data
      
      if (errorMessage.includes('VERIFICATION_REQUIRED') || 
          (errorData && errorData.message && errorData.message.includes('VERIFICATION_REQUIRED'))) {
        showVerificationModal()
        setError('Verification required to create transactions')
        return // Don't proceed to next step
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validateStep1 = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      return false
    }
    if (!formData.description.trim()) {
      setError('Please enter a transaction description')
      return false
    }
    if (!formData.counterpartyEmail.trim()) {
      setError('Please enter the counterparty email')
      return false
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.counterpartyEmail)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      return
    }
    setError('') // Clear any previous errors
    if (step < 2) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setError('') // Clear any previous errors
      setStep(step - 1)
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Created!</h1>
          <p className="bengali text-sm text-gray-600 mb-6">লেনদেন সফলভাবে তৈরি হয়েছে</p>
          <p className="text-gray-600 mb-8">
            Your escrow transaction has been created successfully. The counterparty will receive a notification to accept the transaction.
          </p>
          <div className="space-y-3">
            <Link 
              href="/dashboard" 
              className="block w-full bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium py-3 px-4 rounded-lg hover:shadow-lg transition"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/transactions" 
              className="block w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition"
            >
              View All Transactions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-gramm="false" data-gramm_editor="false">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Transaction</h1>
                <p className="bengali text-sm text-gray-500">নতুন লেনদেন তৈরি করুন</p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Details</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${step >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {step === 1 && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction Details</h2>
                <p className="text-gray-600">Enter the details for your escrow transaction</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Amount
                    <span className="bengali text-gray-500 ml-2">লেনদেনের পরিমাণ</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Enter amount in BDT"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      spellCheck={false}
                      data-gramm="false"
                      data-gramm_editor="false"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">৳</span>
                  </div>
                </div>

                {/* Service Charge Payment Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Charge Payment
                    <span className="bengali text-gray-500 ml-2">সেবা চার্জ প্রদান</span>
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="buyer-pays"
                        name="serviceChargePaymentOption"
                        value="BUYER_PAYS"
                        checked={formData.serviceChargePaymentOption === 'BUYER_PAYS'}
                        onChange={(e) => setFormData({...formData, serviceChargePaymentOption: e.target.value})}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="buyer-pays" className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Buyer pays service charge</span>
                        <span className="block text-xs text-gray-500">
                          You pay ৳{Math.round(parseInt(formData.amount || '0') * 0.02).toLocaleString()} (2%) service fee
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="split"
                        name="serviceChargePaymentOption"
                        value="SPLIT"
                        checked={formData.serviceChargePaymentOption === 'SPLIT'}
                        onChange={(e) => setFormData({...formData, serviceChargePaymentOption: e.target.value})}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="split" className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Split service charge</span>
                        <span className="block text-xs text-gray-500">
                          You pay ৳{Math.round(parseInt(formData.amount || '0') * 0.01).toLocaleString()} (1%), seller pays ৳{Math.round(parseInt(formData.amount || '0') * 0.01).toLocaleString()} (1%)
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="seller-pays"
                        name="serviceChargePaymentOption"
                        value="SELLER_PAYS"
                        checked={formData.serviceChargePaymentOption === 'SELLER_PAYS'}
                        onChange={(e) => setFormData({...formData, serviceChargePaymentOption: e.target.value})}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="seller-pays" className="ml-3 text-sm text-gray-700">
                        <span className="font-medium">Seller pays service charge</span>
                        <span className="block text-xs text-gray-500">
                          Seller pays ৳{Math.round(parseInt(formData.amount || '0') * 0.02).toLocaleString()} (2%) service fee
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                    <span className="bengali text-gray-500 ml-2">বিবরণ</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      required
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Describe what this transaction is for"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      spellCheck={false}
                      data-gramm="false"
                      data-gramm_editor="false"
                    />
                  </div>
                </div>

                {/* Counterparty Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counterparty Email
                    <span className="bengali text-gray-500 ml-2">প্রতিপক্ষের ইমেইল</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Enter counterparty's email"
                      value={formData.counterpartyEmail}
                      onChange={(e) => setFormData({...formData, counterpartyEmail: e.target.value})}
                      autoComplete="off"
                      spellCheck={false}
                      data-gramm="false"
                      data-gramm_editor="false"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The other party will receive a notification to accept this transaction
                  </p>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Completion Date
                    <span className="bengali text-gray-500 ml-2">প্রত্যাশিত সমাপ্তির তারিখ</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      spellCheck={false}
                      data-gramm="false"
                      data-gramm_editor="false"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                    <span className="bengali text-gray-500 ml-2">অতিরিক্ত নোট</span>
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Any additional information or terms"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    spellCheck={false}
                    data-gramm="false"
                    data-gramm_editor="false"
                  />
                </div>

                {/* Security Notice */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-emerald-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-emerald-800 mb-1">Escrow Protection</h3>
                      <p className="text-sm text-emerald-700">
                        Your payment will be held securely in escrow until both parties confirm the transaction is complete.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium rounded-lg hover:shadow-lg transition"
                  >
                    Continue to Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Review Transaction</h2>
                <p className="text-gray-600">Please review the details before creating the transaction</p>
              </div>

              <div className="space-y-6">
                {/* Transaction Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Transaction Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-900">৳{parseInt(formData.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span className="font-medium text-gray-900">{formData.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Counterparty:</span>
                      <span className="font-medium text-gray-900">{formData.counterpartyEmail}</span>
                    </div>
                    {formData.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium text-gray-900">{new Date(formData.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fees */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Fee Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction Amount:</span>
                      <span className="text-gray-900">৳{parseInt(formData.amount).toLocaleString()}</span>
                    </div>
                    
                    {/* Service Fee based on payment option */}
                    {formData.serviceChargePaymentOption === 'BUYER_PAYS' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee (2%):</span>
                      <span className="text-gray-900">৳{Math.round(parseInt(formData.amount) * 0.02).toLocaleString()}</span>
                    </div>
                    )}
                    
                    {formData.serviceChargePaymentOption === 'SPLIT' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your Service Fee (1%):</span>
                          <span className="text-gray-900">৳{Math.round(parseInt(formData.amount) * 0.01).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seller's Service Fee (1%):</span>
                          <span className="text-gray-900">৳{Math.round(parseInt(formData.amount) * 0.01).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    
                    {formData.serviceChargePaymentOption === 'SELLER_PAYS' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee (2% - paid by seller):</span>
                        <span className="text-gray-500">৳{Math.round(parseInt(formData.amount) * 0.02).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-3 flex justify-between font-bold">
                      <span className="text-gray-900">You Pay:</span>
                      <span className="text-gray-900">
                        ৳{formData.serviceChargePaymentOption === 'BUYER_PAYS' ? 
                          Math.round(parseInt(formData.amount) * 1.02).toLocaleString() :
                          formData.serviceChargePaymentOption === 'SPLIT' ?
                          Math.round(parseInt(formData.amount) * 1.01).toLocaleString() :
                          parseInt(formData.amount).toLocaleString()
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Seller Receives:</span>
                      <span>
                        ৳{formData.serviceChargePaymentOption === 'BUYER_PAYS' ? 
                          parseInt(formData.amount).toLocaleString() :
                          formData.serviceChargePaymentOption === 'SPLIT' ?
                          Math.round(parseInt(formData.amount) * 0.99).toLocaleString() :
                          Math.round(parseInt(formData.amount) * 0.98).toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-1">Important Notice</h3>
                      <p className="text-sm text-yellow-700">
                        Once created, this transaction cannot be cancelled without mutual agreement. The counterparty will need to accept this transaction before it becomes active.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : null}
                    Create Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 