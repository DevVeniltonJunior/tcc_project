import { IUpdatePlanning, IPlanningCommandRepository } from "@/domain/protocols"
import { PlanningDTO } from '@/domain/dtos'

export class UpdatePlanning implements IUpdatePlanning {
  constructor(private readonly repository: IPlanningCommandRepository) {}

  public async execute(entity: PlanningDTO): Promise<void> {
    await this.repository.update(entity)
  }
}
