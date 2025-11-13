import { Router, Response } from 'express'
import { AuthRequest, CreatePostInput } from '../types'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware'
import prisma from '../config/database'
import commentsRoutes from './comments.routes'

const router = Router()

// Mount nested comments routes
router.use('/:postId/comments', commentsRoutes)

/**
 * GET /api/posts
 * List all posts with optional filters
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category, limit = '20', offset = '0', walletAddress } = req.query

    const where: any = {}
    if (category) where.category = category
    if (walletAddress) where.wallet = { address: walletAddress }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          wallet: {
            select: {
              address: true,
              type: true
            }
          },
          prizePool: true,
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.post.count({ where })
    ])

    res.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post,
          commentCount: post._count.comments
        })),
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error) {
    console.error('[Posts] List error:', error)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

/**
 * POST /api/posts
 * Create new post (with optional prize pool)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, imageUrl, projectLink, category, prizePool }: CreatePostInput = req.body

    if (!title || !description || !imageUrl || !projectLink || !category) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!req.wallet) {
      return res.status(401).json({ error: 'Wallet not authenticated' })
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        walletId: req.wallet.id,
        title,
        description,
        imageUrl,
        projectLink,
        category,
        hasPrizePool: !!prizePool
      },
      include: {
        wallet: {
          select: {
            address: true,
            type: true
          }
        }
      }
    })

    // Create prize pool if provided
    let prizePoolData = null
    if (prizePool) {
      // TODO: Lock USDC in escrow smart contract
      // For now, create database record
      prizePoolData = await prisma.prizePool.create({
        data: {
          postId: post.id,
          walletId: req.wallet.id,
          totalAmount: prizePool.totalAmount,
          winnersCount: prizePool.winnersCount,
          distribution: prizePool.distribution as any,
          endsAt: new Date(prizePool.endsAt)
        }
      })
    }

    // Update wallet post count
    await prisma.wallet.update({
      where: { id: req.wallet.id },
      data: { postsCount: { increment: 1 } }
    })

    res.status(201).json({
      success: true,
      data: {
        post: {
          ...post,
          prizePool: prizePoolData
        }
      }
    })
  } catch (error) {
    console.error('[Posts] Create error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

/**
 * GET /api/posts/:id
 * Get single post with details
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        wallet: {
          select: {
            address: true,
            type: true
          }
        },
        prizePool: {
          include: {
            rankings: {
              include: {
                comment: {
                  include: {
                    wallet: {
                      select: {
                        address: true
                      }
                    }
                  }
                }
              },
              orderBy: { rank: 'asc' }
            }
          }
        },
        comments: {
          where: { parentId: null }, // Only top-level comments
          include: {
            wallet: {
              select: {
                address: true,
                type: true
              }
            },
            replies: {
              include: {
                wallet: {
                  select: {
                    address: true,
                    type: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            },
            ranking: true,
            _count: {
              select: {
                tips: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('[Posts] Get error:', error)
    res.status(500).json({ error: 'Failed to fetch post' })
  }
})

/**
 * PUT /api/posts/:id
 * Update post (owner only)
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, projectLink } = req.body

    if (!req.wallet) {
      return res.status(401).json({ error: 'Wallet not authenticated' })
    }

    // Check ownership
    const post = await prisma.post.findUnique({
      where: { id },
      include: { wallet: true }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.wallet.address !== req.walletAddress) {
      return res.status(403).json({ error: 'Not authorized to update this post' })
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(projectLink && { projectLink })
      }
    })

    res.json({
      success: true,
      data: updatedPost
    })
  } catch (error) {
    console.error('[Posts] Update error:', error)
    res.status(500).json({ error: 'Failed to update post' })
  }
})

/**
 * DELETE /api/posts/:id
 * Delete post (owner only)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    if (!req.wallet) {
      return res.status(401).json({ error: 'Wallet not authenticated' })
    }

    // Check ownership
    const post = await prisma.post.findUnique({
      where: { id },
      include: { wallet: true, prizePool: true }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.wallet.address !== req.walletAddress) {
      return res.status(403).json({ error: 'Not authorized to delete this post' })
    }

    // Don't allow deletion if prize pool has active rankings
    if (post.prizePool && !post.prizePool.distributed) {
      const hasRankings = await prisma.ranking.count({
        where: { prizePoolId: post.prizePool.id }
      })

      if (hasRankings > 0) {
        return res.status(400).json({
          error: 'Cannot delete post with active prize pool and rankings'
        })
      }
    }

    // Delete post (will cascade to comments, prize pool, etc.)
    await prisma.post.delete({ where: { id } })

    // Update wallet post count
    await prisma.wallet.update({
      where: { id: req.wallet.id },
      data: { postsCount: { decrement: 1 } }
    })

    res.json({
      success: true,
      data: { success: true, message: 'Post deleted successfully' }
    })
  } catch (error) {
    console.error('[Posts] Delete error:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

export default router
