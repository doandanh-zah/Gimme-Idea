"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProjectStore } from "@/lib/stores/project-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import MatrixBackground from "@/components/matrix-background"
import Header from "@/components/layout/header"
import FeedbackCard from "@/components/features/feedback-card"
import FeedbackForm from "@/components/features/feedback-form"
import { apiClient } from "@/lib/api-client"
import { Loader2, Eye, Bookmark, Calendar, DollarSign, Tag, ExternalLink, Edit } from "lucide-react"
import { toast } from "sonner"
import type { Feedback } from "@/lib/types"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { currentProject, isLoading, fetchProjectById, bookmarkProject } = useProjectStore()
  const { user, isAuthenticated } = useAuthStore()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  useEffect(() => {
    if (projectId) {
      console.log("[v0] 🔄 Fetching project:", projectId)
      fetchProjectById(projectId)
      loadFeedback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadFeedback = async () => {
    setLoadingFeedback(true)
    try {
      const response = await apiClient.getProjectFeedback(projectId)
      // Backend returns { feedback: [...] }
      setFeedbacks(response.feedback || response || [])
    } catch (error) {
      console.error("[v0] Failed to load feedback:", error)
      setFeedbacks([])
    } finally {
      setLoadingFeedback(false)
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to bookmark projects")
      router.push("/login")
      return
    }

    try {
      await bookmarkProject(projectId)
      toast.success(currentProject?.isBookmarked ? "Bookmark removed" : "Project bookmarked!")
    } catch (error) {
      toast.error("Failed to bookmark project")
    }
  }

  const handleEdit = () => {
    router.push(`/project/${projectId}/edit`)
  }

  if (isLoading) {
    return (
      <>
        <MatrixBackground />
        <Header />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </>
    )
  }

  if (!currentProject) {
    return (
      <>
        <MatrixBackground />
        <Header />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl text-white mb-4">Project not found</h1>
            <button
              onClick={() => router.push("/browse")}
              className="px-6 py-3 bg-primary text-black rounded font-semibold hover:shadow-lg transition-all"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </>
    )
  }

  const isOwner = user?.id === currentProject.userId

  return (
    <>
      <MatrixBackground />
      <Header />

      <div className="relative z-10 min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Project Header */}
          <div className="bg-card rounded-lg p-8 mb-8 border-2 border-primary/20">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-primary mb-4">{currentProject.title}</h1>
                <div className="flex items-center gap-4 text-gray text-sm">
                  <span className="flex items-center gap-1">
                    <Eye size={16} />
                    {currentProject.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(currentProject.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={16} />
                    {currentProject.bountyAmount} bounty
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwner && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-input text-white rounded hover:bg-primary hover:text-black transition-all duration-300 flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                )}
                <button
                  onClick={handleBookmark}
                  className={`px-4 py-2 rounded transition-all duration-300 flex items-center gap-2 ${
                    currentProject.isBookmarked
                      ? "bg-primary text-black"
                      : "bg-input text-white hover:bg-primary hover:text-black"
                  }`}
                >
                  <Bookmark size={18} fill={currentProject.isBookmarked ? "currentColor" : "none"} />
                  {currentProject.isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </div>

            {/* Tags */}
            {currentProject.tags && currentProject.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {currentProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-input text-primary rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-white leading-relaxed whitespace-pre-wrap">{currentProject.description}</p>
            </div>

            {/* Demo Link */}
            {currentProject.demoUrl && (
              <a
                href={currentProject.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black rounded font-semibold hover:shadow-lg transition-all"
              >
                <ExternalLink size={18} />
                View Demo
              </a>
            )}
          </div>

          {/* Feedback Section */}
          <div className="bg-card rounded-lg p-8 border-2 border-primary/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Feedback ({feedbacks.length})</h2>
              {isAuthenticated && !isOwner && (
                <button
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  className="px-6 py-2 bg-primary text-black rounded font-semibold hover:shadow-lg transition-all"
                >
                  {showFeedbackForm ? "Cancel" : "Give Feedback"}
                </button>
              )}
            </div>

            {showFeedbackForm && (
              <div className="mb-8">
                <FeedbackForm
                  projectId={projectId}
                  onSuccess={() => {
                    setShowFeedbackForm(false)
                    loadFeedback()
                  }}
                />
              </div>
            )}

            {loadingFeedback ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : !feedbacks || feedbacks.length === 0 ? (
              <p className="text-gray text-center py-8">No feedback yet. Be the first to provide feedback!</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} isOwner={isOwner} onUpdate={loadFeedback} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
