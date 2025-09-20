'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search, Filter, Eye, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import { disputeAPI } from '@/lib/api'

interface Dispute {
  id: string;
  transactionId: string;
  reason?: string;
  description?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const response = await disputeAPI.getUserDisputes()
      // Backend may return { success, message, data } where data is []
      // or { data: { disputes: [] } } depending on implementation.
      const payload = response?.data ?? response
      const list = Array.isArray(payload) ? payload : (payload?.disputes ?? [])
      setDisputes(Array.isArray(list) ? list : [])
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  const normalizeStatus = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'under_review' || s === 'underreview' || s === 'review' || s === 'pending') return 'pending'
    if (s === 'investigating' || s === 'investigation') return 'investigating'
    if (s === 'resolved') return 'resolved'
    if (s === 'rejected') return 'rejected'
    return 'pending'
  }

  const getStatusInfo = (status: string) => {
    const normalized = normalizeStatus(status)
    const statusMap: Record<string, { text: string; color: string; icon: any }> = {
      pending: { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      investigating: { text: 'Under Investigation', color: 'bg-blue-100 text-blue-800', icon: Search },
      resolved: { text: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    return statusMap[normalized] || statusMap.pending
  }

  const filteredDisputes = (Array.isArray(disputes) ? disputes : []).filter(dispute => {
    const reason = (dispute.reason || '').toLowerCase()
    const description = (dispute.description || '').toLowerCase()
    const matchesSearch = reason.includes(searchTerm.toLowerCase()) ||
                          description.includes(searchTerm.toLowerCase())
    const normalized = normalizeStatus(dispute.status)
    const matchesStatus = statusFilter === 'all' || normalized === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
            <p className="text-gray-600">Track and manage your transaction disputes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search disputes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes Found</h3>
            <p className="text-gray-500 mb-6">
              {disputes.length === 0 
                ? "You haven't filed any disputes yet."
                : "No disputes match your current filters."
              }
            </p>
            {disputes.length === 0 && (
              <Link
                href="/transactions"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                View Transactions
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const info = getStatusInfo(dispute.status)
              const StatusIcon = info.icon

              return (
                <div key={dispute.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <h3 className="font-semibold text-gray-900">{dispute.reason || 'Dispute'}</h3>
                        <div className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {info.text}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{dispute.description || ''}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>Filed: {formatDate(dispute.createdAt)}</span>
                        {dispute.resolvedAt && (
                          <span>Resolved: {formatDate(dispute.resolvedAt)}</span>
                        )}
                      </div>
                      {dispute.resolution && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Resolution:</span> {dispute.resolution}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <Link
                        href={`/disputes/${dispute.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {Array.isArray(disputes) && disputes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{disputes.length}</div>
              <div className="text-sm text-gray-500">Total Disputes</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {disputes.filter(d => normalizeStatus(d.status) === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {disputes.filter(d => normalizeStatus(d.status) === 'resolved').length}
              </div>
              <div className="text-sm text-gray-500">Resolved</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {disputes.filter(d => normalizeStatus(d.status) === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 