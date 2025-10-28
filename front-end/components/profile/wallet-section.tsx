"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { WalletModal } from "@/components/wallet/wallet-modal"
import { useStore } from "@/lib/store"
import { Wallet, CheckCircle } from "lucide-react"

export function WalletSection() {
  const [showModal, setShowModal] = useState(false)
  const user = useStore((state) => state.user)

  return (
    <>
      <div className="rounded-2xl bg-card border border-border p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Wallet Connection</h2>
            <p className="text-muted-foreground">Connect your wallet to receive tips and participate in governance</p>
          </div>
          <Wallet className="w-12 h-12 text-primary" />
        </div>

        {user?.walletAddress ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-success mb-1">Wallet Connected</p>
                <p className="text-sm text-muted-foreground font-mono">{user.walletAddress}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowModal(true)}>
                Change Wallet
              </Button>
              <Button variant="outline" className="text-error bg-transparent">
                Disconnect
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-muted">
              <h3 className="font-semibold mb-2">Transaction History</h3>
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Connect your wallet to receive tips from the community and participate in platform governance. One
                wallet per account.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Receive tips in SOL
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Participate in governance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Access exclusive features
                </li>
              </ul>
            </div>

            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-primary to-secondary">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        )}
      </div>

      <WalletModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
