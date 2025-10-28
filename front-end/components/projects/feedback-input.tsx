"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send } from "lucide-react"

interface FeedbackInputProps {
  projectId: string
}

export function FeedbackInput({ projectId }: FeedbackInputProps) {
  const [content, setContent] = useState("")
  const [aiAssist, setAiAssist] = useState(false)

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-bold mb-4">Leave Feedback</h3>

      <Textarea
        placeholder="Share your thoughts, suggestions, or questions..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="mb-4"
      />

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setAiAssist(!aiAssist)}>
          <Sparkles className="w-4 h-4 mr-2" />
          AI Assist {aiAssist && "✓"}
        </Button>

        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Send className="w-4 h-4 mr-2" />
          Send Feedback
        </Button>
      </div>
    </div>
  )
}
