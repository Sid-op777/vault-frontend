"use client"

import { Github, CodeXml, Globe } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Description */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <Image src="/nx7.svg" alt="nx7" height={30} width={60}/>
              {/* <Shield className="w-5 h-5 text-white" /> */}
            </div>
            <div>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">Vault</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Secure snippet sharing</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/Sid-op777"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Sid-op777/vault-frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              aria-label="GitHub"
            >
              <CodeXml className="w-5 h-5" />
            </a>
            <a
              href="https://portfolio.nx7.tech"
              target="_blank"
              className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              aria-label="Code"
            >
              <Globe  className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Vault. No rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a
                href="/docs"
                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                API Docs
              </a>
              <a
                href="/docs"
                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Status Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
