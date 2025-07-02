"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PasswordDialog } from "@/components/password-dialog"
import { ContentDisplay } from "@/components/content-display"
import { Loader2 } from "lucide-react"
import * as crypto from "@/lib/crypto";
import * as api from "@/lib/api";

type ViewStatus = 
  | 'loading' 
  | 'requires_password' 
  | 'decrypting' 
  | 'ready' 
  | 'expired' 
  | 'max_attempts_exceeded'
  | 'error';

const MAX_ATTEMPTS = 5

export default function ViewSnippet() {
  const params = useParams()
  const id = params.id as string

  const [status, setStatus] = useState<ViewStatus>('loading')
  const [passwordAttempts, setPasswordAttempts] = useState(0)
  const [isWrongPassword, setIsWrongPassword] = useState(false)
  
  const [error, setError] = useState<string | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const [snippetData, setSnippetData] = useState<api.GetSnippetResponse | null>(null);

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setError("No snippet ID provided in the URL.");
      return;
    }

    const fetchAndDecryptSnippet = async () => {
      try {
        const data = await api.getSnippet(id);
        setSnippetData(data); // Store the metadata (expiresAt, viewsRemaining, etc.)

        const keyFragment = window.location.hash.substring(1);

        if (data.passwordProtected) {
          setStatus('requires_password');
        } else {
          // This is a password-less snippet
          if (!keyFragment) {
            throw new Error("Decryption key is missing from the URL for this snippet.");
          }
          setStatus('decrypting');
          const key = await crypto.importKey(keyFragment);
          const plaintext = await crypto.decryptText(data.ciphertext, key);
          setDecryptedContent(plaintext);
          setStatus('ready');
        }
      } catch (e: any) {
        setStatus('expired'); // Treat most API errors as "expired" or "gone"
        setError(e.message || "Could not retrieve the snippet.");
      }
    };

    fetchAndDecryptSnippet();
  }, [id]);

  const handlePasswordSubmit = async (password: string) => {
    if (!snippetData) return;

    const newAttempts = passwordAttempts + 1;
    setPasswordAttempts(newAttempts);
    setIsWrongPassword(false); // Reset UI feedback before trying
    setStatus('decrypting');

    try {
      // Attempt to decrypt with the provided password
      const plaintext = await crypto.decryptTextWithPassword(snippetData.ciphertext, password);
      setDecryptedContent(plaintext);
      setStatus('ready'); // Success!
    } catch (e) {
      // Decryption failed, likely a wrong password
      setIsWrongPassword(true);
      if (newAttempts >= MAX_ATTEMPTS) {
        setStatus('max_attempts_exceeded');
      } else {
        // Go back to the password prompt to let the user try again
        setStatus('requires_password');
      }
    }
  };

  const renderMainContent = () => {
    switch (status) {
      case 'loading':
      case 'decrypting':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
            <p className="text-gray-600 dark:text-gray-300">
              {status === 'loading' ? 'Loading secure content...' : 'Decrypting...'}
            </p>
          </div>
        );

      case 'ready':
        return (
          <ContentDisplay
            content={decryptedContent}
            id={id}
            metadata={snippetData}
          />
        );
      
      case 'max_attempts_exceeded':
        return (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Maximum Attempts Exceeded</h1>
            <p className="text-gray-600 dark:text-gray-300">
              For security, access has been blocked. This page is now inert.
            </p>
          </div>
        );
      
      case 'expired':
      case 'error':
        return (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Content Unavailable</h1>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        );
      
      // For the 'requires_password' case, the main content can be a placeholder
      // because the modal dialog will be the focus.
      case 'requires_password':
      default:
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Required</h1>
            <p className="text-gray-600 dark:text-gray-300">Awaiting password entry...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center">
        {renderMainContent()}
      </main>
      <Footer />

      <PasswordDialog
        open={status === 'requires_password' || status === 'decrypting'}
        isDecrypting={status === 'decrypting'}
        onPasswordSubmit={handlePasswordSubmit}
        attempts={passwordAttempts}
        maxAttempts={MAX_ATTEMPTS}
        isWrongPassword={isWrongPassword}
      />
    </div>
  );
}