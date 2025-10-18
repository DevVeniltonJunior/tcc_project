import { AIService } from "@/infra/utils/AIService"
import { ServiceException } from "@/infra/exceptions"
import { openRouterApi } from "@/infra/config"

jest.mock("@/infra/config", () => ({
  openRouterApi: {
    post: jest.fn()
  }
}))

const mockOpenRouterApi = openRouterApi as jest.Mocked<typeof openRouterApi>

beforeEach(() => {
  jest.clearAllMocks()
})

describe("[Utils] AIService", () => {
  describe("constructor", () => {
    it("should initialize with API key from environment variable", () => {
      process.env.AI_KEY = "env-api-key"
      const service = new AIService()
      expect(service).toBeInstanceOf(AIService)
      delete process.env.AI_KEY
    })

    it("should throw ServiceException if API key is missing", () => {
      delete process.env.AI_KEY
      expect(() => new AIService()).toThrow(ServiceException)
      expect(() => new AIService()).toThrow("Missing OpenRouter API key")
    })
  })

  describe("generate", () => {
    let service: AIService

    beforeEach(() => {
      process.env.AI_KEY = "test-api-key"
      service = new AIService()
    })

    it("should generate AI response successfully", async () => {
      const mockResponse = {
        id: "gen-123",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "This is an AI generated response",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const result = await service.generate("Test prompt")

      expect(result).toEqual({
        text: "This is an AI generated response",
        model: "mistralai/mistral-7b-instruct",
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      expect(mockOpenRouterApi.post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: "mistralai/mistral-7b-instruct",
          messages: [{ role: "user", content: "Test prompt" }],
        })
      )
    })

    it("should generate AI response with custom model", async () => {
      const mockResponse = {
        id: "gen-456",
        model: "openai/gpt-4",
        choices: [
          {
            message: {
              role: "assistant",
              content: "GPT-4 response",
            },
            finish_reason: "stop",
          },
        ],
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const result = await service.generate("Test prompt", "openai/gpt-4")

      expect(result).toEqual({
        text: "GPT-4 response",
        model: "openai/gpt-4",
        usage: undefined,
      })
    })

    it("should throw ServiceException if prompt is empty", async () => {
      await expect(service.generate("")).rejects.toThrow(ServiceException)
      await expect(service.generate("")).rejects.toThrow("Prompt cannot be empty")

      await expect(service.generate("   ")).rejects.toThrow(ServiceException)
      await expect(service.generate("   ")).rejects.toThrow("Prompt cannot be empty")

      expect(mockOpenRouterApi.post).not.toHaveBeenCalled()
    })

    it("should throw ServiceException if API returns error status", async () => {
      mockOpenRouterApi.post.mockRejectedValue({
        response: { status: 401, data: { error: "Unauthorized" } }
      })

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
    })

    it("should throw ServiceException if response format is invalid", async () => {
      const invalidResponse = {
        id: "gen-789",
        model: "mistralai/mistral-7b-instruct",
        choices: [], // Empty choices array
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: invalidResponse })

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        "Invalid response format from OpenRouter API"
      )
    })

    it("should handle response without usage information", async () => {
      const mockResponse = {
        id: "gen-888",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response without usage",
            },
            finish_reason: "stop",
          },
        ],
        // No usage field
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const result = await service.generate("Test prompt")

      expect(result).toEqual({
        text: "Response without usage",
        model: "mistralai/mistral-7b-instruct",
        usage: undefined,
      })
    })
  })

  describe("generateStructured", () => {
    let service: AIService

    beforeEach(() => {
      process.env.AI_KEY = "test-api-key"
      service = new AIService()
    })

    it("should generate structured AI response successfully", async () => {
      interface PersonData {
        name: string
        age: number
        email: string
      }

      const mockResponse = {
        id: "gen-123",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                name: "John Doe",
                age: 30,
                email: "john@example.com",
              }),
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          email: { type: "string", format: "email" },
        },
        required: ["name", "age", "email"],
      }

      const result = await service.generateStructured<PersonData>(
        "Extract person info",
        schema
      )

      expect(result.data).toEqual({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      })
      expect(result.model).toBe("mistralai/mistral-7b-instruct")
      expect(result.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      })

      expect(mockOpenRouterApi.post).toHaveBeenCalled()
    })

    it("should generate structured AI response with custom model", async () => {
      const mockResponse = {
        id: "gen-456",
        model: "openai/gpt-4",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({ result: "success" }),
            },
            finish_reason: "stop",
          },
        ],
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const schema = {
        type: "object",
        properties: {
          result: { type: "string" },
        },
        required: ["result"],
      }

      const result = await service.generateStructured(
        "Test prompt",
        schema,
        "openai/gpt-4"
      )

      expect(result.data).toEqual({ result: "success" })
      expect(result.model).toBe("openai/gpt-4")
      expect(result.usage).toBeUndefined()
    })

    it("should throw ServiceException if prompt is empty", async () => {
      const schema = { type: "object", properties: {} }

      await expect(service.generateStructured("", schema)).rejects.toThrow(
        ServiceException
      )
      await expect(service.generateStructured("", schema)).rejects.toThrow(
        "Prompt cannot be empty"
      )

      await expect(service.generateStructured("   ", schema)).rejects.toThrow(
        ServiceException
      )
      await expect(service.generateStructured("   ", schema)).rejects.toThrow(
        "Prompt cannot be empty"
      )

      expect(mockOpenRouterApi.post).not.toHaveBeenCalled()
    })

    it("should throw ServiceException if schema is invalid", async () => {
      await expect(
        service.generateStructured("Test prompt", null as any)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", null as any)
      ).rejects.toThrow("Valid JSON schema is required")

      await expect(
        service.generateStructured("Test prompt", undefined as any)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", undefined as any)
      ).rejects.toThrow("Valid JSON schema is required")

      expect(mockOpenRouterApi.post).not.toHaveBeenCalled()
    })

    it("should throw ServiceException if response is not valid JSON", async () => {
      const mockResponse = {
        id: "gen-789",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Not a valid JSON string",
            },
            finish_reason: "stop",
          },
        ],
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(/Failed to parse structured response as JSON/)
    })

    it("should throw ServiceException if API returns error status", async () => {
      mockOpenRouterApi.post.mockRejectedValue({
        response: { status: 401, data: { error: "Unauthorized" } }
      })

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
    })

    it("should throw ServiceException if response format is invalid", async () => {
      const invalidResponse = {
        id: "gen-999",
        model: "mistralai/mistral-7b-instruct",
        choices: [], // Empty choices array
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: invalidResponse })

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow("Invalid response format from OpenRouter API")
    })

    it("should handle response without usage information", async () => {
      const mockResponse = {
        id: "gen-no-usage",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({ status: "ok" }),
            },
            finish_reason: "stop",
          },
        ],
        // No usage field
      }

      mockOpenRouterApi.post.mockResolvedValue({ data: mockResponse })

      const schema = {
        type: "object",
        properties: {
          status: { type: "string" },
        },
      }

      const result = await service.generateStructured("Test prompt", schema)

      expect(result.data).toEqual({ status: "ok" })
      expect(result.usage).toBeUndefined()
    })
  })
})
