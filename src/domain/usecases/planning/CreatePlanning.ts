import { ICreatePlanning, IPlanningCommandRepository } from "@/domain/protocols"
import { Planning } from '@/domain/entities'

export class CreatePlanning implements ICreatePlanning {
  constructor(private readonly repository: IPlanningCommandRepository) {}

  public async execute(entity: Planning): Promise<Planning> {
    return await this.repository.create(entity)
  }
}
