'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Upload, X, AlertTriangle, FileText, Camera } from 'lucide-react'
import { disputeAPI, transactionAPI } from '@/lib/api'

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  description: string;
  status: string;
  buyerId: string;
  sellerId: string;
}

export default function CreateDisputePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('transactionId')

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const disputeReasons = [
    'Product not as described',
    'Product not delivered',
    'Product damaged/defective',
    'Seller not responding',
    'Payment issues',
    'Delivery issues',
    'Other'
  ]

  useEffect(() => {
    if (transactionId) {
      fetchTransaction()
    } else {
      setError('Transaction ID is required')
    }
  }, [transactionId])

  const fetchTransaction = async () => {
    try {
      // Use reference-based lookup for string transactionId
      const response = await transactionAPI.getTransactionByRef(transactionId!)
      setTransaction(response.data.transaction)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load transaction')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + selectedFiles.length > 5) {
      setError('Maximum 5 evidence files allowed')
      return
    }

    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)
    
    // Create preview URLs for images
    const newPreviewUrls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return ''
    })
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
    setError('')
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    
    // Revoke URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError('Please select a dispute reason')
      return
    }
    
    if (!description.trim()) {
      setError('Please provide a description of the issue')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const formData = new FormData()
      formData.append('transactionId', transactionId!)
      formData.append('reason', reason)
      formData.append('description', description)
      
      selectedFiles.forEach(file => {
        formData.append('evidence', file)
      })

      await disputeAPI.createDispute(formData)
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/disputes')
      }, 2000)

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create dispute')
    } finally {
      setSubmitting(false)
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dispute Filed Successfully</h2>
          <p className="text-gray-600 mb-4">Your dispute has been submitted. An admin will review your case.</p>
          <p className="text-sm text-gray-500">Redirecting to disputes page...</p>
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
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">File a Dispute</h1>
              <p className="text-gray-600">Report an issue with this transaction</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        {transaction && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium font-mono">{transaction.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">৳{transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {transaction.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Dispute Information</h3>

          {/* Reason Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dispute Reason *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {disputeReasons.map((reasonOption) => (
                <label key={reasonOption} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reason"
                    value={reasonOption}
                    checked={reason === reasonOption}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{reasonOption}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
              Detailed Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the issue..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={submitting}
              required
            />
          </div>

          {/* Evidence Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Evidence Files (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload images, documents, or other files that support your dispute (Max 5 files, 10MB each)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="evidence-upload"
                disabled={submitting || selectedFiles.length >= 5}
              />
              <label 
                htmlFor="evidence-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Upload Evidence Files
                </p>
                <p className="text-sm text-gray-500">
                  Images, PDFs, Documents
                </p>
              </label>
            </div>
          </div>

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Selected Files</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="border border-gray-200 rounded-lg p-3">
                      {file.type.startsWith('image/') && previewUrls[index] ? (
                        <img
                          src={previewUrls[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <p className="text-xs text-gray-600 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !reason.trim() || !description.trim()}
            className="w-full bg-red-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Filing Dispute...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 mr-2" />
                File Dispute
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            By filing this dispute, you agree that the information provided is accurate and that this action is necessary.
          </p>
        </form>
      </div>
    </div>
  )
} 