import { Router, Response } from 'express'
import { AuthRequest, WalletConnectInput } from '../types'
import prisma from '../config/database'
import { verifyWalletSignature } from '../utils/crypto'

const router = Router()

/**
 * POST /api/wallet/connect
 * Connect wallet and verify signature
 */
router.post('/connect', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Wallet] Connect request received')
    console.log('[Wallet] Request body:', JSON.stringify(req.body, null, 2))

    const { address, type, signature, message }: WalletConnectInput = req.body

    if (!address || !type || !signature || !message) {
      console.log('[Wallet] Missing required fields')
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('[Wallet] All fields present, verifying signature...')

    // Verify signature
    const isValid = await verifyWalletSignature(address, signature, message)
    if (!isValid) {
      console.log('[Wallet] Signature verification failed')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    console.log('[Wallet] Signature verified successfully')

    // Create or update wallet
    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: {
        type, // Update wallet type
        // lastActiveAt is auto-updated by @updatedAt decorator
      },
      create: {
        address,
        type
      }
    })

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        type: wallet.type,
        postsCount: wallet.postsCount,
        tipsReceived: wallet.tipsReceived,
        tipsGiven: wallet.tipsGiven
      }
    })
  } catch (error) {
    console.error('[Wallet] Connect error:', error)
    console.error('[Wallet] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[Wallet] Error message:', error instanceof Error ? error.message : String(error))
    res.status(500).json({
      error: 'Failed to connect wallet',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    })
  }
})

/**
 * GET /api/wallet/:address
 * Get wallet info
 */
router.get('/:address', async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.params

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      }
    })

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    res.json({
      wallet: {
        id: wallet.id,
        address: wallet.address,
        type: wallet.type,
        postsCount: wallet._count.posts,
        commentsCount: wallet._count.comments,
        tipsReceived: wallet.tipsReceived,
        tipsGiven: wallet.tipsGiven,
        createdAt: wallet.createdAt
      }
    })
  } catch (error) {
    console.error('[Wallet] Get error:', error)
    res.status(500).json({ error: 'Failed to get wallet info' })
  }
})

export default router
