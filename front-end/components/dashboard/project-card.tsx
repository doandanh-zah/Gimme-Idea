"use client"

import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, MessageSquare, Sparkles } from "lucide-react"

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    coverImage?: string
    category: string
    tags: string[]
    aiScore?: number
    views: number
    feedbackCount: number
    creator: {
      username: string
      avatar?: string
    }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          <Image
            src={project.coverImage || "/placeholder.svg?height=200&width=400"}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* AI Score Badge */}
          {project.aiScore && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full glass text-white">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-bold">{project.aiScore}</span>
            </div>
          )}

          {/* Category Badge */}
          <Badge className="absolute top-3 left-3 bg-primary/90">{project.category}</Badge>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={project.creator.avatar || "/placeholder.svg"} />
                <AvatarFallback>{project.creator.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{project.creator.username}</span>
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
        </div>
      </div>
    </Link>
  )
}
