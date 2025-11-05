"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/navbar"
import { useAppStore } from "@/lib/stores/app-store"
import { uploadPostImage } from "@/lib/actions/image-actions"
import { createPost } from "@/lib/actions/post-actions"
import { getCachedSignature } from "@/lib/auth/sign-message"
import { Upload, X, AlertCircle } from "lucide-react"

const CATEGORIES = [
  { name: "DeFi", description: "Decentralized Finance protocols and applications" },
  { name: "NFT", description: "Non-Fungible Token projects and platforms" },
  { name: "Gaming", description: "Web3 gaming and play-to-earn projects" },
  { name: "Web3 Infrastructure", description: "Core infrastructure and protocols" },
  { name: "Wallet", description: "Wallet solutions and crypto management" },
  { name: "DAO", description: "Decentralized Autonomous Organizations" },
  { name: "Layer 2", description: "Scaling solutions and layer 2s" },
  { name: "Staking", description: "Staking protocols and services" },
  { name: "Bridge", description: "Cross-chain bridge solutions" },
  { name: "Metaverse", description: "Metaverse and virtual world projects" },
  { name: "Social", description: "Social media and community platforms" },
  { name: "Education", description: "Web3 education and learning platforms" },
  { name: "Tools", description: "Developer tools and utilities" },
  { name: "Other", description: "Other Web3 projects" },
]

