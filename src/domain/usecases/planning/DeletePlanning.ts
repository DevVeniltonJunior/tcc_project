import { IDeletePlanning, IPlanningCommandRepository } from "@/domain/protocols"
import { Id } from '@/domain/valueObjects'

export class DeletePlanning implements IDeletePlanning {
  constructor(private readonly repository: IPlanningCommandRepository) {}

  public async execute(id: Id): Promise<void> {
    await this.repository.softDelete(id)
  }
}
