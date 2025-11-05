import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/custom/Header'
import { Footer } from '@/components/custom/Footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Carlos Bello'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description:
    'Personal website and portfolio of Carlos Bello - Software Developer',
  keywords: ['Portfolio', 'Blog', 'Projects', 'Software Development'],
  authors: [{ name: 'Carlos Bello' }],
  creator: 'Carlos Bello',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description:
      'Personal website and portfolio of Carlos Bello - Software Developer',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description:
      'Personal website and portfolio of Carlos Bello - Software Developer',
    creator: '@carlostbello',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
