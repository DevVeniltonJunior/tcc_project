import { TBill } from "@/domain/protocols";
import { Id, Name, MoneyValue, Description, InstallmentsNumber, DateEpoch } from "@/domain/valueObjects";

export class Bill {
  constructor(
    private readonly _id: Id,
    private readonly _userId: Id,
    private readonly _name: Name,
    private readonly _value: MoneyValue,
    private readonly _createdAt: DateEpoch,
    private readonly _description?: Description,
    private readonly _installmentsNumber?: InstallmentsNumber,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getUserId(): Id {
    return this._userId;
  }

  public getName(): Name {
    return this._name;
  }

  public getValue(): MoneyValue {
    return this._value;
  }

  public getDescription(): Description | undefined {
    return this._description;
  }

  public getInstallmentsNumber(): InstallmentsNumber | undefined {
    return this._installmentsNumber;
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

  public toJson(): TBill.Entity {
    return {
      id: this._id.toString(),
      userId: this._userId.toString(),
      name: this._name.toString(),
      value: this._value.toNumber(),
      description: this._description ? this._description.toString() : undefined,
      installmentsNumber: this._installmentsNumber ? this._installmentsNumber.toNumber() : undefined,
      createdAt: this._createdAt.toISO(),
      updatedAt: this._updatedAt ? this._updatedAt.toISO() : undefined,
      deletedAt: this._deletedAt ? this._deletedAt.toISO() : undefined
    };
  }

}