import { TBill } from "@/domain/protocols";
import { Id, Name, MoneyValue, Description, InstallmentsNumber, DateEpoch } from "@/domain/valueObjects";

export class Bill {
  constructor(
    private readonly _id: Id,
    private readonly _name?: Name,
    private readonly _value?: MoneyValue,
    private readonly _description?: Description,
    private readonly _installmentsNumber?: InstallmentsNumber,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getName(): Name | undefined  {
    return this._name;
  }

  public getValue(): MoneyValue | undefined  {
    return this._value;
  }

  public getDescription(): Description | undefined {
    return this._description;
  }

  public getInstallmentsNumber(): InstallmentsNumber | undefined {
    return this._installmentsNumber;
  }

  public getUpdatedAt(): DateEpoch | undefined {
    return this._updatedAt;
  }

  public getDeletedAt(): DateEpoch | undefined {
    return this._deletedAt;
  }

  public toJson(): TBill.DTO {
    return {
      id: this._id.toString(),
      name: this._name ? this._name.toString() : undefined,
      value: this._value ? this._value.toNumber() : undefined,
      description: this._description ? this._description.toString() : undefined,
      installmentsNumber: this._installmentsNumber ? this._installmentsNumber.toNumber() : undefined,
      updatedAt: this._updatedAt ? this._updatedAt.toISO() : undefined,
      deletedAt: this._deletedAt ? this._deletedAt.toISO() : undefined
    };
  }

}