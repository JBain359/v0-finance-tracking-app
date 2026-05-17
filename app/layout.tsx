import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppSidebar } from '@/components/app-sidebar'
import { AuthProvider } from '@descope/nextjs-sdk';
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FinTrack - Personal Finance Tracker',
  description: 'Track your spending with AI-powered insights. Upload bank and credit card statements, auto-categorize transactions, and chat with your financial data.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider projectId={process.env.DESCOPE_PROJECT_ID!}>
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <AppSidebar />
        <main className="ml-64 min-h-screen">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
    </AuthProvider>
  )
}
