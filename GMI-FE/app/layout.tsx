import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SolanaWalletProvider } from "@/lib/solana/wallet-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gimme Idea - Web3 Feedback Platform",
  description: "Share your ideas and get feedback from the community",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
