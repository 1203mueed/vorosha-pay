'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react'
import { tokenUtils, userAPI, authAPI } from '../../lib/api'
import { useVerification } from '../../contexts/VerificationContext'
import NIDVerification from '../../components/ui/NIDVerification'

// Ensure UI-friendly verification flags exist
const normalizeUser = (u: any) => {
  const isPhoneVerified = Boolean(u?.isPhoneVerified);
  const isNIDVerified = Boolean(u?.isNIDVerified);
  return {
    ...u,
    isPhoneVerified,
    isNIDVerified,
    isFullyVerified: isPhoneVerified && isNIDVerified,
  };
}

export default function ProfilePage() {
  const router = useRouter()
  const { refreshUser, user: contextUser } = useVerification()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  })
  
  const [verificationCode, setVerificationCode] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  
  // NID verification state
  const [nidInfo, setNidInfo] = useState<any>(null)
  const [nidFiles, setNidFiles] = useState({ front: null, back: null })
  const [nidPreviews, setNidPreviews] = useState({ front: '', back: '' })
  const [uploadingNID, setUploadingNID] = useState(false)

  const formatMemberSince = (iso?: string) => {
    try {
      if (!iso) return ''
      const d = new Date(iso)
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) return ''
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  const refreshNIDStatus = async () => {
    try {
      const nidResp = await userAPI.getNIDInfo?.()
      const ok = nidResp?.data?.success === true
      if (ok) {
        const info = nidResp?.data?.data?.nidInfo ?? nidResp?.data?.nidInfo ?? null
        setNidInfo(info)
        const isNIDVerified = info?.verificationStatus === 'verified'
        setUser((prev: any) => (prev ? normalizeUser({ ...prev, isNIDVerified }) : prev))
        return isNIDVerified
      }
    } catch (e) {
      // ignore transient errors
    }
    return false
  }

  // Load user profile + initial NID info
  useEffect(() => {
    const loadProfileAndNid = async () => {
      if (!tokenUtils.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await userAPI.getProfile()
        if (response.success) {
          const normalized = normalizeUser(response.data.user)
          setUser(normalized)
          setFormData({
            fullName: normalized.fullName,
            phone: normalized.phone || ''
          })
          tokenUtils.setUser(normalized)
        }
        await refreshNIDStatus()
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileAndNid()
  }, [router])

  // Update local user state when context user changes
  useEffect(() => {
    if (contextUser) {
      console.log('Context user updated:', contextUser)
      console.log('Phone verified status:', contextUser.isPhoneVerified)
      setUser(contextUser)
      setFormData({
        fullName: contextUser.fullName,
        phone: contextUser.phone || ''
      })
    }
  }, [contextUser])

  // Poll NID status after mount until verified (avoids manual page refresh)
  useEffect(() => {
    let timer: any
    const startPolling = async () => {
      // Only poll if not yet verified
      if (!user?.isNIDVerified) {
        timer = setInterval(async () => {
          const v = await refreshNIDStatus()
          if (v) {
            clearInterval(timer)
          }
        }, 4000)
      }
    }
    startPolling()
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [user?.isNIDVerified])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await userAPI.updateProfile(formData)
      
      if (response.success) {
        const normalized = normalizeUser(response.data.user)
        setUser(normalized)
        tokenUtils.setUser(normalized)
        setSuccess('Profile updated successfully')
        setIsEditing(false)
      } else {
        setError(response.message || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      setError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendVerification = async () => {
    if (!formData.phone) {
      setError('Please enter a phone number first')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await userAPI.sendPhoneVerification({ phone: formData.phone })
      
      if (response.success) {
        setSuccess('Verification code sent to your phone')
        setShowVerificationInput(true)
      } else {
        setError(response.message || 'Failed to send verification code')
      }
    } catch (error: any) {
      console.error('Send verification error:', error)
      setError(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!verificationCode) {
      setError('Please enter verification code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await userAPI.verifyPhone({ verificationCode })
      
      if (response.success) {
        console.log('Phone verification response:', response)
        const normalized = normalizeUser(response.data.user)
        console.log('Normalized user after verification:', normalized)
        setUser(normalized)
        tokenUtils.setUser(normalized)
        // Refresh the verification context to update global state
        try {
          await refreshUser()
        } catch (refreshError) {
          console.warn('Failed to refresh user context:', refreshError)
        }
        setSuccess('Phone number verified successfully')
        setShowVerificationInput(false)
        setVerificationCode('')
      } else {
        setError(response.message || 'Invalid verification code')
      }
    } catch (error: any) {
      console.error('Verify phone error:', error)
      setError(error.response?.data?.message || 'Invalid verification code')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      if (response.success) {
        setSuccess('Password changed successfully')
        setShowPasswordForm(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          showCurrent: false,
          showNew: false,
          showConfirm: false
        })
      } else {
        setError(response.message || 'Failed to change password')
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      setError(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      user: { text: 'New User', color: 'bg-gray-100 text-gray-800' },
      customer: { text: 'Customer', color: 'bg-blue-100 text-blue-800' },
      merchant: { text: 'Merchant', color: 'bg-green-100 text-green-800' },
      admin: { text: 'Admin', color: 'bg-purple-100 text-purple-800' }
    }
    return badges[role as keyof typeof badges] || badges.user
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    useEffect(() => {
      router.push('/auth/login')
    }, [router])
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
              <p className="bengali text-sm text-gray-500">প্রোফাইল ব্যবস্থাপনা</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
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
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user.fullName}</h2>
                <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                  {user.isFullyVerified ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                      <Check className="w-4 h-4 mr-1" />
                      Fully Verified
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Verification Incomplete
                    </div>
                  )}
                </div>
                
                {/* Detailed Verification Status */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Verification Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">Phone Number</span>
                      </div>
                      {user.isPhoneVerified ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Not Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">NID Verification</span>
                      </div>
                      {user.isNIDVerified ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Not Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!user.isFullyVerified && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center text-yellow-600 mb-2">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Action Required</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Complete both phone and NID verification to access all platform features including transactions.
                      </p>
                    </div>
                  )}
                  
                  <p className="bengali text-xs text-gray-500 mt-2 text-center">
                    {user.isFullyVerified ? 'সম্পূর্ণ যাচাইকৃত ব্যবহারকারী' : 'যাচাইকরণ সম্পূর্ণ করুন'}
                  </p>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  {formatMemberSince(user.createdAt) && (
                    <>Member since {formatMemberSince(user.createdAt)}</>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Personal Information
                  <span className="bengali text-sm text-gray-500 ml-2">ব্যক্তিগত তথ্য</span>
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                    <span className="bengali text-gray-500 ml-2">পূর্ণ নাম</span>
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg">{user.fullName}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                    <span className="bengali text-gray-500 ml-2">ইমেইল ঠিকানা</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
                      value={user.email}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                    <span className="bengali text-gray-500 ml-2">ফোন নম্বর</span>
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        placeholder="+880 1XXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg flex-1">
                        {user.phone || 'No phone number added'}
                      </p>
                      {user.phone && !user.isPhoneVerified && (
                        <button
                          onClick={handleSendVerification}
                          disabled={isVerifying}
                          className="ml-3 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50 text-sm"
                        >
                          {isVerifying ? 'Sending...' : 'Verify'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Verification */}
                {showVerificationInput && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">
                      Verify Phone Number
                      <span className="bengali text-sm text-blue-600 ml-2">ফোন নম্বর যাচাই করুন</span>
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Enter the 6-digit code sent to {formData.phone}
                      {process.env.NODE_ENV === 'development' && (
                        <span className="block text-xs mt-1 font-mono bg-blue-100 p-1 rounded">
                          Demo code: 123456
                        </span>
                      )}
                    </p>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        maxLength={6}
                        className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-center font-mono text-lg"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <button
                        onClick={handleVerifyPhone}
                        disabled={isVerifying || verificationCode.length !== 6}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          fullName: user.fullName,
                          phone: user.phone || ''
                        })
                        setError('')
                      }}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* NID Verification Section */}
            <div className="mt-6">
              <NIDVerification />
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Security Settings
                <span className="bengali text-sm text-gray-500 ml-2">নিরাপত্তা সেটিংস</span>
              </h3>

              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Password</h4>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={passwordForm.showCurrent ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          placeholder="Enter current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setPasswordForm({...passwordForm, showCurrent: !passwordForm.showCurrent})}
                        >
                          {passwordForm.showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={passwordForm.showNew ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          placeholder="Enter new password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setPasswordForm({...passwordForm, showNew: !passwordForm.showNew})}
                        >
                          {passwordForm.showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={passwordForm.showConfirm ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                          placeholder="Confirm new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setPasswordForm({...passwordForm, showConfirm: !passwordForm.showConfirm})}
                        >
                          {passwordForm.showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Update Password
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                            showCurrent: false,
                            showNew: false,
                            showConfirm: false
                          })
                          setError('')
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Information
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Account Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Account ID:</span>
                      <span className="ml-2 font-mono text-gray-900">{user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 text-gray-900">{user.isFullyVerified ? 'Verified User' : 'Unverified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <span className="ml-2 text-gray-900">{formatMemberSince(user.createdAt) || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}