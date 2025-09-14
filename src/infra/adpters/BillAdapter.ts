import { BillDTO } from '@/domain/dtos'
import { Bill } from '@/domain/entities'
import { TBill } from '@/domain/protocols'
import { Id, Name, DateEpoch, MoneyValue, Description, InstallmentsNumber } from '@/domain/valueObjects'

export class BillAdapter {
  public static toEntity(model: TBill.Entity): Bill {
    return new Bill(
      new Id(model.id),
      new Id(model.userId),
      new Name(model.name),
      new MoneyValue(model.value),
      new DateEpoch(model.createdAt),
      model.description ? new Description(model.description) : undefined,
      model.installmentsNumber ? new InstallmentsNumber(model.installmentsNumber) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }

  public static toModel(entity: Bill): TBill.Model {
    return entity.toJson()
  }

  public static toPartialModel(dto: BillDTO): Partial<TBill.Model> {
    return dto.toJson()
  }

  public static toDTO(model: TBill.DTO): BillDTO {
    return new BillDTO(
      new Id(model.id),
      model.name ? new Name(model.name) : undefined,
      model.value ? new MoneyValue(model.value) : undefined,
      model.description ? new Description(model.description) : undefined,
      model.installmentsNumber ? new InstallmentsNumber(model.installmentsNumber) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }
}