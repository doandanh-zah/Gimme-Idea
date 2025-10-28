"use client"

import { useState } from "react"
import { Sparkles, ChevronDown, ChevronUp, CheckCircle, TrendingUp, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AIReviewPanelProps {
  review: any
}

export function AIReviewPanel({ review }: AIReviewPanelProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Review</h3>
              <p className="text-sm text-muted-foreground">Powered by advanced AI analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{review.score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <p className="text-muted-foreground leading-relaxed">{review.summary}</p>
          </div>

          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <h4 className="font-bold">Strengths</h4>
            </div>
            <ul className="space-y-2">
              {review.strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-success mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h4 className="font-bold">Areas for Improvement</h4>
            </div>
            <ul className="space-y-2">
              {review.improvements.map((improvement: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-1">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Suggestions</h4>
            </div>
            <ul className="space-y-2">
              {review.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">💡</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
