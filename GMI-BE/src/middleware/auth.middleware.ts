import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import prisma from '../config/database'
import { verifyWalletSignature } from '../utils/crypto'

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string
    const signature = req.headers['x-wallet-signature'] as string
    const messageFromHeader = req.headers['x-wallet-message'] as string

    if (!walletAddress) {
      res.status(401).json({ error: 'Wallet address required' })
      return
    }

    // For some endpoints, signature verification can be skipped (e.g., GET requests)
    if (req.method !== 'GET' && !signature) {
      res.status(401).json({ error: 'Wallet signature required' })
      return
    }

    // Verify signature if provided
    if (signature) {
      // Try header first (for uploads), then body (for JSON requests), then fallback
      const message = messageFromHeader || req.body?.message || `Sign in to Gimme Idea at ${Date.now()}`
      const isValid = await verifyWalletSignature(walletAddress, signature, message)

      if (!isValid) {
        res.status(401).json({ error: 'Invalid wallet signature' })
        return
      }
    }

    // Find or create wallet in database
    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress }
    })

    if (!wallet) {
      // Auto-create wallet on first request
      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          type: 'unknown' // Will be updated on proper connect
        }
      })
    } else {
      // Update last active time (auto-updated by @updatedAt, trigger by dummy update)
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { type: wallet.type }
      })
    }

    // Attach wallet info to request
    req.walletAddress = walletAddress
    req.wallet = wallet

    next()
  } catch (error) {
    console.error('[Auth Middleware] Error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Optional auth - doesn't fail if no wallet
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const walletAddress = req.headers['x-wallet-address'] as string

  if (walletAddress) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress }
      })

      if (wallet) {
        req.walletAddress = walletAddress
        req.wallet = wallet
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next()
}
