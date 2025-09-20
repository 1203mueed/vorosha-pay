'use client'

import { useState } from 'react'
import { X, Shield, CreditCard, AlertTriangle, Check } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: any;
  selectedMethod: string;
  isProcessing: boolean;
}

const PAYMENT_METHODS: { [key: string]: any } = {
  bkash: { name: 'bKash', icon: '📱', color: 'bg-pink-500' },
  nagad: { name: 'Nagad', icon: '💳', color: 'bg-orange-500' },
  rocket: { name: 'Rocket', icon: '🚀', color: 'bg-purple-500' },
  bank: { name: 'Bank Transfer', icon: '🏦', color: 'bg-blue-500' },
  mock: { name: 'Mock Payment', icon: '🎭', color: 'bg-gray-500' }
};

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transaction, 
  selectedMethod, 
  isProcessing 
}: PaymentModalProps) {
  const [agreed, setAgreed] = useState(false)

  if (!isOpen) return null

  const method = PAYMENT_METHODS[selectedMethod]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-3">{method?.icon}</span>
            <div>
              <div className="font-medium text-gray-900">{method?.name}</div>
              <div className="text-sm text-gray-500">Mock payment for demo</div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">৳{transaction?.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Fee:</span>
              <span className="font-medium">৳{transaction?.serviceFee?.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-emerald-600">৳{transaction?.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-800 mb-1">Secure Escrow Payment</h4>
              <p className="text-sm text-emerald-700">
                Your money will be held securely until you confirm delivery. 
                The seller cannot access the funds until you approve.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Demo Payment</h4>
              <p className="text-sm text-yellow-700">
                This is a demonstration. No real money will be charged. 
                The system simulates payment processing for testing purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="flex items-start mb-6">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isProcessing}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1 mr-3"
          />
          <label htmlFor="agree" className="text-sm text-gray-700">
            I understand this is a demo payment and agree to proceed with the mock transaction.
            <span className="bengali block text-xs text-gray-500 mt-1">
              আমি বুঝতে পারছি এটি একটি ডেমো পেমেন্ট
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onConfirm}
            disabled={!agreed || isProcessing}
            className="flex-1 bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Confirm Payment
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
} 