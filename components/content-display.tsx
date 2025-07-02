"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Copy, Eye, Timer, Shield } from "lucide-react"
import type { GetSnippetResponse } from "@/lib/api"

function formatRemainingTime(isoString: string | undefined): string {
  if (!isoString) return "..."

  const expiryDate = new Date(isoString)
  const now = new Date()
  const diffSeconds = Math.round((expiryDate.getTime() - now.getTime()) / 1000)

  if (diffSeconds <= 0) return "now"

  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`
  }

  const diffDays = Math.round(diffHours / 24)
  return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
}

interface ContentDisplayProps {
  content: string
  id: string
  metadata: GetSnippetResponse | null
}

export function ContentDisplay({ content, id, metadata }: ContentDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy content:", error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `secure-snippet-${id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const viewsText =
    metadata?.viewsRemaining === 1 ? "1 view remaining" : `${metadata?.viewsRemaining ?? "..."} views remaining`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Snippet</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Content ID: <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{id}</code>
        </p>
      </div>

      {/* Status Info */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center text-green-700 dark:text-green-400">
            <Shield className="w-4 h-4 mr-1" />
            Encrypted
          </div>
          <div className="flex items-center text-green-700 dark:text-green-400">
            <Timer className="w-4 h-4 mr-1" />
            Expires {formatRemainingTime(metadata?.expiresAt)}
          </div>
          <div className="flex items-center text-green-700 dark:text-green-400">
            <Eye className="w-4 h-4 mr-1" />{viewsText}
          </div>
        </div>
      </div>

      {/* Content Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Decrypted Content</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 bg-transparent"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
            <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
              {content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ This content will be permanently deleted after viewing or when it expires.
        </p>
      </div>
    </div>
  )
}
