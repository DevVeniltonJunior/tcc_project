import { Id } from "@/domain/valueObjects";
import { TBillsSummary } from "@/domain/protocols";

export interface IGetBillsSummary {
  execute(userId: Id): Promise<TBillsSummary>
}