import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MessageSquare, ExternalLink, Github } from "lucide-react"

interface ProjectDetailHeaderProps {
  project: any
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  return (
    <div className="relative h-80 overflow-hidden">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <Image
          src={project.coverImage || "/placeholder.svg?height=400&width=1200"}
          alt={project.title}
          fill
          className="object-cover blur-xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-end pb-8">
        <div className="flex items-end gap-6 w-full">
          {/* Cover Image */}
          <div className="hidden md:block relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-background shadow-2xl flex-shrink-0">
            <Image
              src={project.coverImage || "/placeholder.svg?height=200&width=200"}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary">{project.category}</Badge>
              {project.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-background/50">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold mb-3 text-balance">{project.title}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={project.creator.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{project.creator.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{project.creator.username}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{project.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{project.feedbackCount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {project.projectUrl && (
                <Button asChild variant="outline" className="bg-background/50">
                  <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Project
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button asChild variant="outline" className="bg-background/50">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
