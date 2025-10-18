import { IBillQueryRepository, TBillsSummary } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"
import { Bill } from "@/domain/entities"
import { Id } from "@/domain/valueObjects"

export class GetBillsSummary {
  constructor(private readonly billQueryRepository: IBillQueryRepository) {}
  
  public async execute(userId: Id): Promise<TBillsSummary> {
    try {
      const bills = await this.billQueryRepository.list({ userId: userId.toString() })
  
      const fixesBills = bills.filter((bill: Bill) => bill.getInstallmentsNumber() === undefined)
      const monthlyMiscBills = bills.filter((bill: Bill) => bill.getInstallmentsNumber()?.toNumber() === 1)
      const installment_bills = bills.filter(
        (bill: Bill) => bill.getInstallmentsNumber()?.toNumber() !== undefined && bill.getInstallmentsNumber()!.toNumber() > 1
      )

      const fixesBillsNames = fixesBills.map((bill: Bill) => bill.getName().toString()).join(", ")
      const monthlyMiscBillsNames = monthlyMiscBills.map((bill: Bill) => bill.getName().toString()).join(", ")
      const installmentBillsNames = installment_bills.map((bill: Bill) => bill.getName().toString()).join(", ")
  
      const thisMonthMiscBills = monthlyMiscBills.filter((bill: Bill) => bill.getCreatedAt().toDate().getMonth() === new Date().getMonth() && bill.getCreatedAt().toDate().getFullYear() === new Date().getFullYear())
      
      const nextMonthInstallmentBills = {
        "1": [] as Bill[],
        "2": [] as Bill[],
        "3": [] as Bill[]
      }
      const installmentBillsActive = installment_bills.map((bill: Bill) => {
        const installments = bill.getInstallmentsNumber()!.toNumber()
        const createdAt = bill.getCreatedAt().toDate()
  
        const installmentsPaid = this.calculateInstallmentsPaid(installments, createdAt)
        if (installmentsPaid === installments) return null
        
        if ((installments - installmentsPaid) === 1) nextMonthInstallmentBills["1"].push(bill)
        if ((installments - installmentsPaid) === 2) nextMonthInstallmentBills["2"].push(bill)
        if ((installments - installmentsPaid) >= 3) nextMonthInstallmentBills["3"].push(bill)
  
        return bill
      })
  
      const installmentBillsActiveFiltered = installmentBillsActive.filter((bill: Bill | null) => bill !== null) as Bill[]

      const billsActiveCount = installmentBillsActiveFiltered.length + fixesBills.length + thisMonthMiscBills.length
  
      const totalInstallmentValue = installmentBillsActiveFiltered.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalFixedBillsValue = fixesBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalMonthlyMiscBillsValue = thisMonthMiscBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValueNextMonth = nextMonthInstallmentBills["1"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValue2MonthsLater = nextMonthInstallmentBills["2"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValue3MonthsLater = nextMonthInstallmentBills["3"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
  
      const totalBillAmount = totalInstallmentValue + totalFixedBillsValue + totalMonthlyMiscBillsValue + partialValueNextMonth + partialValue2MonthsLater + partialValue3MonthsLater
  
      const totalValue = totalInstallmentValue + totalFixedBillsValue + totalMonthlyMiscBillsValue
  
      return {
        billsActiveCount: billsActiveCount,
        totalBillAmount: totalBillAmount,
        totalValue: totalValue,
        totalInstallmentValue: totalInstallmentValue,
        totalFixedBillsValue: totalFixedBillsValue,
        totalMonthlyMiscBillsValue: totalMonthlyMiscBillsValue,
        partialValueNextMonth: partialValueNextMonth,
        partialValue2MonthsLater: partialValue2MonthsLater,
        partialValue3MonthsLater: partialValue3MonthsLater,
        fixesBillsNames: fixesBillsNames,
        monthlyMiscBillsNames: monthlyMiscBillsNames,
        installmentBillsNames: installmentBillsNames
      }
    }
    catch(error) {
      if (error instanceof DatabaseException && error.message === "Bills not found") {
        return {
          billsActiveCount: 0,
          totalBillAmount: 0,
          totalValue: 0,
          totalInstallmentValue: 0,
          totalFixedBillsValue: 0,
          totalMonthlyMiscBillsValue: 0,
          partialValueNextMonth: 0,
          partialValue2MonthsLater: 0,
          partialValue3MonthsLater: 0,
          fixesBillsNames: "",
          monthlyMiscBillsNames: "",
          installmentBillsNames: ""
        }
      }
  
      throw error
    }
  }
  
  private calculateInstallmentsPaid(installments: number, createdAt: Date): number {
    const today = new Date()
  
    const monthsPassed =
    (today.getFullYear() - createdAt.getFullYear()) * 12 +
    (today.getMonth() - createdAt.getMonth())
  
    return Math.min(Math.max(monthsPassed, 0), installments)
  }
}
