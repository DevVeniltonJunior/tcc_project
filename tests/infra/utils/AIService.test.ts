import { AIService } from "@/infra/utils/AIService"
import { ServiceException } from "@/infra/exceptions"
import 'dotenv/config'

describe("[Utils] AIService Integration Test", () => {
  let aiService: AIService
  const API_KEY = process.env.AI_KEY

  beforeAll(() => {
    if (!API_KEY) {
      console.warn(
        "⚠️  AI_KEY environment variable not set. Integration tests will be skipped."
      )
    }
  })

  beforeEach(() => {
    if (API_KEY) {
      process.env.AI_KEY = API_KEY
      aiService = new AIService()
    }
  })

  describe("Real API Integration", () => {
    it(
      "should generate a response from the default model",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "What is 2 + 2? Answer with just the number."
        const response = await aiService.generate(prompt)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(typeof response.text).toBe("string")
        expect(response.text.length).toBeGreaterThan(0)
        expect(response.model).toBeDefined()
        expect(typeof response.model).toBe("string")

        // Verify usage information is present
        if (response.usage) {
          expect(response.usage.prompt_tokens).toBeGreaterThan(0)
          expect(response.usage.completion_tokens).toBeGreaterThan(0)
          expect(response.usage.total_tokens).toBeGreaterThan(0)
          expect(response.usage.total_tokens).toBe(
            response.usage.prompt_tokens! + response.usage.completion_tokens!
          )
        }
      },
      30000
    )

    it(
      "should accept custom model parameter",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "Say 'Hello' in one word."
        const customModel = "meta-llama/llama-3.2-3b-instruct:free"
        
        // Free models may have rate limits, so we handle both success and rate limit
        try {
          const response = await aiService.generate(prompt, customModel)

          expect(response).toBeDefined()
          expect(response.text).toBeDefined()
          expect(typeof response.text).toBe("string")
          expect(response.text.length).toBeGreaterThan(0)
        } catch (error) {
          // Rate limiting is expected for free models
          if (error instanceof ServiceException) {
            expect(error.message).toMatch(/OpenRouter API error/)
            // Accept rate limiting (429) as a valid response
            if (error.message.includes("429")) {
              console.log("Rate limited (expected for free models)")
              return
            }
          }
          throw error
        }
      },
      30000
    )

    it(
      "should handle longer prompts and generate appropriate responses",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = `
          You are a helpful assistant. Please provide a brief explanation of what artificial intelligence is.
          Keep your response concise, around 2-3 sentences.
        `
        const response = await aiService.generate(prompt)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(response.text.length).toBeGreaterThan(50)

        // Verify the response contains relevant keywords
        const lowerText = response.text.toLowerCase()
        const hasRelevantContent =
          lowerText.includes("artificial") ||
          lowerText.includes("ai") ||
          lowerText.includes("intelligence") ||
          lowerText.includes("machine") ||
          lowerText.includes("computer")

        expect(hasRelevantContent).toBe(true)

        // Verify usage metrics make sense for a longer prompt
        if (response.usage) {
          expect(response.usage.prompt_tokens).toBeGreaterThan(20)
          expect(response.usage.completion_tokens).toBeGreaterThan(10)
        }
      },
      30000
    )

    it(
      "should handle multiple consecutive requests",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompts = [
          "What is 1 + 1?",
          "What is 2 + 2?",
          "What is 3 + 3?",
        ]

        const responses = await Promise.all(
          prompts.map((prompt) => aiService.generate(prompt))
        )

        expect(responses).toHaveLength(3)

        responses.forEach((response, index) => {
          expect(response).toBeDefined()
          expect(response.text).toBeDefined()
          expect(response.text.length).toBeGreaterThan(0)
          expect(response.model).toBeDefined()
        })
      },
      45000
    )

    it.skip(
      "should reject with ServiceException for invalid API key",
      async () => {
        const originalKey = process.env.AI_KEY
        process.env.AI_KEY = "invalid-key-12345"
        const invalidService = new AIService()
        process.env.AI_KEY = originalKey
        
        const prompt = "Test prompt"

        await expect(invalidService.generate(prompt)).rejects.toThrow(
          ServiceException
        )
        await expect(invalidService.generate(prompt)).rejects.toThrow(
          /OpenRouter API error/
        )
      },
      30000
    )

    it(
      "should reject with ServiceException for empty prompt",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        await expect(aiService.generate("")).rejects.toThrow(ServiceException)
        await expect(aiService.generate("")).rejects.toThrow(
          "Prompt cannot be empty"
        )

        await expect(aiService.generate("   ")).rejects.toThrow(
          ServiceException
        )
        await expect(aiService.generate("   ")).rejects.toThrow(
          "Prompt cannot be empty"
        )
      },
      10000
    )

    it(
      "should reject with ServiceException for invalid model",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const invalidModel = "invalid/model-that-does-not-exist"
        const prompt = "Test prompt"

        await expect(aiService.generate(prompt, invalidModel)).rejects.toThrow(
          ServiceException
        )
      },
      30000
    )

    it(
      "should handle special characters in prompts",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt =
          'Respond with "OK" if you understand this: @#$%^&*()[]{}!?<>'
        const response = await aiService.generate(prompt)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(response.text.length).toBeGreaterThan(0)
      },
      30000
    )

    it(
      "should handle different types of prompts",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "What is the capital of France? Answer with just the city name."
        const response = await aiService.generate(prompt)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(response.text.length).toBeGreaterThan(0)
        expect(response.model).toBeDefined()
        
        // Verify usage is tracked
        if (response.usage) {
          expect(response.usage.total_tokens).toBeGreaterThan(0)
        }
      },
      30000
    )

    it(
      "should provide consistent response structure across different prompts",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompts = [
          "Simple question",
          "A bit more complex question that requires thought",
          "Very brief",
        ]

        for (const prompt of prompts) {
          const response = await aiService.generate(prompt)

          // All responses should have the same structure
          expect(response).toHaveProperty("text")
          expect(response).toHaveProperty("model")
          expect(response).toHaveProperty("usage")

          expect(typeof response.text).toBe("string")
          expect(typeof response.model).toBe("string")

          if (response.usage !== undefined) {
            expect(response.usage).toHaveProperty("prompt_tokens")
            expect(response.usage).toHaveProperty("completion_tokens")
            expect(response.usage).toHaveProperty("total_tokens")
          }
        }
      },
      45000
    )
  })

  describe("Error Handling in Real Scenarios", () => {
    it(
      "should handle rate limiting gracefully",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        // Make multiple rapid requests to potentially trigger rate limiting
        const rapidRequests = Array(10)
          .fill(null)
          .map((_, i) => aiService.generate(`Count: ${i}`))

        // Some requests might succeed, some might fail with rate limiting
        const results = await Promise.allSettled(rapidRequests)

        // At least one request should succeed
        const successfulRequests = results.filter(
          (r) => r.status === "fulfilled"
        )
        expect(successfulRequests.length).toBeGreaterThan(0)

        // Check that failed requests have proper error handling
        results.forEach((result) => {
          if (result.status === "rejected") {
            expect(result.reason).toBeInstanceOf(ServiceException)
          }
        })
      },
      60000
    )
  })

  describe("Environment Configuration", () => {
    it("should use environment variables for API key when not provided", () => {
      if (!API_KEY) {
        console.log("Skipping: AI_KEY not available")
        return
      }

      // Save original env
      const originalKey = process.env.AI_KEY

      try {
        // Set env variable
        process.env.AI_KEY = "test-env-key"

        // Create service without explicit key
        const envService = new AIService()
        expect(envService).toBeInstanceOf(AIService)
      } finally {
        // Restore original env
        process.env.AI_KEY = originalKey
      }
    })

    it("should throw ServiceException when API key is missing", () => {
      // Save original env
      const originalKey = process.env.AI_KEY

      try {
        // Remove env variable
        delete process.env.AI_KEY

        // Should throw when creating service without key
        expect(() => new AIService()).toThrow(ServiceException)
        expect(() => new AIService()).toThrow("Missing OpenRouter API key")
      } finally {
        // Restore original env
        process.env.AI_KEY = originalKey
      }
    })
  })

  describe("generateStructured Real API Integration", () => {
    it(
      "should generate a structured response with a simple schema",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface MathResult {
          question: string
          answer: number
          explanation: string
        }

        const schema = {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "number" },
            explanation: { type: "string" },
          },
          required: ["question", "answer", "explanation"],
        }

        const prompt =
          "What is 15 + 27? Provide the question, answer, and a brief explanation."

        const response = await aiService.generateStructured<MathResult>(prompt, schema)

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(typeof response.data.question).toBe("string")
        expect(typeof response.data.answer).toBe("number")
        expect(typeof response.data.explanation).toBe("string")
        expect(response.model).toBeDefined()

        // Verify the answer is correct
        expect(response.data.answer).toBe(42)

        // Verify usage information is present
        if (response.usage) {
          expect(response.usage.prompt_tokens).toBeGreaterThan(0)
          expect(response.usage.completion_tokens).toBeGreaterThan(0)
          expect(response.usage.total_tokens).toBeGreaterThan(0)
        }
      },
      30000
    )

    it(
      "should generate structured response using default model reliably",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface SimpleData {
          count: number
          items: string[]
        }

        const schema = {
          type: "object",
          properties: {
            count: { type: "number" },
            items: { type: "array", items: { type: "string" } },
          },
          required: ["count", "items"],
        }

        const prompt = "List 3 colors. Return count and items array."

        const response = await aiService.generateStructured<SimpleData>(
          prompt,
          schema
        )

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(typeof response.data.count).toBe("number")
        expect(Array.isArray(response.data.items)).toBe(true)
        expect(response.data.items.length).toBeGreaterThan(0)
        expect(response.model).toBeDefined()
      },
      30000
    )

    it(
      "should handle complex nested schemas",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface PersonProfile {
          personal: {
            name: string
            age: number
          }
          contact: {
            email: string
            phone: string
          }
          interests: string[]
        }

        const schema = {
          type: "object",
          properties: {
            personal: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
              },
              required: ["name", "age"],
            },
            contact: {
              type: "object",
              properties: {
                email: { type: "string" },
                phone: { type: "string" },
              },
              required: ["email", "phone"],
            },
            interests: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["personal", "contact", "interests"],
        }

        const prompt = `
          Create a profile for a person named John Doe, 30 years old,
          email: john@example.com, phone: +1234567890,
          interests: reading, coding, and traveling.
        `

        const response = await aiService.generateStructured<PersonProfile>(
          prompt,
          schema
        )

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(response.data.personal).toBeDefined()
        expect(typeof response.data.personal.name).toBe("string")
        expect(typeof response.data.personal.age).toBe("number")
        expect(response.data.contact).toBeDefined()
        expect(typeof response.data.contact.email).toBe("string")
        expect(typeof response.data.contact.phone).toBe("string")
        expect(Array.isArray(response.data.interests)).toBe(true)
        expect(response.data.interests.length).toBeGreaterThan(0)
      },
      30000
    )

    it(
      "should handle array responses",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface NumberList {
          numbers: number[]
          sum: number
        }

        const schema = {
          type: "object",
          properties: {
            numbers: {
              type: "array",
              items: { type: "number" },
            },
            sum: { type: "number" },
          },
          required: ["numbers", "sum"],
        }

        const prompt = "List the first 5 natural numbers and their sum."

        const response = await aiService.generateStructured<NumberList>(
          prompt,
          schema
        )

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(Array.isArray(response.data.numbers)).toBe(true)
        expect(response.data.numbers.length).toBe(5)
        expect(typeof response.data.sum).toBe("number")
        expect(response.data.sum).toBe(15) // 1+2+3+4+5 = 15
      },
      30000
    )

    it(
      "should reject with ServiceException for empty prompt",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const schema = { type: "object", properties: {} }

        await expect(aiService.generateStructured("", schema)).rejects.toThrow(
          ServiceException
        )
        await expect(aiService.generateStructured("", schema)).rejects.toThrow(
          "Prompt cannot be empty"
        )

        await expect(
          aiService.generateStructured("   ", schema)
        ).rejects.toThrow(ServiceException)
        await expect(
          aiService.generateStructured("   ", schema)
        ).rejects.toThrow("Prompt cannot be empty")
      },
      10000
    )

    it(
      "should reject with ServiceException for invalid schema",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "Test prompt"

        await expect(
          aiService.generateStructured(prompt, null as any)
        ).rejects.toThrow(ServiceException)
        await expect(
          aiService.generateStructured(prompt, null as any)
        ).rejects.toThrow("Valid JSON schema is required")

        await expect(
          aiService.generateStructured(prompt, undefined as any)
        ).rejects.toThrow(ServiceException)
        await expect(
          aiService.generateStructured(prompt, undefined as any)
        ).rejects.toThrow("Valid JSON schema is required")
      },
      10000
    )

    it.skip(
      "should reject with ServiceException for invalid API key",
      async () => {
        const originalKey = process.env.AI_KEY
        process.env.AI_KEY = "invalid-key-12345"
        const invalidService = new AIService()
        process.env.AI_KEY = originalKey
        
        const prompt = "Test prompt"
        const schema = { type: "object", properties: {} }

        await expect(
          invalidService.generateStructured(prompt, schema)
        ).rejects.toThrow(ServiceException)
        await expect(
          invalidService.generateStructured(prompt, schema)
        ).rejects.toThrow(/OpenRouter API error/)
      },
      30000
    )

    it(
      "should handle boolean and null values in schema",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface StatusResponse {
          success: boolean
          message: string
          error: string | null
        }

        const schema = {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            error: { anyOf: [{ type: "string" }, { type: "null" }] } as any,
          },
          required: ["success", "message", "error"],
        }

        const prompt = "Create a successful status response with no errors."

        const response = await aiService.generateStructured<StatusResponse>(
          prompt,
          schema
        )

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(typeof response.data.success).toBe("boolean")
        expect(typeof response.data.message).toBe("string")
        expect(response.data.success).toBe(true)
      },
      30000
    )

    it(
      "should handle extraction from unstructured text",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface ExtractedInfo {
          name: string
          age: number
          city: string
          occupation: string
        }

        const schema = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            city: { type: "string" },
            occupation: { type: "string" },
          },
          required: ["name", "age", "city", "occupation"],
        }

        const prompt = `
          Extract the following information:
          "Alice is a 28-year-old software engineer living in San Francisco."
        `

        const response = await aiService.generateStructured<ExtractedInfo>(
          prompt,
          schema
        )

        expect(response).toBeDefined()
        expect(response.data).toBeDefined()
        expect(response.data.name.toLowerCase()).toContain("alice")
        expect(response.data.age).toBe(28)
        expect(response.data.city.toLowerCase()).toContain("san francisco")
        expect(response.data.occupation.toLowerCase()).toContain("engineer")
      },
      30000
    )

    it(
      "should provide consistent response structure for structured calls",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        interface SimpleResponse {
          value: string
        }

        const schema = {
          type: "object",
          properties: {
            value: { type: "string" },
          },
          required: ["value"],
        }

        const prompts = ["Say hello", "Say goodbye", "Say thank you"]

        for (const prompt of prompts) {
          const response = await aiService.generateStructured<SimpleResponse>(
            prompt,
            schema
          )

          // All responses should have the same structure
          expect(response).toHaveProperty("data")
          expect(response).toHaveProperty("model")
          expect(response).toHaveProperty("usage")

          expect(typeof response.data).toBe("object")
          expect(typeof response.data.value).toBe("string")
          expect(typeof response.model).toBe("string")

          if (response.usage !== undefined) {
            expect(response.usage).toHaveProperty("prompt_tokens")
            expect(response.usage).toHaveProperty("completion_tokens")
            expect(response.usage).toHaveProperty("total_tokens")
          }
        }
      },
      45000
    )
  })
})

