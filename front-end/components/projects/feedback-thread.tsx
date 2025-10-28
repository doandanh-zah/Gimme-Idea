"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, Heart, Flame, DollarSign } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface FeedbackThreadProps {
  feedback: any
}

export function FeedbackThread({ feedback }: FeedbackThreadProps) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      {/* Main feedback */}
      <div className="flex gap-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={feedback.user.avatar || "/placeholder.svg"} />
          <AvatarFallback>{feedback.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{feedback.user.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(feedback.createdAt, { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-4">{feedback.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs">{feedback.reactions["👍"] || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{feedback.reactions["❤️"] || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs">{feedback.reactions["🔥"] || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <MessageSquare className="w-4 h-4" />
              Reply
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1 ml-auto text-accent">
              <DollarSign className="w-4 h-4" />
              Tip
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {feedback.replies && feedback.replies.length > 0 && (
        <div className="mt-4 pl-14">
          {!showReplies ? (
            <Button variant="ghost" size="sm" onClick={() => setShowReplies(true)} className="text-primary">
              Show {feedback.replies.length} {feedback.replies.length === 1 ? "reply" : "replies"}
            </Button>
          ) : (
            <div className="space-y-4">
              {feedback.replies.map((reply: any) => (
                <div key={reply.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={reply.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{reply.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{reply.user.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setShowReplies(false)} className="text-muted-foreground">
                Hide replies
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
