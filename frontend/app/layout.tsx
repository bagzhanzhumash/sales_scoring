import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sales Scoring Platform',
  description: 'AI-powered sales call analysis and scoring system',
  generator: 'Sales Scoring Team',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
