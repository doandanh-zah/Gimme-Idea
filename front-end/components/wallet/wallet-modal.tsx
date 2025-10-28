"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { WALLET_TYPES } from "@/lib/constants"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const setUser = useStore((state) => state.setUser)
  const user = useStore((state) => state.user)

  const handleConnect = async (walletName: string) => {
    setConnecting(walletName)

    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock wallet address
      const mockAddress = `${walletName.slice(0, 4)}...${Math.random().toString(36).slice(2, 6)}`

      if (user) {
        setUser({
          ...user,
          walletAddress: mockAddress,
        })
      }

      toast.success(`${walletName} connected successfully!`)
      onClose()
    } catch (error) {
      toast.error("Failed to connect wallet")
    } finally {
      setConnecting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>Choose your preferred wallet to connect. One wallet per account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {WALLET_TYPES.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="w-full h-14 justify-start text-left hover:bg-primary/10 hover:border-primary/50 bg-transparent"
              onClick={() => handleConnect(wallet.name)}
              disabled={connecting !== null}
            >
              {connecting === wallet.name ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl mr-3">{wallet.icon}</span>
                  <div>
                    <div className="font-semibold">{wallet.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.name === "Phantom" && "Popular Solana wallet"}
                      {wallet.name === "Solflare" && "Secure Solana wallet"}
                      {wallet.name === "MetaMask" && "Multi-chain wallet"}
                      {wallet.name === "Passkey" && "Passwordless authentication"}
                    </div>
                  </div>
                </>
              )}
            </Button>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> You can only connect one wallet per account. You can
          disconnect and connect a different wallet at any time.
        </div>
      </DialogContent>
    </Dialog>
  )
}
