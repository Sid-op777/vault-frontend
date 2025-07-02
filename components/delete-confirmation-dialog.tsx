"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { SwipeToConfirm } from "./swipe-to-confirm"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConfirmationDialog({ open, onOpenChange, onConfirm }: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    // Simulate deletion process
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onConfirm()
    setIsDeleting(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (!isDeleting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Secure Link
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this secure link? This action cannot be undone and the link will become
            immediately inaccessible.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            ⚠️ Warning: This will permanently destroy the encrypted snippet
          </p>
        </div>

        <div className="space-y-4">
          <SwipeToConfirm
            onConfirm={handleConfirm}
            disabled={isDeleting}
            text="Swipe to delete link"
            confirmText="Release to delete"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isDeleting} className="w-full bg-transparent">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
