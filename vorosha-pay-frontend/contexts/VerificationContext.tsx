'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { tokenUtils, userAPI } from '../lib/api'
import VerificationModal from '../components/ui/VerificationModal'

interface VerificationContextType {
  user: any
  isFullyVerified: boolean
  needsVerification: boolean
  showVerificationModal: () => void
  hideVerificationModal: () => void
  refreshUser: () => Promise<void>
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

export function VerificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [blockedPath, setBlockedPath] = useState<string | null>(null)

  // Pages that don't require verification
  const publicPages = ['/', '/auth/login', '/auth/register']
  const dashboardPages = ['/dashboard']

  const isPublicPage = publicPages.includes(pathname)
  const isDashboardPage = dashboardPages.some(page => pathname.startsWith(page))

  const refreshUser = async () => {
    try {
      if (tokenUtils.isAuthenticated()) {
        const userData = tokenUtils.getUser()
        
        // Get fresh user data from API
        const response = await userAPI.getProfile()
        if (response?.success) {
          const freshUser = response.data?.user
          if (freshUser) {
            // Normalize verification flags
            const normalizedUser = {
              ...freshUser,
              isPhoneVerified: Boolean(freshUser.isPhoneVerified),
              isNIDVerified: Boolean(freshUser.isNIDVerified),
              isFullyVerified: Boolean(freshUser.isPhoneVerified && freshUser.isNIDVerified)
            }
            setUser(normalizedUser)
            tokenUtils.setUser(normalizedUser)
            return normalizedUser
          }
        }
        
        // Fallback to stored user data
        setUser(userData)
        return userData
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
    return null
  }

  const checkVerificationStatus = (userData: any) => {
    if (!userData) return false
    
    const isPhoneVerified = Boolean(userData.isPhoneVerified)
    const isNIDVerified = Boolean(userData.isNIDVerified)
    
    return isPhoneVerified && isNIDVerified
  }

  const shouldBlockAccess = (userData: any, currentPath: string) => {
    if (!userData || isPublicPage) return false
    
    const isFullyVerified = checkVerificationStatus(userData)
    
    // Allow access to dashboard and profile for unverified users
    if (currentPath === '/dashboard' || currentPath === '/profile') return false
    
    // If user is not fully verified and trying to access other pages
    if (!isFullyVerified) {
      return true
    }
    
    return false
  }

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true)
      
      if (tokenUtils.isAuthenticated()) {
        const userData = await refreshUser()
        
        if (userData) {
          const isFullyVerified = checkVerificationStatus(userData)
          
          // Check if access should be blocked
          if (shouldBlockAccess(userData, pathname)) {
            setBlockedPath(pathname)
            setShowModal(true)
            // Redirect to dashboard and show modal
            router.push('/dashboard')
          } else {
            setBlockedPath(null)
            setShowModal(false)
          }
        }
      }
      
      setIsLoading(false)
    }

    initializeUser()
  }, [pathname])

  const showVerificationModal = () => {
    setShowModal(true)
  }

  const hideVerificationModal = () => {
    setShowModal(false)
    setBlockedPath(null)
  }

  const handleVerificationComplete = async () => {
    // Refresh user data after verification
    await refreshUser()
    
    // If there was a blocked path, redirect to it
    if (blockedPath) {
      router.push(blockedPath)
      setBlockedPath(null)
    }
    
    setShowModal(false)
  }

  // Don't render children while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const contextValue: VerificationContextType = {
    user,
    isFullyVerified: checkVerificationStatus(user),
    needsVerification: user ? !checkVerificationStatus(user) : false,
    showVerificationModal,
    hideVerificationModal,
    refreshUser
  }

  const isUserFullyVerified = checkVerificationStatus(user)

  return (
    <VerificationContext.Provider value={contextValue}>
      {children}
      
      {/* Verification Modal - Only show if user is not fully verified */}
      {showModal && user && !isUserFullyVerified && (
        <VerificationModal
          isOpen={showModal}
          onClose={hideVerificationModal}
          user={user}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider')
  }
  return context
}
