import { PlanningDTO } from '@/domain/dtos'
import { Planning } from '@/domain/entities'
import { TPlanning } from '@/domain/protocols'
import { Id, Name, Email, DateEpoch, MoneyValue, Description, Goal, Plan } from '@/domain/valueObjects'

export class PlanningAdapter {
  public static toEntity(model: TPlanning.Model): Planning {
    return new Planning(
      new Id(model.id),        
      new Id(model.userId),
      new Name(model.name),
      new Goal(model.goal),
      new MoneyValue(model.goalValue),
      new Plan(model.plan),        
      new DateEpoch(model.createdAt),
      model.description ? new Description(model.description) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }

  public static toModel(entity: Planning): TPlanning.Model {
    return entity.toJson()
  }

  public static toPartialModel(dto: PlanningDTO): Partial<TPlanning.Model> {
    return dto.toJson()
  }

  public static toDTO(model: TPlanning.DTO): PlanningDTO {
    return new PlanningDTO(
      new Id(model.id),
      model.name ? new Name(model.name) : undefined,
      model.goal ? new Goal(model.goal) : undefined,
      model.goalValue ? new MoneyValue(model.goalValue) : undefined,
      model.plan ? new Plan(model.plan) : undefined,
      model.description ? new Description(model.description) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }
}