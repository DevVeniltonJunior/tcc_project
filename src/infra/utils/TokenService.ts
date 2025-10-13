// passwordResetTokenService.ts
import bcrypt from "bcrypt";
import { Id } from "@/domain/valueObjects";
import { randomBytes } from "crypto";

interface PasswordResetToken {
  id: string;
  userIdentifier: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// repositório em memória apenas para exemplo
class InMemoryTokenRepo {
  private tokens: PasswordResetToken[] = [];

  async create(token: PasswordResetToken) {
    this.tokens.push(token);
  }

  async invalidateAllForUser(userIdentifier: string) {
    this.tokens = this.tokens.map(t =>
      t.userIdentifier === userIdentifier ? { ...t, used: true } : t
    );
  }

  // opcional para testes
  async findByTokenHash(tokenHash: string) {
    return this.tokens.find(t => t.tokenHash === tokenHash);
  }
}

export class PasswordResetTokenService {
  private tokenRepo = new InMemoryTokenRepo();
  private TOKEN_EXPIRE_HOURS = 1;
  private BCRYPT_SALT_ROUNDS = 12;

  // gera token randomico em hexadecimal
  private generateToken(size = 32): string {
    return randomBytes(size).toString("hex");
  }

  // calcula expiração
  private expiresInHours(hours: number): Date {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d;
  }

  /**
   * Gera token de reset para um usuário (email ou username)
   * Retorna o token em texto puro para enviar por e-mail
   */
  public async generateTokenForUser(userIdentifier: string): Promise<string> {
    // invalida tokens antigos
    await this.tokenRepo.invalidateAllForUser(userIdentifier);

    const tokenPlain = this.generateToken();
    const tokenHash = await bcrypt.hash(tokenPlain, this.BCRYPT_SALT_ROUNDS);

    await this.tokenRepo.create({
      id: Id.generate().toString(),
      userIdentifier,
      tokenHash,
      expiresAt: this.expiresInHours(this.TOKEN_EXPIRE_HOURS),
      used: false,
      createdAt: new Date(),
    });

    return tokenPlain; // ESTE É O TOKEN QUE VOCÊ ENVIA POR E-MAIL
  }

  /**
   * Valida token recebido do usuário
   */
  public async validateToken(userIdentifier: string, tokenPlain: string): Promise<boolean> {
    const tokens = this.tokenRepo['tokens'].filter(t => t.userIdentifier === userIdentifier && !t.used);
    for (const t of tokens) {
      if (t.expiresAt.getTime() < Date.now()) continue;
      const match = await bcrypt.compare(tokenPlain, t.tokenHash);
      if (match) return true;
    }
    return false;
  }
}
