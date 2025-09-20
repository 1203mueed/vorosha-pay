'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Check, AlertTriangle, Camera, X } from 'lucide-react'
import { userAPI } from '@/lib/api'

export default function NIDVerification() {
  const [nidInfo, setNidInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState('')
  const [backPreview, setBackPreview] = useState('')

  useEffect(() => {
    fetchNIDInfo()
  }, [])

  const fetchNIDInfo = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getNIDInfo()
      if (response.data.success) {
        setNidInfo(response.data.data.nidInfo)
      }
    } catch (error: any) {
      // 404 is expected if no NID info exists
      if (error.response?.status !== 404) {
        console.error('Fetch NID info error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select image files only')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    
    if (side === 'front') {
      setFrontFile(file)
      setFrontPreview(previewUrl)
    } else {
      setBackFile(file)
      setBackPreview(previewUrl)
    }
    
    setError('')
  }

  const removeFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      if (frontPreview) URL.revokeObjectURL(frontPreview)
      setFrontFile(null)
      setFrontPreview('')
    } else {
      if (backPreview) URL.revokeObjectURL(backPreview)
      setBackFile(null)
      setBackPreview('')
    }
  }

  const handleUpload = async () => {
    if (!frontFile || !backFile) {
      setError('Please select both front and back images of your NID')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('nidFront', frontFile)
      formData.append('nidBack', backFile)

      const response = await userAPI.verifyNID(formData)
      
      if (response.data.success) {
        setSuccess('NID uploaded and verified successfully!')
        
        // Clear files
        removeFile('front')
        removeFile('back')
        
        // Refresh NID info from server to get latest data
        await fetchNIDInfo()
      } else {
        setError(response.data.message || 'Failed to upload NID')
      }
    } catch (error: any) {
      console.error('NID upload error:', error)
      setError(error.response?.data?.message || 'Failed to upload NID')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">NID Verification</h3>
          <p className="text-sm text-gray-500">Upload clear images of both sides of your National ID</p>
        </div>
        {nidInfo && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(nidInfo.verificationStatus)}`}>
            {nidInfo.verificationStatus.charAt(0).toUpperCase() + nidInfo.verificationStatus.slice(1)}
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-3" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Existing NID Info */}
      {nidInfo ? (
        <div className="space-y-6">
          {/* NID Information Display */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">NID Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nidInfo.nidNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">NID Number</label>
                  <p className="text-gray-900 font-mono text-lg">{nidInfo.nidNumber}</p>
                </div>
              )}              {nidInfo.fullName && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{nidInfo.fullName}</p>
                </div>
              )}
              {nidInfo.fatherName && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Father's Name</label>
                  <p className="text-gray-900">{nidInfo.fatherName}</p>
                </div>
              )}
              {nidInfo.motherName && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Mother's Name</label>
                  <p className="text-gray-900">{nidInfo.motherName}</p>
                </div>
              )}
              {nidInfo.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="text-gray-900">{nidInfo.dateOfBirth}</p>
                </div>
              )}
              {nidInfo.address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{nidInfo.address}</p>
                </div>
              )}
              {nidInfo.bloodGroup && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Blood Group</label>
                  <p className="text-gray-900 font-semibold">{nidInfo.bloodGroup}</p>
                </div>
              )}
            </div>
          </div>
          


          {/* Verification Status Messages */}
          {nidInfo.verificationStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Verification Pending</h4>
                  <p className="text-sm text-yellow-700">
                    Your NID is being reviewed by our team. You'll be notified once verification is complete.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {nidInfo.verificationStatus === 'verified' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Verification Complete</h4>
                  <p className="text-sm text-green-700">
                    Your NID has been verified successfully! You can now access all platform features.
                  </p>
                  {nidInfo.verifiedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Verified on {new Date(nidInfo.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {nidInfo.verificationStatus === 'needs_review' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Manual Review Required</h4>
                  <p className="text-sm text-orange-700">
                    Your NID requires manual review by our verification team. This may take 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {nidInfo.verificationStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <X className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Verification Failed</h4>
                  <p className="text-sm text-red-700">
                    Your NID verification was unsuccessful. Please contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Re-upload option for rejected or if user wants to update */}
          {(nidInfo.verificationStatus === 'rejected' || nidInfo.verificationStatus === 'needs_review') && (
            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Upload New Images</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you need to update your NID images, you can upload new ones below.
              </p>
              {/* Upload form will be shown here */}
              <div className="space-y-6">
                {/* Upload Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Side */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NID Front Side
                    </label>
                    {frontPreview ? (
                      <div className="relative">
                        <img
                          src={frontPreview}
                          alt="NID Front"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeFile('front')}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect('front', e)}
                          className="hidden"
                          id="nid-front-reupload"
                          disabled={uploading}
                        />
                        <label htmlFor="nid-front-reupload" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload Front Side</p>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NID Back Side
                    </label>
                    {backPreview ? (
                      <div className="relative">
                        <img
                          src={backPreview}
                          alt="NID Back"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeFile('back')}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect('back', e)}
                          className="hidden"
                          id="nid-back-reupload"
                          disabled={uploading}
                        />
                        <label htmlFor="nid-back-reupload" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upload Back Side</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                {(frontFile || backFile) && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !frontFile || !backFile}
                    className="w-full bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Re-upload & Verify NID
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Side */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NID Front Side
              </label>
              {frontPreview ? (
                <div className="relative">
                  <img
                    src={frontPreview}
                    alt="NID Front"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removeFile('front')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect('front', e)}
                    className="hidden"
                    id="nid-front"
                    disabled={uploading}
                  />
                  <label htmlFor="nid-front" className="cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload Front Side</p>
                  </label>
                </div>
              )}
            </div>

            {/* Back Side */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NID Back Side
              </label>
              {backPreview ? (
                <div className="relative">
                  <img
                    src={backPreview}
                    alt="NID Back"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removeFile('back')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect('back', e)}
                    className="hidden"
                    id="nid-back"
                    disabled={uploading}
                  />
                  <label htmlFor="nid-back" className="cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload Back Side</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          {(frontFile || backFile) && (
            <button
              onClick={handleUpload}
              disabled={uploading || !frontFile || !backFile}
              className="w-full bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Verify NID
                </>
              )}
            </button>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Upload Guidelines</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure images are clear and readable</li>
                  <li>• All text should be visible</li>
                  <li>• Maximum file size: 5MB per image</li>
                  <li>• Supported formats: JPG, PNG</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
