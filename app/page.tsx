"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  Clock,
  Lock,
  Copy,
  Eye,
  Timer,
  Key,
  Server,
  FileText,
  Users,
  MessageSquare,
  QrCode,
  Trash2,
  Loader2,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import * as crypto from "@/lib/crypto";
import * as api from "@/lib/api";

export default function SecureSnippetLanding() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [content, setContent] = useState("")
  const [password, setPassword] = useState("")
  const [expiry, setExpiry] = useState("15 minutes")
  const [allowedViews, setAllowedViews] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const [creationResult, setCreationResult] = useState<{
    id: string;
    revocationToken: string;
    secureUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false)

  const handleCreateSnippet = async () => {
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const isPasswordProtected = password.trim().length > 0;
      let ciphertext: string;
      let keyToEmbedInUrl: string | null = null;

      // Step 1: Encrypt the content
      if (isPasswordProtected) {
        ciphertext = await crypto.encryptTextWithPassword(content, password);
      } else {
        const dataKey = await crypto.generateDataKey();
        keyToEmbedInUrl = await crypto.exportKey(dataKey);
        ciphertext = await crypto.encryptText(content, dataKey);
      }
      
      // Step 2: Calculate the expiry timestamp
      const expiryDate = new Date();
      const [value, unit] = expiry.split(" ");
      if (unit.startsWith('minute')) expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(value));
      if (unit.startsWith('hour')) expiryDate.setHours(expiryDate.getHours() + parseInt(value));
      if (unit.startsWith('day')) expiryDate.setDate(expiryDate.getDate() + parseInt(value));

      // Step 3: Prepare the payload for the backend
      const payload: api.CreateSnippetPayload = {
        ciphertext: ciphertext,
        passwordProtected: isPasswordProtected,
        expiresAt: expiryDate.toISOString(),
        maxViews: allowedViews ? parseInt(allowedViews) : 1, // Default to 1 view if not specified
      };

      // Step 4: Call the API
      const response = await api.createSnippet(payload);
      
      // Step 5: Construct the final URL
      let finalUrl = `${window.location.origin}/view/${response.id}`;
      if (keyToEmbedInUrl) {
        finalUrl += `#${keyToEmbedInUrl}`;
      }

      // Step 6: Set the result state to show the success UI
      setCreationResult({
        id: response.id,
        revocationToken: response.revocationToken,
        secureUrl: finalUrl,
      });

    } catch (e: any) {
      setError(e.message || "An unknown error occurred during creation.");
    } finally {
      setIsCreating(false);
    }
  }

  const handleDeleteConfirm = async () => {
    if (!creationResult) return;
    setShowDeleteDialog(false); // Close the dialog first
    try {
      await api.deleteSnippet(creationResult.id, creationResult.revocationToken);
      handleNewSnippet(); // Reset the whole form on successful deletion
    } catch (e: any) {
      setError(e.message || "Failed to delete the snippet.");
    }
  }

  const handleCopyLink = async () => {
    if (!creationResult?.secureUrl) return;
    await navigator.clipboard.writeText(creationResult.secureUrl);
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNewSnippet = () => {
    setCreationResult(null);
    setContent("");
    setPassword("");
    setAllowedViews("");
    setError(null);
  }

  const isContentValid = content.trim().length > 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Securely Share Sensitive Snippets—
                <span className="text-green-600">Without the Risk</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Paste code, config, or credentials and get a one-time encrypted share link with optional password +
                expiry.
              </p>
            </div>

            {/* Snippet Demo */}
            <div className="max-w-2xl mx-auto space-y-4">
              {!creationResult ? (
                /* Creation Form */
                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-left">
                      Paste your sensitive content:
                    </label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="DATABASE_URL=postgresql://user:pass@host:5432/db&#10;API_KEY=sk_live_abc123xyz&#10;JWT_SECRET=your-secret-key"
                      className="font-mono text-sm min-h-[120px] bg-white dark:bg-gray-900"
                    />
                    {content.trim().length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                       Enter some content to create a secure snippet
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-left">
                        Expires in:
                      </label>
                      <select
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
                      >
                        <option>15 minutes</option>
                        <option>1 hour</option>
                        <option>24 hours</option>
                        <option>7 days</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-left">
                        Allowed views (optional):
                      </label>
                      <Input
                        type="number"
                        value={allowedViews}
                        onChange={(e) => setAllowedViews(e.target.value)}
                        placeholder="e.g., 5"
                        min="1"
                        max="100"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-left">
                        Password (optional):
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Optional passphrase"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                  <Button
                    onClick={handleCreateSnippet}
                    disabled={!isContentValid || isCreating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Encrypted Snippet...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Create Encrypted Snippet
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Success State with Generated URL */
                <div className="space-y-4">
                  {/* Success Message */}
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                        Snippet Created Successfully!
                      </h3>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your content has been encrypted and is ready to share securely.
                    </p>
                  </div>

                  {/* Generated URL Box */}
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-green-700 dark:text-green-400 mb-1">Your secure link:</p>
                        <code className="font-mono text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded break-all">
                          {creationResult.secureUrl}
                        </code>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 mb-4">
                      <Timer className="w-3 h-3 inline mr-1" />
                      Expires in {expiry} • {allowedViews || "1"} views allowed
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 bg-transparent"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "Copied!" : "Copy Link"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRDialog(true)}
                        className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 bg-transparent"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Create QR
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 bg-transparent"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Link
                      </Button>
                    </div>
                  </div>

                  {/* Create New Snippet Button */}
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={handleNewSnippet}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                    >
                      Create New Snippet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                Built for Security-First Teams
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mx-auto">
                      <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">End-to-End Encryption</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      AES-256 client-side encryption by default. Your data is encrypted before it leaves your browser.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Time/Access Expiry</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Auto-deletes after X minutes or views. No permanent storage of sensitive data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Password Protection</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Optional passphrase layer adds an extra security barrier for ultra-sensitive content.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center mx-auto">
                      <Server className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Minimal API</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Post via REST, retrieve with access token. Perfect for automation and CI/CD workflows.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How It Works</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Paste & Configure</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Paste your content → set expiry and password (optional)
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Encrypt & Share</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Click "Encrypt & Share" to generate your secure link
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">One-Time Access</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Receive a one-time link for viewing or programmatic fetch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Perfect For</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Sharing .env files</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Securely share environment variables and configuration files with your team.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Sending secrets to collaborators</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Share API keys, passwords, and tokens safely with external partners.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Protecting credentials in Discord/Slack
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Avoid exposing sensitive data in chat logs with encrypted, expiring links.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Treat your sensitive data with respect.
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Join thousands of developers who trust us with their most sensitive information.
                </p>
              </div>

              <Button
               size="lg"
               onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
               className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3">
                <Shield className="w-5 h-5 mr-2" />
                Generate Secure Snippet
              </Button>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  Zero-knowledge architecture
                </div>
                <div className="flex items-center">
                  <Timer className="w-4 h-4 mr-1" />
                  Auto-expiring links
                </div>
                <div className="flex items-center">
                  <Key className="w-4 h-4 mr-1" />
                  Client-side encryption
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog open={showQRDialog} onOpenChange={setShowQRDialog} url={creationResult?.secureUrl || ''} />
    </div>
  )
}
