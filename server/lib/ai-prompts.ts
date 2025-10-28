export const projectReviewPrompt = (project: {
  title: string
  description: string
  category: string
  techStack: string[]
  repoUrl?: string | null
  projectUrl?: string | null
}) => `You are reviewing a project submitted to Gimme Idea.
Provide a JSON response with the following structure:
{
  "score": number (0-100),
  "strengths": string[] (3 items),
  "improvements": string[] (3 items),
  "marketPotential": string,
  "technicalAssessment": string
}

Project details:
Title: ${project.title}
Category: ${project.category}
Tech stack: ${project.techStack.join(", ") || "Not provided"}
Repository: ${project.repoUrl ?? "Not provided"}
Project URL: ${project.projectUrl ?? "Not provided"}
Description:
${project.description}`
