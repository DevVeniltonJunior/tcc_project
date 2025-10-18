import { Id, Name, DateEpoch, Email, MoneyValue } from "@/domain/valueObjects";
import { TUser } from "@/domain/protocols";

export class UserDTO {
  constructor(
    private readonly _id: Id,
    private readonly _name?: Name,
    private readonly _birthdate?: DateEpoch,
    private readonly _email?: Email,
    private readonly _salary?: MoneyValue,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getName(): Name | undefined {
    return this._name;
  }

  public getBirthdate(): DateEpoch | undefined {
    return this._birthdate;
  }

  public getEmail(): Email | undefined {
    return this._email;
  }

  public getSalary(): MoneyValue | undefined {
    return this._salary;
  }

  public getUpdatedAt(): DateEpoch | undefined {
    return this._updatedAt;
  }

  public getDeletedAt(): DateEpoch | undefined {
    return this._deletedAt;
  }

  public toJson(): TUser.DTO {
    return {
      id: this._id.toString(),
      name: this._name?.toString() ? this._name.toString() : undefined,
      birthdate: this._birthdate?.toISO() ? this._birthdate.toISO() : undefined,
      email: this._email?.toString() ? this._email.toString() : undefined,
      salary: this._salary?.toNumber() ? this._salary.toNumber() : undefined,
      updatedAt: this._updatedAt?.toISO() ? this._updatedAt.toISO() : undefined,
      deletedAt: this._deletedAt?.toISO() ? this._deletedAt.toISO() : undefined,
    };
  }
}