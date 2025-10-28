"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ProjectFormStep2Props {
  data: any
  updateData: (data: any) => void
}

export function ProjectFormStep2({ data, updateData }: ProjectFormStep2Props) {
  const [techInput, setTechInput] = useState("")

  const addTech = () => {
    if (techInput.trim() && data.techStack.length < 10) {
      updateData({ techStack: [...data.techStack, techInput.trim()] })
      setTechInput("")
    }
  }

  const removeTech = (index: number) => {
    updateData({ techStack: data.techStack.filter((_: any, i: number) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Links & Details</h2>
        <p className="text-muted-foreground">Add more information about your project</p>
      </div>

      {/* Project URL */}
      <div className="space-y-2">
        <Label htmlFor="projectUrl">Project URL</Label>
        <Input
          id="projectUrl"
          type="url"
          placeholder="https://yourproject.com"
          value={data.projectUrl}
          onChange={(e) => updateData({ projectUrl: e.target.value })}
          className="h-12"
        />
      </div>

      {/* GitHub URL */}
      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub Repository</Label>
        <Input
          id="githubUrl"
          type="url"
          placeholder="https://github.com/username/repo"
          value={data.githubUrl}
          onChange={(e) => updateData({ githubUrl: e.target.value })}
          className="h-12"
        />
      </div>

      {/* Tech Stack */}
      <div className="space-y-2">
        <Label htmlFor="techStack">Tech Stack (up to 10)</Label>
        <div className="flex gap-2">
          <Input
            id="techStack"
            placeholder="e.g., React, Solana, TypeScript"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            className="h-12"
          />
          <Button type="button" onClick={addTech} disabled={data.techStack.length >= 10}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.techStack.map((tech: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm flex items-center gap-2"
            >
              {tech}
              <button onClick={() => removeTech(index)} className="hover:text-error">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Feedback Needed */}
      <div className="space-y-2">
        <Label htmlFor="feedbackNeeded">
          What feedback are you looking for? <span className="text-error">*</span>
        </Label>
        <Textarea
          id="feedbackNeeded"
          placeholder="Tell us what specific areas you'd like feedback on..."
          value={data.feedbackNeeded}
          onChange={(e) => updateData({ feedbackNeeded: e.target.value })}
          rows={6}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{data.feedbackNeeded.length}/500</p>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Be specific about what feedback you need. This helps our AI
          and community provide more valuable insights.
        </p>
      </div>
    </div>
  )
}
