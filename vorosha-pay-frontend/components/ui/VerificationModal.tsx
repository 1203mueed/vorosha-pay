'use client'

import { useRouter } from 'next/navigation'
import { X, Shield, AlertCircle } from 'lucide-react'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onVerificationComplete?: () => void
}

export default function VerificationModal({ isOpen, onClose, user, onVerificationComplete }: VerificationModalProps) {
  const router = useRouter()

  // Don't show modal if user is fully verified
  if (!user || (user.isPhoneVerified && user.isNIDVerified)) {
    return null
  }

  if (!isOpen) return null

  const handleGoToProfile = () => {
    onClose()
    router.push('/profile')
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-emerald-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Complete Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Verification Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Verification Required</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Complete both phone and NID verification to access all platform features including transactions.
            </p>
          </div>

          {/* Verification Message */}
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Required</h3>
            <p className="text-gray-600 mb-6">
              To ensure security and compliance, please complete your verification in your profile settings.
            </p>
            
            <div className="space-y-3">
              {!user?.isPhoneVerified && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Phone verification required
                </div>
              )}
              {!user?.isNIDVerified && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  NID verification required
                </div>
              )}
            </div>

            <button
              onClick={handleGoToProfile}
              className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Go to Profile Settings
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span>Complete verification to access all features</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
