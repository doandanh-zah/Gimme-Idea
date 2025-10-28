import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flag, Share2 } from "lucide-react"

interface ProjectInfoPanelProps {
  project: any
}

export function ProjectInfoPanel({ project }: ProjectInfoPanelProps) {
  return (
    <div className="space-y-6 sticky top-24">
      {/* Description */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-bold mb-3">About</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
      </div>

      {/* Tech Stack */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-bold mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech: string) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-bold mb-4">Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Views</span>
            <span className="font-semibold">{project.views.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Feedbacks</span>
            <span className="font-semibold">{project.feedbackCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">AI Score</span>
            <span className="font-semibold text-primary">{project.aiReview.score}/100</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full bg-transparent">
          <Share2 className="w-4 h-4 mr-2" />
          Share Project
        </Button>
        <Button variant="outline" className="w-full text-error bg-transparent">
          <Flag className="w-4 h-4 mr-2" />
          Report
        </Button>
      </div>
    </div>
  )
}
