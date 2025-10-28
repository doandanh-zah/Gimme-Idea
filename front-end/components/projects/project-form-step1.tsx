"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PROJECT_CATEGORIES } from "@/lib/constants"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ProjectFormStep1Props {
  data: any
  updateData: (data: any) => void
}

export function ProjectFormStep1({ data, updateData }: ProjectFormStep1Props) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateData({ coverImage: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && data.tags.length < 5) {
      updateData({ tags: [...data.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    updateData({ tags: data.tags.filter((_: any, i: number) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Tell us about your project</p>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="relative">
          {coverPreview ? (
            <div className="relative h-48 rounded-xl overflow-hidden border-2 border-dashed border-border">
              <Image src={coverPreview || "/placeholder.svg"} alt="Cover preview" fill className="object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setCoverPreview(null)
                  updateData({ coverImage: null })
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors cursor-pointer bg-muted/30">
              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload cover image</span>
              <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Project Title <span className="text-error">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter your project title"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          maxLength={100}
          className="h-12"
        />
        <p className="text-xs text-muted-foreground text-right">{data.title.length}/100</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-error">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your project in detail..."
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={6}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{data.description.length}/1000</p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-error">*</span>
        </Label>
        <Select value={data.category} onValueChange={(value) => updateData({ category: value })}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (up to 5)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="h-12"
          />
          <Button type="button" onClick={addTag} disabled={data.tags.length >= 5}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button onClick={() => removeTag(index)} className="hover:text-error">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
