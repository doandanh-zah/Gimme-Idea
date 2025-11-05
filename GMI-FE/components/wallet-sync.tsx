"use client"

import { useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAppStore } from "@/lib/stores/app-store"
import { getCachedSignature } from "@/lib/auth/sign-message"

/**
 * Syncs Solana wallet adapter state with app store
 * This component should be placed in the root layout
 */
export function WalletSync() {
  const wallet = useWallet()
  const { wallet: appWallet, setWallet, disconnectWallet } = useAppStore()

  useEffect(() => {
    // If wallet adapter is connected and we have a valid signature
    if (wallet.connected && wallet.publicKey) {
      const address = wallet.publicKey.toString()
      const cached = getCachedSignature(address)

      // Only update app store if we have a valid cached signature
      // OR if the app store already has this wallet as connected
      if (cached || (appWallet.connected && appWallet.address === address)) {
        setWallet({
          address,
          type: wallet.wallet?.adapter.name.toLowerCase() as any,
          connected: true,
        })
      } else if (!cached && appWallet.connected) {
        // Wallet is connected in adapter but no signature - might need to re-authenticate
        console.log('[WalletSync] Wallet connected but no signature found')
      }
    } else if (!wallet.connected && appWallet.connected) {
      // Wallet adapter disconnected but app store still has it as connected
      // This happens when user disconnects from the wallet extension
      console.log('[WalletSync] Wallet disconnected, clearing app store')
      disconnectWallet()
    }
  }, [wallet.connected, wallet.publicKey, wallet.wallet?.adapter.name, appWallet.connected, appWallet.address, setWallet, disconnectWallet])

  return null // This component doesn't render anything
}
