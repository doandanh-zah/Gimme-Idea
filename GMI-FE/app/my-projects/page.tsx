"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post-card"
import { useAppStore } from "@/lib/stores/app-store"
import { getUserPosts } from "@/lib/actions/post-actions"
import { Plus, Loader2 } from "lucide-react"

export default function MyProjectsPage() {
  const router = useRouter()
  const { wallet, hasAccess } = useAppStore()
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!hasAccess) {
      router.push("/")
      return
    }
    if (!wallet.connected) {
      router.push("/connect")
      return
    }

    const fetchMyPosts = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await getUserPosts(wallet.address!)
        setMyPosts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts")
        console.error("Error fetching posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMyPosts()
  }, [wallet.connected, wallet.address, hasAccess, router])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Loading your projects...</p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        ) : myPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any projects yet</p>
            <Link href="/create">
              <Button>Create Your First Project</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                description={post.short_description || post.description}
                imageUrl={post.image_url}
                category={post.category}
                prizePoolAmount={post.prize_pool_amount}
                commentsCount={0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
