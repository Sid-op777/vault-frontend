"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, QrCode } from "lucide-react"
import QRCode from "qrcode"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
}

export function QRCodeDialog({ open, onOpenChange, url }: QRCodeDialogProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (open && url) {
      timeout = setTimeout(() => {
        generateQRCode()
      }, 100) // delay slightly to ensure canvas is mounted
    }

    return () => clearTimeout(timeout)
  }, [open, url])

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, url, {
          width: 256,
          margin: 2,
          color: {
            dark: "#166534", // green-800
            light: "#ffffff",
          },
        })

        // Also generate data URL for download
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: "#166534", // green-800
            light: "#ffffff",
          },
        })
        setQrCodeDataUrl(dataUrl)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a")
      link.download = "secure-snippet-qr.png"
      link.href = qrCodeDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <QrCode className="w-5 h-5" />
            QR Code for Secure Link
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Scan this QR code to access your secure snippet link
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {isGenerating ? (
            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200 dark:border-green-800">
              <canvas ref={canvasRef} className="max-w-full h-auto" style={{ imageRendering: "pixelated" }} />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
              {url}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This QR code contains your secure snippet link</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button
            onClick={downloadQRCode}
            disabled={isGenerating || !qrCodeDataUrl}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
