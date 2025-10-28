import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Users, Award } from "lucide-react"

const trendingProjects = [
  { id: "1", title: "DeFi Lending Protocol", score: 92 },
  { id: "2", title: "NFT Marketplace", score: 87 },
  { id: "3", title: "GameFi Platform", score: 85 },
]

const topContributors = [
  { username: "alice_dev", feedbacks: 234, avatar: "/diverse-avatars.png" },
  { username: "bob_creator", feedbacks: 189, avatar: "/pandora-ocean-scene.png" },
  { username: "charlie_games", feedbacks: 156, avatar: "/diverse-group-futuristic-setting.png" },
]

export function RightPanel() {
  return (
    <div className="space-y-6 sticky top-24">
      {/* Trending Projects */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Trending Projects</h3>
        </div>
        <div className="space-y-3">
          {trendingProjects.map((project, index) => (
            <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.title}</p>
                <p className="text-xs text-muted-foreground">Score: {project.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent" />
          <h3 className="font-bold">Top Contributors</h3>
        </div>
        <div className="space-y-3">
          {topContributors.map((contributor) => (
            <div
              key={contributor.username}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={contributor.avatar || "/placeholder.svg"} />
                <AvatarFallback>{contributor.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contributor.username}</p>
                <p className="text-xs text-muted-foreground">{contributor.feedbacks} feedbacks</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Stats */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Your Stats</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Projects</span>
            <span className="text-2xl font-bold">3</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Feedbacks Given</span>
            <span className="text-2xl font-bold">24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tips Received</span>
            <span className="text-2xl font-bold">12 SOL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
