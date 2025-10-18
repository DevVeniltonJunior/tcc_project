import { Id } from "@/domain/valueObjects"
import { TUserSummary } from "@/domain/protocols"

export interface IGetUserSummary {
  execute(userId: Id): Promise<TUserSummary>
}