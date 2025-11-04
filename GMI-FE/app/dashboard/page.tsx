/**
 * TEMPLATE: New Dashboard Page
 * Copy this to: app/dashboard/page.tsx
 *
 * Changes:
 * - Removed getAllPosts Server Action
 * - Added API.Posts.getPosts
 * - Updated to handle GMI-BE response format
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PostCard } from "@/components/post-card"
import { Navbar } from "@/components/navbar"
import { useAppStore } from "@/lib/stores/app-store"
import { getPosts } from "@/lib/actions/post-actions"
import { Plus, Loader2 } from "lucide-react"

const CATEGORIES = [
  "All",
  "DeFi",
  "NFT",
  "Gaming",
  "Web3 Infrastructure",
  "Wallet",
  "DAO",
  "Layer 2",
  "Staking",
  "Bridge",
  "Metaverse",
  "Social",
  "Education",
  "Tools",
  "Other",
]

export default function Dashboard() {
  const router = useRouter()
  const { wallet } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!wallet.connected) {
      router.push("/")
    }
  }, [wallet.connected, router])

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError("")

      try {
        // Call GMI-BE API via action layer
        const response = await getPosts({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          page: 1,
          limit: 50
        })

        // post-actions returns the unwrapped backend response: {success: true, data: {posts: [...], total, ...}}
        setPosts(response.data.posts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts")
        console.error("[Dashboard] Error fetching posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [selectedCategory])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="cursor-pointer whitespace-nowrap"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => setSelectedCategory(selectedCategory)}>Retry</Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No projects yet in {selectedCategory}</p>
              <Link href="/create">
                <Button>Create the first project</Button>
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                description={post.description}
                imageUrl={post.imageUrl}
                category={post.category}
                prizePoolAmount={post.prizePool?.totalAmount}
                commentsCount={post._count?.comments || 0}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
