import { FolderOpen, MessageSquare, DollarSign, Sparkles } from "lucide-react"

export function ProfileStats() {
  const stats = [
    { label: "Projects", value: "3", icon: FolderOpen, color: "text-primary" },
    { label: "Feedbacks Given", value: "24", icon: MessageSquare, color: "text-secondary" },
    { label: "Tips Received", value: "12 SOL", icon: DollarSign, color: "text-accent" },
    { label: "AI Credits", value: "5/5", icon: Sparkles, color: "text-success" },
  ]

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