export default function CreatePost() {
  const router = useRouter()
  const wallet = useWallet()
  const { wallet: appWallet, addPost, hasAccess } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState("")
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    if (!hasAccess) {
      router.push("/")
      return
    }
    if (!appWallet.connected) {
      router.push("/connect")
    }
  }, [appWallet.connected, hasAccess, router])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectLink: "",
    category: "DeFi",
  })

  const [prizePool, setPrizePool] = useState({
    enabled: false,
    amount: "",
    winnerCount: "1",
    distribution: {} as Record<number, string>,
    endsAt: "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must be less than 10MB")
        return
      }
      setImageFile(file)
      setUploadError("")
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setUploadError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePrizeDistributionChange = (rank: number, amount: string) => {
    setPrizePool((prev) => ({
      ...prev,
      distribution: { ...prev.distribution, [rank]: amount },
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) return "Project name is required"
    if (!formData.description.trim()) return "Description is required"
    if (!formData.projectLink.trim()) return "Project link is required"
    if (!imageFile && !imagePreview) return "Project image is required"

    if (prizePool.enabled) {
      if (!prizePool.amount) return "Prize pool amount is required"
      const totalDistribution = Object.values(prizePool.distribution).reduce(
        (sum, val) => sum + Number.parseFloat(val || "0"),
        0,
      )
      if (totalDistribution <= 0) return "Prize distribution amounts must sum to at least 1 SOL"
      if (totalDistribution !== Number.parseFloat(prizePool.amount))
        return "Prize distribution must equal total prize pool"
    }

    return ""
  }

  const handleSubmit = async (e: React.FormEvent, withPrizes: boolean) => {
    e.preventDefault()
    setFormError("")
    setUploadError("")
    setLoading(true)
    setLoadingMessage("Preparing...")

    try {
      // Validate form
      const error = validateForm()
      if (error) {
        setFormError(error)
        setLoading(false)
        setLoadingMessage("")
        return
      }

      // Get wallet signature from cache (used for both upload and createPost)
      const cached = getCachedSignature(appWallet.address || '')
      if (!cached) {
        throw new Error('Wallet signature not found. Please reconnect your wallet.')
      }

      let imageUrl = "/project-management-team.png"

      // Upload image to Supabase Storage
      if (imageFile) {
        setLoadingMessage("Compressing and uploading image...")
        imageUrl = await uploadPostImage(imageFile, appWallet.address || '', cached.signature, cached.message)
      }

      // Create the post first - match backend CreatePostInput type
      setLoadingMessage("Creating post...")
      const postInput: any = {
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl,
        projectLink: formData.projectLink,
        category: formData.category,
      }

      // Add prize pool if enabled
      if (withPrizes && prizePool.amount) {
        const winnerCount = Number.parseInt(prizePool.winnerCount)
        const distribution = Array.from({ length: winnerCount }, (_, i) => ({
          rank: i + 1,
          amount: Number.parseFloat(prizePool.distribution[i + 1] || "0")
        }))

        postInput.prizePool = {
          totalAmount: Number.parseFloat(prizePool.amount),
          winnersCount: winnerCount,
          distribution: distribution,
          endsAt: prizePool.endsAt ? new Date(prizePool.endsAt).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days
        }
      }

      const newPost = await createPost(postInput, appWallet.address || '', cached.signature, cached.message)

      console.log("[v0] Post created successfully:", newPost.id)

      setLoadingMessage("Success! Redirecting...")
      // Store will auto-transform backend camelCase to snake_case
      addPost(newPost)
      setLoading(false)
      setLoadingMessage("")
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post"
      setFormError(message)
      setLoading(false)
      setLoadingMessage("")
    }
  }

  const selectedCategory = CATEGORIES.find((cat) => cat.name === formData.category)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

        <form className="space-y-6">
          {/* Form Error Alert */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Project Image */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Image *</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-64 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click or drag to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
            {uploadError && <p className="text-xs text-destructive mt-2">{uploadError}</p>}
          </div>

          {/* Project Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Name *</label>
            <Input
              placeholder="My awesome project"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description *</label>
            <Textarea
              placeholder="What's your project about?"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          {/* Project Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Project Link *</label>
            <Input
              type="url"
              placeholder="https://..."
              value={formData.projectLink}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  projectLink: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {selectedCategory && <p className="text-xs text-muted-foreground mt-2">{selectedCategory.description}</p>}
          </div>

          {/* Prize Pool */}
          <Card className="p-4 space-y-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enable-prizes"
                checked={prizePool.enabled}
                onChange={(e) => setPrizePool((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              <label htmlFor="enable-prizes" className="font-medium cursor-pointer">
                Setup Prize Pool (Optional)
              </label>
            </div>

            {prizePool.enabled && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Reward the best feedback with SOL prizes</p>

                <div>
                  <label className="text-sm font-medium mb-2 block">Total Prize Pool (SOL)</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="100"
                    value={prizePool.amount}
                    onChange={(e) =>
                      setPrizePool((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Winners</label>
                  <select
                    value={prizePool.winnerCount}
                    onChange={(e) =>
                      setPrizePool((prev) => ({
                        ...prev,
                        winnerCount: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="1">1 Winner</option>
                    <option value="3">Top 3</option>
                    <option value="5">Top 5</option>
                  </select>
                </div>

                {/* Prize Distribution */}
                <div className="space-y-2 bg-background/50 p-3 rounded">
                  {Array.from({ length: Number.parseInt(prizePool.winnerCount) }).map((_, i) => (
                    <div key={i + 1} className="flex gap-2 items-center">
                      <span className="text-sm font-medium w-12">
                        {i + 1}
                        {i === 0 ? "st" : i === 1 ? "nd" : "rd"}:
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="50"
                        value={prizePool.distribution[i + 1] || ""}
                        onChange={(e) => handlePrizeDistributionChange(i + 1, e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">SOL</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Contest Ends</label>
                  <Input
                    type="datetime-local"
                    value={prizePool.endsAt}
                    onChange={(e) => setPrizePool((prev) => ({ ...prev, endsAt: e.target.value }))}
                  />
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    Prize pool can be locked later via blockchain transaction
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Card>

          {/* Loading Message */}
          {loadingMessage && (
            <div className="text-center text-sm text-muted-foreground py-2">
              {loadingMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={(e) => handleSubmit(e, false)} disabled={loading || !formData.title} isLoading={loading}>
              {loading ? loadingMessage || "Processing..." : "Post without Prizes"}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e, prizePool.enabled)}
              disabled={loading || (prizePool.enabled && !prizePool.amount)}
              isLoading={loading}
            >
              {loading
                ? loadingMessage || "Processing..."
                : prizePool.enabled
                  ? `Post with Prizes (${prizePool.amount} SOL)`
                  : "Post Project"
              }
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
