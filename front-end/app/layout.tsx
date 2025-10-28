import type React from "react"
import type { Metadata } from "next"
import { Tomorrow } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-tomorrow",
})

export const metadata: Metadata = {
  title: "Gimme Idea - Where Ideas Meet Intelligence",
  description: "Professional Web3 project feedback platform powered by AI",
  generator: "v0.app",
  keywords: ["web3", "feedback", "AI", "blockchain", "projects"],
  openGraph: {
    title: "Gimme Idea",
    description: "Where Ideas Meet Intelligence",
    url: "https://gimmeidea.com",
    siteName: "Gimme Idea",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${tomorrow.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
