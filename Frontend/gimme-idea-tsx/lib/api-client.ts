// API Client with Axios configuration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface ApiError {
  message: string
  status: number
  errors?: any
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL

    // Load token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("authToken")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("authToken", token)
      } else {
        localStorage.removeItem("authToken")
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Try to parse JSON, but handle plain text responses (like rate limit errors)
      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error("[v0] Non-JSON response from", url, ":", text)
        throw new Error(text || "Server returned non-JSON response")
      }

      if (!response.ok) {
        const error: ApiError = {
          message: result.error || result.message || "An error occurred",
          status: response.status,
          errors: result.errors,
        }
        console.error("[v0] API Error Response:", {
          url,
          status: response.status,
          error: result,
        })
        throw error
      }

      // Backend returns { success: true, data: {...} }
      // Extract the data field
      return result.data || result
    } catch (error: any) {
      console.error("[v0] API Error for", url, ":", {
        message: error.message,
        error,
      })
      throw error
    }
  }

  // Auth endpoints
  async register(email: string, password: string, username: string) {
    return this.request<{ user: any; token: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ token: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  // User endpoints
  async getProfile() {
    return this.request<any>("/users/profile")
  }

  async updateProfile(data: any) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append("avatar", file)

    return this.request("/users/avatar", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async connectWallet(walletAddress: string, chainId: number) {
    return this.request("/users/connect-wallet", {
      method: "POST",
      body: JSON.stringify({ walletAddress, chainId }),
    })
  }

  async getUserById(id: string) {
    return this.request<any>(`/users/${id}`)
  }

  async followUser(id: string) {
    return this.request(`/users/${id}/follow`, { method: "POST" })
  }

  async getNotifications() {
    return this.request<any[]>("/users/notifications")
  }

  async markNotificationRead(id: string) {
    return this.request(`/users/notifications/${id}/read`, { method: "PUT" })
  }

  // Project endpoints
  async getProjects(params?: any) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request<any>(`/projects${queryString}`)
  }

  async getProjectById(id: string) {
    return this.request<any>(`/projects/${id}`)
  }

  async createProject(data: any) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: any) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: "DELETE" })
  }

  async incrementProjectView(id: string) {
    return this.request(`/projects/${id}/view`, { method: "POST" })
  }

  async bookmarkProject(id: string) {
    return this.request(`/projects/${id}/bookmark`, { method: "POST" })
  }

  async getBookmarkedProjects() {
    return this.request<any[]>("/projects/bookmarked")
  }

  // Feedback endpoints
  async getProjectFeedback(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/feedback`)
  }

  async createFeedback(projectId: string, content: any) {
    return this.request(`/projects/${projectId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  }

  async updateFeedback(id: string, content: any) {
    return this.request(`/feedback/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    })
  }

  async deleteFeedback(id: string) {
    return this.request(`/feedback/${id}`, { method: "DELETE" })
  }

  async approveFeedback(id: string, rewardAmount: number) {
    return this.request(`/feedback/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ rewardAmount }),
    })
  }

  async rejectFeedback(id: string, reason?: string) {
    return this.request(`/feedback/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // Payment endpoints
  async deposit(amount: number, projectId: string) {
    return this.request("/payments/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, projectId }),
    })
  }

  async withdraw(amount: number, method: string, details: any) {
    return this.request("/payments/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, method, details }),
    })
  }

  async getPaymentHistory(params?: any) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request<any>(`/payments/history${queryString}`)
  }

  async getBalance() {
    return this.request<{ balance: number }>("/payments/balance")
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
