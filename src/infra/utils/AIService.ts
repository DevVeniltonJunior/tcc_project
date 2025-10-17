import https from "https"
import { ServiceException } from "@/infra/exceptions"

export interface AIResponse {
  text: string
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface OpenRouterResponse {
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

export class AIService {
  private readonly apiKey: string
  private readonly defaultModel = "mistralai/mistral-7b-instruct"
  private readonly timeout = 30000

  constructor(apiKey?: string) {
    const key = apiKey || process.env.AI_KEY
    if (!key) throw new ServiceException("Missing OpenRouter API key")
    this.apiKey = key
  }

  async generate(prompt: string, model: string = this.defaultModel): Promise<AIResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new ServiceException("Prompt cannot be empty")
    }

    try {
      const data = await this.makeRequest({
        model,
        messages: [{ role: "user", content: prompt }],
      })

      if (!this.isValidResponse(data)) {
        throw new ServiceException("Invalid response format from OpenRouter API")
      }

      return this.mapResponse(data)
    } catch (error) {
      if (error instanceof ServiceException) {
        throw error
      }

      throw new ServiceException(
        `Failed to generate AI response: ${(error as Error).message}`
      )
    }
  }

  private makeRequest(body: any): Promise<OpenRouterResponse> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body)

      const options = {
        hostname: "openrouter.ai",
        port: 443,
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": process.env.APP_NAME || "TCC Project",
        },
        timeout: this.timeout,
      }

      const req = https.request(options, (res) => {
        let responseData = ""

        res.on("data", (chunk) => {
          responseData += chunk
        })

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(responseData)
              resolve(jsonData)
            } catch (error) {
              reject(new Error(`Failed to parse response: ${(error as Error).message}`))
            }
          } else {
            reject(
              new ServiceException(
                `OpenRouter API error: ${res.statusCode} - ${responseData}`
              )
            )
          }
        })
      })

      req.on("error", (error) => {
        reject(error)
      })

      req.on("timeout", () => {
        req.destroy()
        reject(new ServiceException("Request timeout - AI service took too long to respond"))
      })

      req.write(postData)
      req.end()
    })
  }

  private isValidResponse(data: any): data is OpenRouterResponse {
    return (
      data &&
      typeof data === "object" &&
      typeof data.model === "string" &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
    )
  }

  private mapResponse(data: OpenRouterResponse): AIResponse {
    return {
      text: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }
}
