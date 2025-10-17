import https from "https"
import { AIService } from "@/infra/utils/AIService"
import { ServiceException } from "@/infra/exceptions"
import { EventEmitter } from "events"

jest.mock("https")

class MockResponse extends EventEmitter {
  statusCode: number
  constructor(statusCode: number) {
    super()
    this.statusCode = statusCode
  }
}

class MockRequest extends EventEmitter {
  write = jest.fn()
  end = jest.fn()
  destroy = jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("[Utils] AIService", () => {
  describe("constructor", () => {
    it("should initialize with API key from constructor parameter", () => {
      const service = new AIService("test-api-key")
      expect(service).toBeInstanceOf(AIService)
    })

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
      service = new AIService("test-api-key")
    })

    const mockHttpsRequest = (statusCode: number, responseData: any) => {
      const mockReq = new MockRequest()
      const mockRes = new MockResponse(statusCode)

      ;(https.request as jest.Mock).mockImplementation((options, callback) => {
        if (callback) {
          process.nextTick(() => {
            callback(mockRes as any)
            process.nextTick(() => {
              mockRes.emit("data", JSON.stringify(responseData))
              mockRes.emit("end")
            })
          })
        }
        return mockReq as any
      })

      return mockReq
    }

    const mockHttpsError = (error: Error) => {
      const mockReq = new MockRequest()

      ;(https.request as jest.Mock).mockImplementation(() => {
        process.nextTick(() => {
          mockReq.emit("error", error)
        })
        return mockReq as any
      })

      return mockReq
    }

    const mockHttpsTimeout = () => {
      const mockReq = new MockRequest()

      ;(https.request as jest.Mock).mockImplementation(() => {
        process.nextTick(() => {
          mockReq.emit("timeout")
        })
        return mockReq as any
      })

      return mockReq
    }

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

      mockHttpsRequest(200, mockResponse)

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

      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "openrouter.ai",
          port: 443,
          path: "/api/v1/chat/completions",
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
        expect.any(Function)
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

      mockHttpsRequest(200, mockResponse)

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

      expect(https.request).not.toHaveBeenCalled()
    })

