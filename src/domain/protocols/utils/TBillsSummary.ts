export type TBillsSummary = {
  totalBillAmount: number,
  totalValue: number,
  totalInstallmentValue: number,
  totalFixedBillsValue: number,
  totalMonthlyMiscBillsValue: number,
  partialValueNextMonth: number,
  partialValue2MonthsLater: number,
  partialValue3MonthsLater: number
}