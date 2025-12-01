import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'DBS Store - Electronique Premium',
    template: '%s | DBS Store',
  },
  description:
    'Boutique en ligne de produits electroniques premium en Cote d\'Ivoire. Smartphones, ordinateurs, accessoires et plus.',
  keywords: [
    'electronique',
    'smartphone',
    'ordinateur',
    'accessoires',
    'Cote d\'Ivoire',
    'Abidjan',
    'boutique en ligne',
  ],
  authors: [{ name: 'DBS Store' }],
  creator: 'DBS Store',
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'DBS Store',
    title: 'DBS Store - Electronique Premium',
    description:
      'Boutique en ligne de produits electroniques premium en Cote d\'Ivoire.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DBS Store - Electronique Premium',
    description:
      'Boutique en ligne de produits electroniques premium en Cote d\'Ivoire.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