    it("should throw ServiceException if API returns error status", async () => {
      mockHttpsRequest(401, { error: "Unauthorized - Invalid API key" })

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        /OpenRouter API error: 401/
      )
    })

    it("should throw ServiceException if API returns rate limit error", async () => {
      mockHttpsRequest(429, { error: "Rate limit exceeded" })

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        /OpenRouter API error: 429/
      )
    })

    it("should throw ServiceException if response format is invalid", async () => {
      const invalidResponse = {
        id: "gen-789",
        model: "mistralai/mistral-7b-instruct",
        choices: [], // Empty choices array
      }

      mockHttpsRequest(200, invalidResponse)

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        "Invalid response format from OpenRouter API"
      )
    })

    it("should throw ServiceException if response is missing message content", async () => {
      const invalidResponse = {
        id: "gen-790",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              // Missing content field
            },
            finish_reason: "stop",
          },
        ],
      }

      mockHttpsRequest(200, invalidResponse)

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        "Invalid response format from OpenRouter API"
      )
    })

    it("should throw ServiceException on timeout", async () => {
      mockHttpsTimeout()

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        "Request timeout - AI service took too long to respond"
      )
    })

    it("should throw ServiceException on network error", async () => {
      mockHttpsError(new Error("Network connection failed"))

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        "Failed to generate AI response: Network connection failed"
      )
    })

    it("should include HTTP-Referer and X-Title headers from environment", async () => {
      process.env.APP_URL = "https://myapp.com"
      process.env.APP_NAME = "My TCC App"

      const mockResponse = {
        id: "gen-999",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response",
            },
            finish_reason: "stop",
          },
        ],
      }

      mockHttpsRequest(200, mockResponse)

      await service.generate("Test prompt")

      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "HTTP-Referer": "https://myapp.com",
            "X-Title": "My TCC App",
          }),
        }),
        expect.any(Function)
      )

      delete process.env.APP_URL
      delete process.env.APP_NAME
    })

    it("should use default headers if environment variables are not set", async () => {
      delete process.env.APP_URL
      delete process.env.APP_NAME

      const mockResponse = {
        id: "gen-1000",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response",
            },
            finish_reason: "stop",
          },
        ],
      }

      mockHttpsRequest(200, mockResponse)

      await service.generate("Test prompt")

      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "TCC Project",
          }),
        }),
        expect.any(Function)
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

      mockHttpsRequest(200, mockResponse)

      const result = await service.generate("Test prompt")

      expect(result).toEqual({
        text: "Response without usage",
        model: "mistralai/mistral-7b-instruct",
        usage: undefined,
      })
    })

    it("should handle malformed JSON response", async () => {
      const mockReq = new MockRequest()
      const mockRes = new MockResponse(200)

      ;(https.request as jest.Mock).mockImplementation((options, callback) => {
        if (callback) {
          process.nextTick(() => {
            callback(mockRes as any)
            process.nextTick(() => {
              mockRes.emit("data", "{ invalid json }")
              mockRes.emit("end")
            })
          })
        }
        return mockReq as any
      })

      await expect(service.generate("Test prompt")).rejects.toThrow(ServiceException)
      await expect(service.generate("Test prompt")).rejects.toThrow(
        /Failed to parse response/
      )
    })

    it("should handle response with multiple data chunks", async () => {
      const mockReq = new MockRequest()
      const mockRes = new MockResponse(200)

      const mockResponse = {
        id: "gen-multi",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Multi-chunk response",
            },
            finish_reason: "stop",
          },
        ],
      }

      const responseString = JSON.stringify(mockResponse)
      const chunk1 = responseString.slice(0, responseString.length / 2)
      const chunk2 = responseString.slice(responseString.length / 2)

      ;(https.request as jest.Mock).mockImplementation((options, callback) => {
        if (callback) {
          process.nextTick(() => {
            callback(mockRes as any)
            process.nextTick(() => {
              mockRes.emit("data", chunk1)
              mockRes.emit("data", chunk2)
              mockRes.emit("end")
            })
          })
        }
        return mockReq as any
      })

      const result = await service.generate("Test prompt")

      expect(result).toEqual({
        text: "Multi-chunk response",
        model: "mistralai/mistral-7b-instruct",
        usage: undefined,
      })
    })
  })

  describe("generateStructured", () => {
    let service: AIService

    beforeEach(() => {
      service = new AIService("test-api-key")
    })

    const mockHttpsRequest = (statusCode: number, responseData: any) => {
      const mockReq = new MockRequest()
      const mockRes = new MockResponse(statusCode)

      ;(https.request as jest.Mock).mockImplementation((options, callback) => {
        if (callback) {
          process.nextTick(() => {
            callback(mockRes as any)
            process.nextTick(() => {
              mockRes.emit("data", JSON.stringify(responseData))
              mockRes.emit("end")
            })
          })
        }
        return mockReq as any
      })

      return mockReq
    }

    const mockHttpsError = (error: Error) => {
      const mockReq = new MockRequest()

      ;(https.request as jest.Mock).mockImplementation(() => {
        process.nextTick(() => {
          mockReq.emit("error", error)
        })
        return mockReq as any
      })

      return mockReq
    }

    const mockHttpsTimeout = () => {
      const mockReq = new MockRequest()

      ;(https.request as jest.Mock).mockImplementation(() => {
        process.nextTick(() => {
          mockReq.emit("timeout")
        })
        return mockReq as any
      })

      return mockReq
    }

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

      mockHttpsRequest(200, mockResponse)

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

      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "openrouter.ai",
          port: 443,
          path: "/api/v1/chat/completions",
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
        expect.any(Function)
      )
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

      mockHttpsRequest(200, mockResponse)

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

      expect(https.request).not.toHaveBeenCalled()
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

      expect(https.request).not.toHaveBeenCalled()
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

      mockHttpsRequest(200, mockResponse)

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(/Failed to parse structured response as JSON/)
    })

    it("should throw ServiceException if API returns error status", async () => {
      mockHttpsRequest(401, { error: "Unauthorized - Invalid API key" })

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(/OpenRouter API error: 401/)
    })

    it("should throw ServiceException if response format is invalid", async () => {
      const invalidResponse = {
        id: "gen-999",
        model: "mistralai/mistral-7b-instruct",
        choices: [], // Empty choices array
      }

      mockHttpsRequest(200, invalidResponse)

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow("Invalid response format from OpenRouter API")
    })

    it("should throw ServiceException on timeout", async () => {
      mockHttpsTimeout()

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow("Request timeout - AI service took too long to respond")
    })

    it("should throw ServiceException on network error", async () => {
      mockHttpsError(new Error("Network connection failed"))

      const schema = { type: "object", properties: {} }

      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(ServiceException)
      await expect(
        service.generateStructured("Test prompt", schema)
      ).rejects.toThrow(
        "Failed to generate structured AI response: Network connection failed"
      )
    })

    it("should handle complex nested JSON schemas", async () => {
      interface ComplexData {
        user: {
          name: string
          details: {
            age: number
            hobbies: string[]
          }
        }
        metadata: {
          timestamp: string
        }
      }

      const mockResponse = {
        id: "gen-complex",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                user: {
                  name: "Alice",
                  details: {
                    age: 25,
                    hobbies: ["reading", "coding"],
                  },
                },
                metadata: {
                  timestamp: "2025-10-17T10:00:00Z",
                },
              }),
            },
            finish_reason: "stop",
          },
        ],
      }

      mockHttpsRequest(200, mockResponse)

      const schema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              details: {
                type: "object",
                properties: {
                  age: { type: "number" },
                  hobbies: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
          metadata: {
            type: "object",
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      }

      const result = await service.generateStructured<ComplexData>(
        "Generate complex data",
        schema
      )

      expect(result.data.user.name).toBe("Alice")
      expect(result.data.user.details.age).toBe(25)
      expect(result.data.user.details.hobbies).toEqual(["reading", "coding"])
      expect(result.data.metadata.timestamp).toBe("2025-10-17T10:00:00Z")
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

      mockHttpsRequest(200, mockResponse)

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

    it("should send response_format with json_schema in request body", async () => {
      const mockResponse = {
        id: "gen-format",
        model: "mistralai/mistral-7b-instruct",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({ test: "value" }),
            },
            finish_reason: "stop",
          },
        ],
      }

      const mockReq = new MockRequest()
      const mockRes = new MockResponse(200)

      let capturedBody: any = null

      ;(https.request as jest.Mock).mockImplementation((options, callback) => {
        if (callback) {
          process.nextTick(() => {
            callback(mockRes as any)
            process.nextTick(() => {
              mockRes.emit("data", JSON.stringify(mockResponse))
              mockRes.emit("end")
            })
          })
        }
        return mockReq as any
      })

      // Capture write call to inspect body
      mockReq.write.mockImplementation((data) => {
        capturedBody = JSON.parse(data)
      })

      const schema = {
        type: "object",
        properties: {
          test: { type: "string" },
        },
      }

      await service.generateStructured("Test prompt", schema)

      expect(capturedBody).toHaveProperty("response_format")
      expect(capturedBody.response_format).toEqual({
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          strict: true,
          schema: schema,
        },
      })
    })
  })
})
