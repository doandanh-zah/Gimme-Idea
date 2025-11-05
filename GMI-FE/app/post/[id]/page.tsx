"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletButton } from "@/components/wallet-button"
import { Logo } from "@/components/logo"
import { useAppStore } from "@/lib/stores/app-store"
import { getComments, createComment } from "@/lib/actions/comment-actions"
import { getCachedSignature } from "@/lib/auth/sign-message"

interface Comment {
  id: string
  wallet_address: string
  content: string
  created_at: string
  replies?: Comment[]
}

export default function PostDetail() {
  const router = useRouter()
  const params = useParams()
  const { wallet, posts, hasAccess } = useAppStore()
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)
  const [postId, setPostId] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAccess) {
      router.push("/")
      return
    }
    if (!wallet.connected) {
      router.push("/connect")
    }
  }, [wallet.connected, hasAccess, router])

  useEffect(() => {
    if (params?.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      setPostId(id)
    }
  }, [params?.id])

  const post = posts.find((p) => p.id === postId)

  useEffect(() => {
    if (post?.id) {
      loadCommentsFromDB()
    }
  }, [post?.id])

  const loadCommentsFromDB = async () => {
    try {
      setLoadingComments(true)
      const dbComments = await getComments(post!.id)
      setComments(dbComments as Comment[])
    } catch (error) {
      console.error("[v0] Failed to load comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      // Get cached signature
      const cached = getCachedSignature(wallet.address || '')
      if (!cached) {
        throw new Error('Wallet signature not found. Please reconnect your wallet.')
      }

      // Create comment with proper parameters
      const newComment = await createComment(
        post!.id,
        { content: comment },
        wallet.address || '',
        cached.signature,
        cached.message
      )

      // Transform backend response to local format
      const transformedComment = {
        id: newComment.id,
        wallet_address: newComment.wallet?.address || wallet.address || '',
        content: newComment.content,
        created_at: newComment.createdAt,
        replies: []
      }

      setComments((prev) => [transformedComment, ...prev])
      setComment("")
    } catch (error) {
      console.error("[v0] Error posting comment:", error)
      alert(error instanceof Error ? error.message : "Failed to post comment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post not found</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = wallet.address === post.wallet_address

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Post Header */}
        <div className="space-y-4 border-b pb-6">
          {post.image_url && (
            <img
              src={post.image_url || "/placeholder.svg"}
              alt={post.title}
              className="w-full aspect-video object-cover rounded-lg"
            />
          )}

          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.description}</p>

            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Badge>{post.category}</Badge>
              <a
                href={post.project_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Visit Project →
              </a>
            </div>

            {post.prize_pool_amount > 0 && (
              <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">🏆 Prize Pool: {post.prize_pool_amount} SOL</span>
                  <span className="text-sm text-muted-foreground">
                    {post.ends_at ? `Ends: ${new Date(post.ends_at).toLocaleDateString()}` : "No end date"}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Feedback
            <Badge variant="outline">{comments.length}</Badge>
          </h2>

          {/* Comment Input */}
          <Card className="p-4 space-y-3">
            <form onSubmit={handlePostComment} className="space-y-3">
              <Textarea
                placeholder="Share your feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none break-words whitespace-pre-wrap"
              />
              <Button type="submit" disabled={loading || !comment.trim()} isLoading={loading}>
                Post Feedback
              </Button>
            </form>
          </Card>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading feedback...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No feedback yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <Card key={c.id} className="p-4 space-y-3 break-words">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <Avatar className="flex-shrink-0">
                        <AvatarFallback>{c.wallet_address.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {c.wallet_address.slice(0, 4)}...
                            {c.wallet_address.slice(-4)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm break-words whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>

                    {/* Rank/Tip Buttons (only for post owner) */}
                    {isOwner && post.prize_pool_amount > 0 && (
                      <div className="flex gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              🏆 Rank
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Array.from({ length: post.prize_pool_count }).map((_, i) => (
                              <DropdownMenuItem key={i + 1} onClick={() => console.log(`Ranked ${i + 1}`)}>
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {i + 1}
                                {i === 0 ? "st" : i === 1 ? "nd" : "rd"} Place
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="outline">
                          💸 Tip
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
