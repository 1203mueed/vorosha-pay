'use client'

import { useState, useEffect } from 'react'
import { Camera, Eye, X, AlertTriangle } from 'lucide-react'
import { deliveryAPI } from '@/lib/api'

interface DeliveryPhoto {
  filename: string;
  url: string;
}

interface DeliveryPhotosProps {
  transactionId: string;
  showTitle?: boolean;
}

export default function DeliveryPhotos({ transactionId, showTitle = true }: DeliveryPhotosProps) {
  const [delivery, setDelivery] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryDetails()
  }, [transactionId])

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true)
      const response = await deliveryAPI.getDeliveryDetails(transactionId)
      setDelivery(response.data)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load delivery details')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!delivery || !delivery.deliveryPhotos || delivery.deliveryPhotos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No delivery photos uploaded yet</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {showTitle && (
          <h3 className="font-semibold text-gray-900 mb-4">Delivery Photos</h3>
        )}
        
        {/* Delivery Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivered At:</span>
              <span className="font-medium">
                {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            {delivery.deliveryNotes && (
              <div className="flex justify-between">
                <span className="text-gray-600">Notes:</span>
                <span className="font-medium">{delivery.deliveryNotes}</span>
              </div>
            )}
            {delivery.isConfirmed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Confirmed At:</span>
                <span className="font-medium text-emerald-600">
                  {new Date(delivery.confirmedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {delivery.deliveryPhotos.map((photo: string, index: number) => (
            <div key={index} className="relative group">
              <img
                src={deliveryAPI.getDeliveryPhoto(photo)}
                alt={`Delivery photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                onClick={() => setSelectedPhoto(photo)}
                onError={(e) => {
                  console.log('Image load error for:', photo);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition"
              >
                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={deliveryAPI.getDeliveryPhoto(selectedPhoto)}
              alt="Delivery photo full view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                console.log('Modal image load error for:', selectedPhoto);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}