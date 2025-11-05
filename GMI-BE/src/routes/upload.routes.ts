import { Router, Response } from 'express'
import { AuthRequest } from '../types'
import { authMiddleware } from '../middleware/auth.middleware'
import { supabase } from '../config/supabase'
import multer from 'multer'
import { randomUUID } from 'crypto'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed'))
    }
  }
})

/**
 * POST /api/upload
 * Upload image to Supabase Storage
 */
router.post('/', upload.single('image'), authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Wallet not authenticated' })
    }

    const file = req.file
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${randomUUID()}.${fileExt}`
    const filePath = `posts/${req.walletAddress}/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('gimme-idea')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Upload] Supabase error:', error)
      return res.status(500).json({ error: 'Failed to upload image' })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gimme-idea')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return res.status(500).json({ error: 'Failed to get image URL' })
    }

    res.status(201).json({
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
      mimeType: file.mimetype
    })
  } catch (error) {
    console.error('[Upload] Error:', error)

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB' })
      }
      return res.status(400).json({ error: error.message })
    }

    res.status(500).json({ error: 'Failed to upload image' })
  }
})

/**
 * DELETE /api/upload
 * Delete image from Supabase Storage
 */
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { path } = req.body

    if (!path) {
      return res.status(400).json({ error: 'Image path required' })
    }

    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Wallet not authenticated' })
    }

    // Verify user owns this image (path starts with posts/{walletAddress}/)
    const expectedPrefix = `posts/${req.walletAddress}/`
    if (!path.startsWith(expectedPrefix)) {
      return res.status(403).json({ error: 'You can only delete your own images' })
    }

    const { error } = await supabase.storage
      .from('gimme-idea')
      .remove([path])

    if (error) {
      console.error('[Upload] Delete error:', error)
      return res.status(500).json({ error: 'Failed to delete image' })
    }

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('[Upload] Delete error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

export default router
