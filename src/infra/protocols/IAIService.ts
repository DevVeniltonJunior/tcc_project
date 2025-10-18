import { AIResponse, AIStructuredResponse, JSONSchema } from "@/infra/protocols"

export interface IAIService {
  generate: (prompt: string, model?: string) => Promise<AIResponse>
  generateStructured: <T = any>(
    prompt: string,
    schema: JSONSchema,
    model?: string
  ) => Promise<AIStructuredResponse<T>>
}