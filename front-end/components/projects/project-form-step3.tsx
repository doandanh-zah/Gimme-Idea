"use client"

import { useState, useEffect } from "react"
import { Sparkles, CheckCircle, TrendingUp, AlertCircle, Lightbulb } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ProjectFormStep3Props {
  data: any
}

export function ProjectFormStep3({ data }: ProjectFormStep3Props) {
  const [analyzing, setAnalyzing] = useState(true)
  const [progress, setProgress] = useState(0)
  const [aiReview, setAiReview] = useState<any>(null)

  useEffect(() => {
    // Simulate AI analysis
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setAnalyzing(false)
          // Mock AI review data
          setAiReview({
            score: 87,
            strengths: [
              "Clear and compelling project description",
              "Well-defined target audience",
              "Strong technical foundation with modern stack",
            ],
            improvements: [
              "Add more details about tokenomics",
              "Include roadmap and milestones",
              "Provide more information about the team",
            ],
            suggestions: [
              "Consider adding a demo video",
              "Create a detailed whitepaper",
              "Set up social media presence",
            ],
          })
          return 100
        }
        return prev + 10
      })
    }, 300)

    return () => clearInterval(timer)
  }, [])

  if (analyzing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Analyzing Your Project</h2>
          <p className="text-muted-foreground mb-8">Our AI is reviewing your project details...</p>
          <Progress value={progress} className="h-3 max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">{progress}% Complete</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
          <span className="text-3xl font-bold text-white">{aiReview.score}</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">AI Review Complete</h2>
        <p className="text-muted-foreground">Here's what our AI thinks about your project</p>
      </div>

      {/* Strengths */}
      <div className="p-6 rounded-xl bg-success/10 border border-success/30">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-success" />
          <h3 className="font-bold text-lg">Strengths</h3>
        </div>
        <ul className="space-y-2">
          {aiReview.strengths.map((strength: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-success mt-1">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="p-6 rounded-xl bg-accent/10 border border-accent/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-lg">Areas for Improvement</h3>
        </div>
        <ul className="space-y-2">
          {aiReview.improvements.map((improvement: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-accent mt-1">•</span>
              <span>{improvement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggestions */}
      <div className="p-6 rounded-xl bg-primary/10 border border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Suggestions</h3>
        </div>
        <ul className="space-y-2">
          {aiReview.suggestions.map((suggestion: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-muted border border-border flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          You can publish your project now or save it as a draft to make improvements based on the AI feedback.
        </p>
      </div>
    </div>
  )
}
