const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gimmeidea.com/api"

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

type Project = {}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || "An error occurred" }
      }

      return { data }
    } catch (error) {
      return { error: "Network error occurred" }
    }
  }

  // Auth endpoints
  async register(email: string, password: string, username: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    })
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  async getMe() {
    return this.request("/auth/me")
  }

  // Wallet endpoints
  async connectWallet(walletType: string, address: string) {
    return this.request("/wallet/connect", {
      method: "POST",
      body: JSON.stringify({ walletType, address }),
    })
  }

  async disconnectWallet() {
    return this.request("/wallet/disconnect", { method: "POST" })
  }

  // Project endpoints
  async getProjects(params?: {
    page?: number
    category?: string
    sort?: string
    search?: string
  }) {
    const queryString = new URLSearchParams(params as Record<string, string>).toString()
    return this.request(`/projects?${queryString}`)
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`)
  }

  async createProject(data: Partial<Project>) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: "DELETE" })
  }

  // Feedback endpoints
  async getFeedbacks(projectId: string) {
    return this.request(`/projects/${projectId}/feedbacks`)
  }

  async createFeedback(projectId: string, content: string, parentId?: string) {
    return this.request(`/projects/${projectId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ content, parentId }),
    })
  }

  async tipFeedback(feedbackId: string, amount: number) {
    return this.request(`/feedbacks/${feedbackId}/tip`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  // AI endpoints
  async getAIReview(projectId: string) {
    return this.request(`/ai/review`, {
      method: "POST",
      body: JSON.stringify({ projectId }),
    })
  }

  async chatWithAI(projectId: string, message: string) {
    return this.request(`/ai/chat`, {
      method: "POST",
      body: JSON.stringify({ projectId, message }),
    })
  }
}

export const api = new ApiClient(API_URL)
