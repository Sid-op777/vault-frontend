"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, AlertTriangle } from "lucide-react"

interface PasswordDialogProps {
  open: boolean
  onPasswordSubmit: (password: string) => void
  attempts: number
  maxAttempts: number
  isWrongPassword: boolean
}

export function PasswordDialog({
  open,
  onPasswordSubmit,
  attempts,
  maxAttempts,
  isWrongPassword,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay for UX
    onPasswordSubmit(password)
    setPassword("")
    setIsSubmitting(false)
  }

  const remainingAttempts = maxAttempts - attempts

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Lock className="w-5 h-5" />
            Password Protected Content
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            This secure snippet is password protected. Please enter the password to view the content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="font-mono"
              disabled={isSubmitting}
              autoFocus
            />

            {isWrongPassword && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Incorrect password. {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Verifying..." : "Unlock Content"}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Attempt {attempts} of {maxAttempts}
        </div>
      </DialogContent>
    </Dialog>
  )
}
