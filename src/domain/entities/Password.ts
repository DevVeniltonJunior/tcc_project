import { TPassword } from "@/domain/protocols";
import { Id, Bool, DateEpoch, PasswordHash } from "@/domain/valueObjects";

export class Password {
  constructor(
    private readonly _id: Id,
    private readonly _userId: Id,
    private readonly _password: PasswordHash,
    private readonly _active: Bool,
    private readonly _createdAt: DateEpoch,
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getUserId(): Id {
    return this._userId;
  }

  public getPassword(): PasswordHash {
    return this._password;
  }

  public isActive(): Bool {
    return this._active;
  }

  public getCreatedAt(): DateEpoch {
    return this._createdAt;
  }

  public toJson(): TPassword.Entity {
    return {
      id: this._id.toString(),
      userId: this._userId.toString(),
      password: this._password.toString(),
      active: this._active.toBoolean(),
      createdAt: this._createdAt.toISO(),
    };
  }
}