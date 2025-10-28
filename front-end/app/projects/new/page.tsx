"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectFormStep1 } from "@/components/projects/project-form-step1"
import { ProjectFormStep2 } from "@/components/projects/project-form-step2"
import { ProjectFormStep3 } from "@/components/projects/project-form-step3"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const STEPS = ["Basic Info", "Details & Links", "AI Review"]

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: null,
    category: "",
    tags: [],
    projectUrl: "",
    githubUrl: "",
    techStack: [],
    feedbackNeeded: "",
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData({ ...formData, ...data })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Launch Your Project</h1>
            <p className="text-muted-foreground">Get AI-powered feedback and community insights</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 ${
                      index <= currentStep ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index <= currentStep
                          ? "bg-gradient-to-br from-primary to-secondary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="font-medium hidden sm:inline">{step}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-12 sm:w-24 h-0.5 bg-muted mx-2 sm:mx-4">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                        style={{ width: index < currentStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Form Steps */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-6">
            {currentStep === 0 && <ProjectFormStep1 data={formData} updateData={updateFormData} />}
            {currentStep === 1 && <ProjectFormStep2 data={formData} updateData={updateFormData} />}
            {currentStep === 2 && <ProjectFormStep3 data={formData} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0} size="lg">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button variant="ghost" size="lg">
              Save Draft
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Publish Project
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
