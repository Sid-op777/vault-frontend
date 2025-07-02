"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PasswordDialog } from "@/components/password-dialog"
import { ContentDisplay } from "@/components/content-display"
import { Loader2 } from "lucide-react"

// Mock data
const MOCK_CONTENT = `DATABASE_URL=postgresql://user:password@localhost:5432/myapp
API_KEY=sk_live_abc123xyz789def456ghi
JWT_SECRET=your-super-secret-jwt-key-here
STRIPE_SECRET_KEY=sk_test_123456789
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Environment: Production
# Last updated: 2024-01-15
# Owner: DevOps Team`

const MOCK_PASSWORD = "123"
const MAX_ATTEMPTS = 5

export default function ViewSnippet() {
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(true) // Set to true as requested
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [passwordAttempts, setPasswordAttempts] = useState(0)
  const [isWrongPassword, setIsWrongPassword] = useState(false)
  const [maxAttemptsExceeded, setMaxAttemptsExceeded] = useState(false)

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (requiresPassword) {
        setShowPasswordDialog(true)
      } else {
        setShowContent(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [requiresPassword])

  // Handle max attempts exceeded
  useEffect(() => {
    if (maxAttemptsExceeded) {
      const timer = setTimeout(() => {
        window.close()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [maxAttemptsExceeded])

  const handlePasswordSubmit = (password: string) => {
    const newAttempts = passwordAttempts + 1
    setPasswordAttempts(newAttempts)

    if (password === MOCK_PASSWORD) {
      setShowPasswordDialog(false)
      setShowContent(true)
      setIsWrongPassword(false)
    } else {
      setIsWrongPassword(true)

      if (newAttempts >= MAX_ATTEMPTS) {
        setShowPasswordDialog(false)
        setMaxAttemptsExceeded(true)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
            <p className="text-gray-600 dark:text-gray-300">Loading secure content...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (maxAttemptsExceeded) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Maximum Attempts Exceeded</h1>
            <p className="text-gray-600 dark:text-gray-300">
              You have exceeded the maximum number of password attempts. This tab will close automatically in a few
              seconds.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                For security reasons, access to this content has been permanently blocked.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          {showContent ? (
            <ContentDisplay content={MOCK_CONTENT} id={id} />
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🔐</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Content</h1>
                <p className="text-gray-600 dark:text-gray-300">Please wait while we prepare your content...</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <PasswordDialog
        open={showPasswordDialog}
        onPasswordSubmit={handlePasswordSubmit}
        attempts={passwordAttempts}
        maxAttempts={MAX_ATTEMPTS}
        isWrongPassword={isWrongPassword}
      />
    </div>
  )
}
