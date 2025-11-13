/**
 * Base API Client for GMI-BE
 * Handles authentication headers and error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'GMI2025'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  requireAuth?: boolean
  walletAddress?: string
  walletSignature?: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success?: boolean
}

/**
 * Base API request function with authentication
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = false,
    walletAddress,
    walletSignature
  } = options

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-access-code': ACCESS_CODE,
    ...headers
  }

  // Add wallet authentication headers if provided
  if (walletAddress) {
    requestHeaders['x-wallet-address'] = walletAddress
  }

  if (walletSignature) {
    requestHeaders['x-wallet-signature'] = walletSignature
  }

  try {
    const url = `${API_URL}${endpoint}`
    console.log(`[API] ${method} ${url}`)
    console.log('[API] Headers:', { ...requestHeaders, 'x-access-code': requestHeaders['x-access-code'] })

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include' // Include cookies
    })

    // Check if response has content before parsing JSON
    const text = await response.text()
    console.log(`[API] Response status: ${response.status}`)
    console.log('[API] Response text:', text.substring(0, 200))

    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('[API Client] JSON parse error:', text)
      return {
        error: 'Invalid response from server',
        success: false
      }
    }

    if (!response.ok) {
      console.error('[API] Request failed:', data)
      return {
        error: data.error || `Request failed with status ${response.status}`,
        success: false
      }
    }

    console.log('[API] Success:', data)
    return {
      data,
      success: true
    }
  } catch (error) {
    console.error('[API Client] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Network error',
      success: false
    }
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body })
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body })
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}

/**
 * Upload file (multipart/form-data)
 */
export async function apiUpload<T = any>(
  endpoint: string,
  file: File,
  walletAddress: string,
  walletSignature: string,
  message?: string
): Promise<ApiResponse<T>> {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const headers: Record<string, string> = {
      'x-access-code': ACCESS_CODE,
      'x-wallet-address': walletAddress,
      'x-wallet-signature': walletSignature
    }

    // Send message via header for reliable transmission (base64 encode to handle newlines)
    if (message) {
      headers['x-wallet-message'] = btoa(message)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || 'Upload failed',
        success: false
      }
    }

    return {
      data,
      success: true
    }
  } catch (error) {
    console.error('[API Upload] Error:', error)
    return {
      error: error instanceof Error ? error.message : 'Upload error',
      success: false
    }
  }
}
