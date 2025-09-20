import type { Metadata } from 'next'
import { Poppins, Hind_Siliguri } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import { ToastProvider } from '../contexts/ToastContext'
import { VerificationProvider } from '../contexts/VerificationContext'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
})

export const metadata: Metadata = {
  title: 'Vorosha Pay | আস্থার নতুন যুগ',
  description: 'Bangladesh\'s most secure digital escrow platform with AI-powered protection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${hindSiliguri.variable}`}>
      <head>
        <meta name="grammarly" content="false" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50 text-gray-800 overflow-x-hidden scroll-smooth" spellCheck={false}>
        <Script
          id="grammarly-fix"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Remove Grammarly attributes after hydration to prevent mismatch
              if (typeof window !== 'undefined') {
                const removeGrammarlyAttrs = () => {
                  const body = document.body;
                  if (body) {
                    body.removeAttribute('data-new-gr-c-s-check-loaded');
                    body.removeAttribute('data-gr-ext-installed');
                    body.removeAttribute('data-gr-ext-disabled');
                  }
                };
                // Run after a short delay to ensure Grammarly has loaded
                setTimeout(removeGrammarlyAttrs, 100);
              }
            `,
          }}
        />
        <ToastProvider>
          <VerificationProvider>
            {children}
          </VerificationProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
