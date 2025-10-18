export type TBillsSummary = {
  billsActiveCount: number,
  totalBillAmount: number,
  totalValue: number,
  totalInstallmentValue: number,
  totalFixedBillsValue: number,
  totalMonthlyMiscBillsValue: number,
  partialValueNextMonth: number,
  partialValue2MonthsLater: number,
  partialValue3MonthsLater: number,
  fixesBillsNames: string,
  monthlyMiscBillsNames: string,
  installmentBillsNames: string
}