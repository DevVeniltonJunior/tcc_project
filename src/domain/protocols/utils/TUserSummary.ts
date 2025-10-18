

export type TUserSummary = {
  id: string,
  name: string,
  salary: number | null | undefined,
  billsActiveCount: number,
  planningsCount: number,
  totalBillsValueMonthly: number,
  partialValueNextMonth: number,
  partialValue2MonthsLater: number,
  partialValue3MonthsLater: number
}