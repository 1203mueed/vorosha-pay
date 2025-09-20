'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, AlertTriangle, CheckCircle, XCircle, Smartphone, DollarSign } from 'lucide-react'
import { bkashAPI } from '../../lib/api'

interface BkashPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentResult: any) => void;
  transaction: any;
}

export default function BkashPayment({ isOpen, onClose, onPaymentComplete, transaction }: BkashPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  
  // Authorization Form
  const [customerMsisdn, setCustomerMsisdn] = useState('')
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Calculate amounts based on service charge payment option
  const baseAmount = transaction?.amount || 0
  const serviceFee = Math.round(baseAmount * 0.02) // 2% service fee
  const serviceChargePaymentOption = transaction?.serviceChargePaymentOption || 'BUYER_PAYS'
  
  let totalAmount, buyerPays, sellerGets
  
  switch (serviceChargePaymentOption) {
    case 'BUYER_PAYS':
      buyerPays = baseAmount + serviceFee
      sellerGets = baseAmount
      totalAmount = buyerPays
      break
    case 'SPLIT':
      buyerPays = baseAmount + (serviceFee / 2)
      sellerGets = baseAmount - (serviceFee / 2)
      totalAmount = buyerPays
      break
    case 'SELLER_PAYS':
      buyerPays = baseAmount
      sellerGets = baseAmount - serviceFee
      totalAmount = buyerPays
      break
    default:
      buyerPays = baseAmount + serviceFee
      sellerGets = baseAmount
      totalAmount = buyerPays
  }

  if (!isOpen) return null

  const handlePayment = async () => {
    if (!customerMsisdn) {
      setError('Please enter your bKash phone number.')
      return
    }

    // Validate phone number format
    const phoneRegex = /^01[3-9]\d{8}$/
    if (!phoneRegex.test(customerMsisdn)) {
      setError('Please enter a valid Bangladeshi phone number (01XXXXXXXXX)')
      return
    }

    setIsLoading(true)
    setPaymentStep('processing')
    setError('')
    setSuccess('')
    
    try {
      // Step 1: Auto grant token in backend
      console.log('Requesting access token...')
      const tokenResponse = await bkashAPI.grantToken()
      
      if (!tokenResponse.data?.success) {
        throw new Error('Failed to obtain access token')
      }

      const idToken = tokenResponse.data.data.id_token

      // Step 2: Create payment authorization
      console.log('Creating payment authorization...')
      const paymentData = {
        idToken,
        amount: totalAmount.toString(),
        customerMsisdn: customerMsisdn,
        merchantInvoiceNumber: `INV-${transaction.id}-${Date.now()}`,
        transactionId: transaction.id
      }
      
      const paymentResponse = await bkashAPI.createPayment(paymentData)
      
      if (!paymentResponse.data?.success) {
        throw new Error(paymentResponse.data?.message || 'Payment authorization failed')
      }

      const result = paymentResponse.data.data
      setPaymentResult(result)
      
      // Check if authorization was successful
      if (result.statusCode === '0000') {
        setPaymentStep('success')
        setSuccess(`Payment authorized successfully! Amount ৳${totalAmount} has been frozen.`)
        
        // Call parent callback after short delay
        setTimeout(() => {
          onPaymentComplete({
            paymentId: result.paymentID,
            trxId: result.trxID,
            amount: totalAmount,
            customerMsisdn: customerMsisdn,
            status: 'authorized'
          })
        }, 2000)
      } else {
        throw new Error(result.statusMessage || 'Payment authorization failed')
      }
      
    } catch (err: any) {
      console.error('Payment error:', err)
      setPaymentStep('error')
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (paymentStep === 'success') {
      onClose()
    } else if (paymentStep !== 'processing') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-pink-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pay with bKash</h3>
              <p className="text-sm text-gray-600">Secure payment authorization</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={paymentStep === 'processing'}
            className="p-2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Amount:</span>
                <span className="font-medium">৳{baseAmount.toLocaleString()}</span>
              </div>
              
              {/* Service Fee Breakdown */}
              {serviceChargePaymentOption === 'BUYER_PAYS' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee (2%):</span>
                  <span className="font-medium">৳{serviceFee.toLocaleString()}</span>
                </div>
              )}
              
              {serviceChargePaymentOption === 'SPLIT' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Service Fee (1%):</span>
                    <span className="font-medium">৳{Math.round(serviceFee / 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller's Service Fee (1%):</span>
                    <span className="font-medium">৳{Math.round(serviceFee / 2).toLocaleString()}</span>
                  </div>
                </>
              )}
              
              {serviceChargePaymentOption === 'SELLER_PAYS' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee (2% - paid by seller):</span>
                  <span className="font-medium text-gray-500">৳{serviceFee.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span>You Pay:</span>
                <span className="text-pink-600">৳{buyerPays.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Seller Receives:</span>
                <span>৳{sellerGets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Payment Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Payment Authorized</h4>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {paymentStep === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your bKash Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerMsisdn}
                    onChange={(e) => setCustomerMsisdn(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the phone number registered with your bKash account
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={isLoading || !customerMsisdn}
                className="w-full bg-pink-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 flex items-center justify-center"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Pay ৳{totalAmount.toLocaleString()}
              </button>
            </div>
          )}

          {/* Processing State */}
          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h4 className="font-medium text-gray-900 mb-2">Processing Payment</h4>
              <p className="text-sm text-gray-600">
                Please wait while we authorize your payment with bKash...
              </p>
            </div>
          )}

          {/* Success State */}
          {paymentStep === 'success' && paymentResult && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Authorized!</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your payment has been authorized and the amount has been frozen.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <div className="text-sm space-y-1">
                  <p><strong>Payment ID:</strong> {paymentResult.paymentID}</p>
                  <p><strong>Amount Frozen:</strong> ৳{totalAmount.toLocaleString()}</p>
                  <p><strong>Status:</strong> Authorized</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {paymentStep === 'error' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Failed</h4>
              <p className="text-sm text-gray-600 mb-4">
                We couldn't process your payment. Please try again.
              </p>
              <button
                onClick={() => {
                  setPaymentStep('form')
                  setError('')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Footer Note */}
          {paymentStep === 'form' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Important:</p>
                  <p className="text-yellow-700">
                    This amount will be frozen but not transferred until the seller delivers the product/service. 
                    You'll receive notifications about the payment status.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 