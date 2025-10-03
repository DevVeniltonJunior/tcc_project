import { IDeletePlanning, IPlanningCommandRepository } from "@/domain/protocols"
import { Bool, Id } from '@/domain/valueObjects'

export class DeletePlanning implements IDeletePlanning {
  constructor(private readonly repository: IPlanningCommandRepository) {}

  public async execute(id: Id, isPermanent: Bool): Promise<void> {
    if (isPermanent.toBoolean()) {
      await this.repository.hardDelete(id)
      return
    }

    await this.repository.softDelete(id)
  }
}
