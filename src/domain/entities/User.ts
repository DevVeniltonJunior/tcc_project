import { Id, Name, DateEpoch, Email, MoneyValue } from "@/domain/valueObjects";
import { TUser } from "@/domain/protocols";
import { Password, Bill, Planning } from "@/domain/entities";

export class User {
  constructor(
    private readonly _id: Id,
    private readonly _name: Name,
    private readonly _birthdate: DateEpoch,
    private readonly _email: Email,
    private readonly _password: Password,
    private readonly _bills: Bill[],
    private readonly _planning: Planning[],
    private readonly _createdAt: DateEpoch,
    private readonly _salary?: MoneyValue,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getName(): Name {
    return this._name;
  }

  public getBirthdate(): DateEpoch {
    return this._birthdate;
  }

  public getEmail(): Email {
    return this._email;
  }

  public getSalary(): MoneyValue | undefined {
    return this._salary;
  }

  public getPassword(): Password {
    return this._password;
  }

  public getBills(): Bill[] {
    return this._bills;
  }

  public getPlanning(): Planning[] {
    return this._planning;
  }

  public getCreatedAt(): DateEpoch {
    return this._createdAt;
  }

  public getUpdatedAt(): DateEpoch | undefined {
    return this._updatedAt;
  }

  public getDeletedAt(): DateEpoch | undefined {
    return this._deletedAt;
  }

  public toJson(): TUser.Entity {
    return {
      id: this._id.toString(),
      name: this._name.toString(),
      birthdate: this._birthdate.toISO(),
      email: this._email.toString(),
      salary: this._salary?.toNumber(),
      password: this._password.toJson(),
      bills: this._bills.map(bill => bill.toJson()),
      planning: this._planning.map(plan => plan.toJson()),
      createdAt: this._createdAt.toISO(),
      updatedAt: this._updatedAt?.toISO(),
      deletedAt: this._deletedAt?.toISO(),
    };
  }
}