export interface AIResponse {
  text: string
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface AIStructuredResponse<T = any> {
  data: T
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface JSONSchema {
  title?: string
  description?: string
  type: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  [key: string]: any
  additionalProperties?: boolean
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}