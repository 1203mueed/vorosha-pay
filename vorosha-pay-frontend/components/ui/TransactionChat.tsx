'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, X, Clock, CheckCircle2 } from 'lucide-react'
import { chatAPI, tokenUtils } from '@/lib/api'

interface ChatMessage {
  id: string;
  transactionId: string;
  senderId: string;
  receiverId: string;
  message: string;
  sentAt: string;
  isRead: string;
}

interface TransactionChatProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
  counterpartyName: string;
}

export default function TransactionChat({ transactionId, isOpen, onClose, counterpartyName }: TransactionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [canChat, setCanChat] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = tokenUtils.getUser()

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      markMessagesAsRead()
    }
  }, [isOpen, transactionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await chatAPI.getTransactionMessages(transactionId)
      
      if (response.success) {
        setMessages(response.data.messages || [])
        setCanChat(response.data.canChat || false)
      }
    } catch (error: any) {
      console.error('Error loading messages:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await chatAPI.markMessagesAsRead(transactionId)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      setError('')
      
      const response = await chatAPI.sendMessage(transactionId, newMessage)
      
      if (response.success) {
        setMessages(prev => [...prev, response.data])
        setNewMessage('')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    } catch (error) {
      return 'Recently'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-50 rounded-t-xl">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-emerald-600 mr-2" />
            <div>
              <h3 className="font-semibold text-gray-900">Chat with {counterpartyName}</h3>
              <p className="text-xs text-gray-500">Transaction #{transactionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id?.toString()
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isOwn 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      isOwn ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTime(message.sentAt)}</span>
                      {isOwn && message.isRead === 'true' && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          {!canChat ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-500">
                Chat is disabled for completed or cancelled transactions
              </p>
              <p className="text-xs text-gray-400 mt-1">
                You can view past messages but cannot send new ones
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                  rows={1}
                  maxLength={1000}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <p className="text-xs text-gray-400">
                  {newMessage.length}/1000
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 