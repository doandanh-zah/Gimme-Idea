/**
 * Cleanup script to remove posts without imageUrl or projectLink
 * Run with: npx tsx scripts/cleanup-old-posts.ts
 */

import prisma from '../src/config/database'

async function cleanupOldPosts() {
  console.log('[Cleanup] Starting...')

  try {
    // Find posts without imageUrl or projectLink (empty strings)
    const postsWithoutImage = await prisma.post.findMany({
      where: {
        OR: [
          { imageUrl: '' },
          { projectLink: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        projectLink: true,
        createdAt: true
      }
    })

    console.log(`[Cleanup] Found ${postsWithoutImage.length} invalid posts:`)
    postsWithoutImage.forEach(post => {
      console.log(`  - ${post.id}: "${post.title}" (image: ${!!post.imageUrl}, link: ${!!post.projectLink})`)
    })

    if (postsWithoutImage.length === 0) {
      console.log('[Cleanup] No invalid posts found. All good!')
      return
    }

    // Delete invalid posts
    const result = await prisma.post.deleteMany({
      where: {
        OR: [
          { imageUrl: '' },
          { projectLink: '' }
        ]
      }
    })

    console.log(`[Cleanup] Deleted ${result.count} invalid posts`)
    console.log('[Cleanup] Done!')
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOldPosts()
