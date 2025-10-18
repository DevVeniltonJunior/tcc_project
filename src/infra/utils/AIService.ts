import { ServiceException } from "@/infra/exceptions"
import { OpenRouterResponse, JSONSchema, AIStructuredResponse, AIResponse } from "@/infra/protocols"
import { openRouterApi } from "@/infra/config"

export class AIService {
  private readonly defaultModel = "mistralai/mistral-7b-instruct"

  constructor() {
    const apiKey = process.env.AI_KEY
    if (!apiKey) throw new ServiceException("Missing OpenRouter API key")
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

  async generateStructured<T = any>(
    prompt: string,
    schema: JSONSchema,
    model: string = this.defaultModel
  ): Promise<AIStructuredResponse<T>> {
    if (!prompt || prompt.trim().length === 0) {
      throw new ServiceException("Prompt cannot be empty")
    }

    if (!schema || typeof schema !== "object") {
      throw new ServiceException("Valid JSON schema is required")
    }

    try {
      const data = await this.makeRequest({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: true,
            schema: schema,
          },
        },
      })

      if (!this.isValidResponse(data)) {
        throw new ServiceException("Invalid response format from OpenRouter API")
      }

      const content = data.choices[0].message.content
      let parsedData: T

      try {
        parsedData = JSON.parse(content)
      } catch (error) {
        throw new ServiceException(
          `Failed to parse structured response as JSON: ${(error as Error).message}`
        )
      }

      return {
        data: parsedData,
        model: data.model,
        usage: data.usage
          ? {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens,
            }
          : undefined,
      }
    } catch (error) {
      if (error instanceof ServiceException) {
        throw error
      }

      throw new ServiceException(
        `Failed to generate structured AI response: ${(error as Error).message}`
      )
    }
  }

  private async makeRequest(body: any): Promise<OpenRouterResponse> {
    try {
      const response = await openRouterApi.post('/chat/completions', body)
      return response.data
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new ServiceException("Request timeout - AI service took too long to respond")
      }
      
      if (error.response) {
        throw new ServiceException(
          `OpenRouter API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        )
      }
      
      throw new ServiceException(
        `Failed to connect to OpenRouter API: ${error.message}`
      )
    }
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
