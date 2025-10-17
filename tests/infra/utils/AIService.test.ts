import { AIService } from "@/infra/utils/AIService"
import { ServiceException } from "@/infra/exceptions"

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
      aiService = new AIService(API_KEY)
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
      "should generate a response with a custom model",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "Say 'Hello' in one word."
        const customModel = "google/gemini-flash-1.5"
        const response = await aiService.generate(prompt, customModel)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(typeof response.text).toBe("string")
        expect(response.text.length).toBeGreaterThan(0)
        expect(response.model).toContain("gemini")
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

    it(
      "should reject with ServiceException for invalid API key",
      async () => {
        const invalidService = new AIService("invalid-key-12345")
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
      "should handle multilingual prompts",
      async () => {
        if (!API_KEY) {
          console.log("Skipping: AI_KEY not available")
          return
        }

        const prompt = "Traduza para inglês: Olá, como você está?"
        const response = await aiService.generate(prompt)

        expect(response).toBeDefined()
        expect(response.text).toBeDefined()
        expect(response.text.length).toBeGreaterThan(0)

        // The response should contain some form of English translation
        const hasEnglishWords =
          response.text.toLowerCase().includes("hello") ||
          response.text.toLowerCase().includes("how") ||
          response.text.toLowerCase().includes("are") ||
          response.text.toLowerCase().includes("you")

        expect(hasEnglishWords).toBe(true)
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
})

