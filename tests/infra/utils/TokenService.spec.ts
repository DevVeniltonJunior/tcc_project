import { TokenService as PasswordResetTokenService } from "@/infra/utils"
import { Id } from "@/domain/valueObjects"
import jwt from "jsonwebtoken"

describe("[Utils] PasswordResetTokenService", () => {
  let tokenService: PasswordResetTokenService
  const TEST_SECRET = "test-secret-key-for-jwt"
  let testUserId: Id

  beforeEach(() => {
    tokenService = new PasswordResetTokenService({
      tokenExpireHours: 24,
      jwtSecret: TEST_SECRET,
    })
    testUserId = Id.generate()
  })

  describe("generateTokenForUser", () => {
    it("should generate a token for a user", () => {
      const userId = Id.generate()

      const token = tokenService.generateTokenForUser(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate a valid JWT token", () => {
      const userId = Id.generate();

      const token = tokenService.generateTokenForUser(userId);

      // Verifica se é um JWT válido
      const decoded = jwt.verify(token, TEST_SECRET) as any;
      expect(decoded.userId).toBe(userId.toString());
      expect(decoded.createdAt).toBeDefined();
    });

    it("should include userId in token payload", () => {
      const userId = Id.generate();

      const token = tokenService.generateTokenForUser(userId);

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(userId.toString());
    });

    it("should include createdAt timestamp in token payload", () => {
      const userId = Id.generate();
      const beforeGeneration = Date.now();

      const token = tokenService.generateTokenForUser(userId);

      const decoded = jwt.decode(token) as any;
      expect(decoded.createdAt).toBeDefined();
      expect(decoded.createdAt).toBeGreaterThanOrEqual(beforeGeneration - 1000);
      expect(decoded.createdAt).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it("should throw error when user identifier is empty", () => {
      expect(() => tokenService.generateTokenForUser("" as any)).toThrow(
        "User identifier cannot be empty"
      );
    });

    it("should throw error when user identifier is only spaces", () => {
      expect(() => tokenService.generateTokenForUser("   " as any)).toThrow(
        "User identifier cannot be empty"
      );
    });

    it("should generate different tokens for same user", () => {
      const userId = Id.generate();

      const token1 = tokenService.generateTokenForUser(userId);
      // Pequena pausa para garantir timestamp diferente
      const token2 = tokenService.generateTokenForUser(userId);

      expect(token1).not.toBe(token2);
    });

    it("should set JWT expiration time", () => {
      const userId = Id.generate();

      const token = tokenService.generateTokenForUser(userId);

      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      
      // Verifica se a expiração está em aproximadamente 24 horas
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBeGreaterThanOrEqual(23 * 60 * 60); // >= 23 horas
      expect(expiresIn).toBeLessThanOrEqual(25 * 60 * 60); // <= 25 horas
    });
  });

  describe("validateToken", () => {
    it("should validate a correct token", () => {
      const userId = Id.generate();
      const token = tokenService.generateTokenForUser(userId);

      const result = tokenService.validateToken(userId, token);

      expect(result).toBe(true);
    });

    it("should reject an invalid token", () => {
      const userId = Id.generate();

      const result = tokenService.validateToken(userId, "invalid-token");

      expect(result).toBe(false);
    });

    it("should reject token for different user", () => {
      const userId1 = Id.generate();
      const userId2 = Id.generate();

      const token = tokenService.generateTokenForUser(userId1);

      const result = tokenService.validateToken(userId2, token);

      expect(result).toBe(false);
    });

    it("should reject expired token", () => {
      // Cria um serviço com tokens que expiram muito rápido
      const shortLivedService = new PasswordResetTokenService({
        tokenExpireHours: -1, // Expira imediatamente
        jwtSecret: TEST_SECRET,
      });

      const userId = Id.generate();
      const token = shortLivedService.generateTokenForUser(userId);

      const result = shortLivedService.validateToken(userId, token);

      expect(result).toBe(false);
    });

    it("should reject token signed with different secret", () => {
      const userId = Id.generate();
      
      // Cria token com secret diferente
      const differentSecret = "different-secret";
      const otherService = new PasswordResetTokenService({
        jwtSecret: differentSecret,
      });
      const token = otherService.generateTokenForUser(userId);

      // Tenta validar com o serviço original
      const result = tokenService.validateToken(userId, token);

      expect(result).toBe(false);
    });

    it("should return false when user identifier is empty", () => {
      const result = tokenService.validateToken("" as any, "some-token");

      expect(result).toBe(false);
    });

    it("should return false when token is empty", () => {
      const userId = Id.generate();
      const result = tokenService.validateToken(userId, "");

      expect(result).toBe(false);
    });

    it("should reject malformed JWT", () => {
      const userId = Id.generate();

      const result = tokenService.validateToken(userId, "not.a.valid.jwt");

      expect(result).toBe(false);
    });

    it("should validate token within expiration period", () => {
      const customService = new PasswordResetTokenService({
        tokenExpireHours: 1,
        jwtSecret: TEST_SECRET,
      });

      const userId = Id.generate();
      const token = customService.generateTokenForUser(userId);

      // Token deve ser válido imediatamente após criação
      const result = customService.validateToken(userId, token);

      expect(result).toBe(true);
    });
  });

  describe("validateToken (stateless approach)", () => {
    it("should validate correct token", () => {
      const userId = Id.generate();
      const token = tokenService.generateTokenForUser(userId);

      const result = tokenService.validateToken(userId, token);

      expect(result).toBe(true);
    });

    it("should return false for invalid token", () => {
      const userId = Id.generate();

      const result = tokenService.validateToken(userId, "wrong-token");

      expect(result).toBe(false);
    });

    it("should return false when token is expired", () => {
      const shortLivedService = new PasswordResetTokenService({
        tokenExpireHours: -1,
        jwtSecret: TEST_SECRET,
      });

      const userId = Id.generate();
      const token = shortLivedService.generateTokenForUser(userId);

      const result = shortLivedService.validateToken(userId, token);

      expect(result).toBe(false);
    });

    it("should allow token reuse (stateless approach)", () => {
      const userId = Id.generate();
      const token = tokenService.generateTokenForUser(userId);

      const firstUse = tokenService.validateToken(userId, token);
      expect(firstUse).toBe(true);

      // Com JWT stateless, o token pode ser reutilizado até expirar
      // (trade-off da abordagem sem banco de dados)
      const secondUse = tokenService.validateToken(userId, token);
      expect(secondUse).toBe(true);
    });
  });

  describe("TokenService configuration", () => {
    it("should use default configuration values", () => {
      const defaultService = new PasswordResetTokenService();

      expect(defaultService["TOKEN_EXPIRE_HOURS"]).toBe(24);
      expect(defaultService["JWT_SECRET"]).toBeDefined();
    });

    it("should use custom configuration values", () => {
      const customSecret = "my-custom-secret";
      const customService = new PasswordResetTokenService({
        tokenExpireHours: 2,
        jwtSecret: customSecret,
      });

      expect(customService["TOKEN_EXPIRE_HOURS"]).toBe(2);
      expect(customService["JWT_SECRET"]).toBe(customSecret);
    });

    it("should use environment variable for secret if available", () => {
      const originalEnv = process.env.JWT_PASSWORD_RESET_SECRET;
      process.env.JWT_PASSWORD_RESET_SECRET = "env-secret";

      const service = new PasswordResetTokenService();

      expect(service["JWT_SECRET"]).toBe("env-secret");

      // Restaura ambiente
      if (originalEnv) {
        process.env.JWT_PASSWORD_RESET_SECRET = originalEnv;
      } else {
        delete process.env.JWT_PASSWORD_RESET_SECRET;
      }
    });

    it("should generate random secret if not provided", () => {
      const originalEnv = process.env.JWT_PASSWORD_RESET_SECRET;
      delete process.env.JWT_PASSWORD_RESET_SECRET;

      const service1 = new PasswordResetTokenService();
      const service2 = new PasswordResetTokenService();

      // Cada instância deve ter um secret diferente se não fornecido
      expect(service1["JWT_SECRET"]).toBeDefined();
      expect(service2["JWT_SECRET"]).toBeDefined();
      expect(service1["JWT_SECRET"]).not.toBe(service2["JWT_SECRET"]);

      // Restaura ambiente
      if (originalEnv) {
        process.env.JWT_PASSWORD_RESET_SECRET = originalEnv;
      }
    });

    it("should respect custom expiration time", () => {
      const customService = new PasswordResetTokenService({
        tokenExpireHours: 48,
        jwtSecret: TEST_SECRET,
      });

      const userId = Id.generate();
      const token = customService.generateTokenForUser(userId);

      const decoded = jwt.decode(token) as any;
      const expiresIn = decoded.exp - decoded.iat;
      
      // Verifica se a expiração está em aproximadamente 48 horas
      expect(expiresIn).toBeGreaterThanOrEqual(47 * 60 * 60);
      expect(expiresIn).toBeLessThanOrEqual(49 * 60 * 60);
    });
  });

  describe("Error handling", () => {
    it("should handle jwt sign errors gracefully", () => {
      jest.spyOn(jwt, "sign").mockImplementationOnce(() => {
        throw new Error("JWT sign error");
      });

      const userId = Id.generate();
      expect(() => tokenService.generateTokenForUser(userId)).toThrow("JWT sign error");
    });

    it("should handle jwt verify errors gracefully", () => {
      const userId = Id.generate();
      const token = tokenService.generateTokenForUser(userId);

      jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw new Error("JWT verify error");
      });

      const result = tokenService.validateToken(userId, token);

      expect(result).toBe(false);
    });

    it("should handle corrupted tokens", () => {
      const userId = Id.generate();
      const corruptedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted.signature";

      const result = tokenService.validateToken(userId, corruptedToken);

      expect(result).toBe(false);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete password reset flow", () => {
      const userId = Id.generate();

      // 1. Gera token para reset
      const token = tokenService.generateTokenForUser(userId);
      expect(token).toBeDefined();

      // 2. Valida o token
      const validation = tokenService.validateToken(userId, token);
      expect(validation).toBe(true);

      // 3. Consome o token ao resetar a senha (stateless approach)
      const consumed = tokenService.validateToken(userId, token);
      expect(consumed).toBe(true);

      // Nota: Com JWT stateless, o token continua válido até expirar
      // Para invalidar, seria necessário implementar uma blacklist (não incluído nesta versão)
    });

    it("should allow multiple users to have tokens simultaneously", () => {
      const user1 = Id.generate();
      const user2 = Id.generate();

      const token1 = tokenService.generateTokenForUser(user1);
      const token2 = tokenService.generateTokenForUser(user2);

      const result1 = tokenService.validateToken(user1, token1);
      const result2 = tokenService.validateToken(user2, token2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      // Validação cruzada deve falhar
      const crossValidation1 = tokenService.validateToken(user1, token2);
      const crossValidation2 = tokenService.validateToken(user2, token1);

      expect(crossValidation1).toBe(false);
      expect(crossValidation2).toBe(false);
    });

    it("should generate new tokens independently", () => {
      const userId = Id.generate();

      const oldToken = tokenService.generateTokenForUser(userId);
      expect(tokenService.validateToken(userId, oldToken)).toBe(true);

      const newToken = tokenService.generateTokenForUser(userId);
      expect(tokenService.validateToken(userId, newToken)).toBe(true);

      // Ambos os tokens são válidos com JWT stateless
      // (trade-off: não há invalidação automática de tokens antigos)
      expect(tokenService.validateToken(userId, oldToken)).toBe(true);
    });

    it("should handle tokens with very short expiration", () => {
      const shortService = new PasswordResetTokenService({
        tokenExpireHours: 0.0001, // Alguns milissegundos
        jwtSecret: TEST_SECRET,
      });

      const userId = Id.generate();
      const token = shortService.generateTokenForUser(userId);

      // Aguarda um pouco para o token expirar
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = shortService.validateToken(userId, token);
          expect(result).toBe(false);
          resolve();
        }, 500);
      });
    });

    it("should maintain token integrity across multiple validations", () => {
      const userId = Id.generate();
      const token = tokenService.generateTokenForUser(userId);

      // Valida o mesmo token múltiplas vezes
      for (let i = 0; i < 10; i++) {
        const result = tokenService.validateToken(userId, token);
        expect(result).toBe(true);
      }
    });
  });
});
