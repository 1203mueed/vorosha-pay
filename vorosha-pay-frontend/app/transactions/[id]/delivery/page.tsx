'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Camera, Upload, X, ArrowLeft, Package, Check, AlertTriangle } from 'lucide-react'
import { transactionAPI, deliveryAPI } from '@/lib/api'

interface Transaction {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function DeliveryUploadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    fetchTransaction()
  }, [id])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await transactionAPI.getTransaction(id)
      setTransaction(response.data.transaction)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + selectedFiles.length > 3) {
      setError('Maximum 3 photos allowed')
      return
    }

    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
    setError('')
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index])
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviews)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo')
      return
    }

    try {
      setUploading(true)
      setError('')

      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('photos', file)
      })
      formData.append('deliveryNotes', deliveryNotes)

      await deliveryAPI.uploadDeliveryPhotos(id, formData)
      
      setUploadSuccess(true)
      setTimeout(() => {
        router.push(`/transactions/${id}`)
      }, 2000)

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload photos')
    } finally {
      setUploading(false)
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction...</p>
        </div>
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-600 mb-4">Delivery photos uploaded successfully and transaction marked as delivered.</p>
          <p className="text-sm text-gray-500">The buyer will now be able to confirm delivery. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Transaction
          </button>
          
          <div className="flex items-center mb-4">
            <Package className="w-8 h-8 text-emerald-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Delivery Photos</h1>
              <p className="text-gray-600">Transaction #{transaction?.transactionId}</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">৳{transaction?.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{transaction?.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                {transaction?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Upload Delivery Photos</h3>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Delivery Photos (Required - At least 1 photo)
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading || selectedFiles.length >= 3}
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Select delivery photos
                </p>
                <p className="text-sm text-gray-500">
                  At least 1 photo required, maximum 3 photos, 5MB each
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Photos are mandatory to mark transaction as delivered
                </p>
              </label>
            </div>
          </div>

          {/* Photo Previews */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Selected Photos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={previewUrls[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-3">
              Delivery Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Add any additional information about the delivery..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={uploading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Uploading Photos & Marking as Delivered...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Photos & Mark as Delivered
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              Photos are required to mark transaction as delivered
            </p>
            <p className="text-xs text-gray-500 mt-1">
              After uploading, the buyer will be notified to confirm delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 