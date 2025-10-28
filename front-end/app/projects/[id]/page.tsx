import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectDetailHeader } from "@/components/projects/project-detail-header"
import { AIReviewPanel } from "@/components/projects/ai-review-panel"
import { FeedbackThread } from "@/components/projects/feedback-thread"
import { ProjectInfoPanel } from "@/components/projects/project-info-panel"
import { FeedbackInput } from "@/components/projects/feedback-input"

// Mock data
const mockProject = {
  id: "1",
  title: "DeFi Lending Protocol",
  description:
    "A decentralized lending platform with innovative collateral mechanisms that allows users to borrow and lend crypto assets with competitive rates.",
  coverImage: "/defi-protocol.png",
  category: "DeFi",
  tags: ["Solana", "Smart Contracts", "DeFi"],
  projectUrl: "https://defi-protocol.example.com",
  githubUrl: "https://github.com/example/defi-protocol",
  techStack: ["Solana", "Rust", "React", "TypeScript"],
  views: 1234,
  feedbackCount: 23,
  creator: {
    id: "user1",
    username: "alice_dev",
    avatar: "/diverse-avatars.png",
  },
  aiReview: {
    score: 87,
    strengths: [
      "Innovative collateral mechanism",
      "Strong security measures",
      "Clear documentation",
      "Active development",
    ],
    improvements: ["Add more test coverage", "Improve UI/UX", "Expand documentation"],
    suggestions: ["Consider multi-chain support", "Add governance features", "Implement liquidation protection"],
    summary:
      "This is a well-structured DeFi lending protocol with innovative features. The codebase is clean and the documentation is comprehensive. Focus on improving test coverage and user experience.",
  },
}

const mockFeedbacks = [
  {
    id: "1",
    user: {
      username: "bob_reviewer",
      avatar: "/pandora-ocean-scene.png",
    },
    content:
      "Great project! The collateral mechanism is really innovative. Have you considered adding support for more asset types?",
    createdAt: new Date("2025-01-15"),
    reactions: { "👍": 5, "❤️": 3 },
    replies: [
      {
        id: "2",
        user: {
          username: "alice_dev",
          avatar: "/diverse-avatars.png",
        },
        content: "Thanks! Yes, we're planning to add support for NFTs as collateral in the next version.",
        createdAt: new Date("2025-01-15"),
        reactions: { "👍": 2 },
      },
    ],
  },
  {
    id: "3",
    user: {
      username: "charlie_dev",
      avatar: "/diverse-group-futuristic-setting.png",
    },
    content: "The smart contract code looks solid. I'd suggest adding more edge case tests for the liquidation logic.",
    createdAt: new Date("2025-01-16"),
    reactions: { "👍": 8, "🔥": 2 },
    replies: [],
  },
]

export default function ProjectDetailPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="pt-16">
        <ProjectDetailHeader project={mockProject} />

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Feedback Panel */}
            <div className="lg:col-span-2 space-y-6">
              <AIReviewPanel review={mockProject.aiReview} />

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Community Feedback ({mockFeedbacks.length})</h2>
                {mockFeedbacks.map((feedback) => (
                  <FeedbackThread key={feedback.id} feedback={feedback} />
                ))}
              </div>

              <FeedbackInput projectId={mockProject.id} />
            </div>

            {/* Right: Info Panel */}
            <div className="lg:col-span-1">
              <ProjectInfoPanel project={mockProject} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
