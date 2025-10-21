import { IBillQueryRepository, TBillsSummary } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"
import { Bill } from "@/domain/entities"
import { Id } from "@/domain/valueObjects"

export class GetBillsSummary {
  constructor(private readonly billQueryRepository: IBillQueryRepository) {}
  
  public async execute(userId: Id): Promise<TBillsSummary> {
    try {
      const rawBills = await this.billQueryRepository.list({ userId: userId.toString() })
      const bills = rawBills.filter(bill => !bill.getDeletedAt())
  
      const fixesBills = bills.filter((bill: Bill) => !bill.getInstallmentsNumber())
      const monthlyMiscBills = bills.filter((bill: Bill) => bill.getInstallmentsNumber()?.toNumber() === 1)
      const installment_bills = bills.filter(
        (bill: Bill) => bill.getInstallmentsNumber()?.toNumber() !== undefined && bill.getInstallmentsNumber()!.toNumber() > 1
      )

      const fixesBillsNames = fixesBills.map((bill: Bill) => {
        const name = bill.getName().toString()
        const description = bill.getDescription()?.toString()
        return description ? `${name} - ${description}` : name
      }).join(", ")
      
      const monthlyMiscBillsNames = monthlyMiscBills.map((bill: Bill) => {
        const name = bill.getName().toString()
        const description = bill.getDescription()?.toString()
        return description ? `${name} - ${description}` : name
      }).join(", ")
      
      const installmentBillsNames = installment_bills.map((bill: Bill) => {
        const name = bill.getName().toString()
        const description = bill.getDescription()?.toString()
        return description ? `${name} - ${description}` : name
      }).join(", ")
  
      const thisMonthMiscBills = monthlyMiscBills.filter((bill: Bill) => bill.getCreatedAt().toDate().getMonth() === new Date().getMonth() && bill.getCreatedAt().toDate().getFullYear() === new Date().getFullYear())
      
      const installmentBillsActive = installment_bills.map((bill: Bill) => {
        const installments = bill.getInstallmentsNumber()!.toNumber()
        const createdAt = bill.getCreatedAt().toDate()
  
        const installmentsPaid = this.calculateInstallmentsPaid(installments, createdAt)
        if (installmentsPaid === installments) return null
  
        return bill
      })
  
      const installmentBillsActiveFiltered = installmentBillsActive.filter((bill: Bill | null) => bill !== null) as Bill[]

      const billsActiveCount = installmentBillsActiveFiltered.length + fixesBills.length + thisMonthMiscBills.length
  
      const totalInstallmentValue = installmentBillsActiveFiltered.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalFixedBillsValue = fixesBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalMonthlyMiscBillsValue = thisMonthMiscBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalInstallmentMonthlyValue = installmentBillsActiveFiltered.reduce((acc, bill) => acc + (bill.getValue().toNumber() / bill.getInstallmentsNumber()!.toNumber()), 0)
      
      // Calcular valor total que será pago em cada mês futuro
      const partialValueNextMonth = totalFixedBillsValue + installmentBillsActiveFiltered.reduce((acc, bill) => {
        const installments = bill.getInstallmentsNumber()!.toNumber()
        const createdAt = bill.getCreatedAt().toDate()
        const installmentsPaid = this.calculateInstallmentsPaid(installments, createdAt)
        const remainingInstallments = installments - installmentsPaid
        
        // Se ainda terá parcelas no próximo mês (pelo menos 2 parcelas restantes: 1 do mês atual + 1 do próximo)
        if (remainingInstallments >= 2) {
          return acc + (bill.getValue().toNumber() / installments)
        }
        return acc
      }, 0)
      
      const partialValue2MonthsLater = totalFixedBillsValue + installmentBillsActiveFiltered.reduce((acc, bill) => {
        const installments = bill.getInstallmentsNumber()!.toNumber()
        const createdAt = bill.getCreatedAt().toDate()
        const installmentsPaid = this.calculateInstallmentsPaid(installments, createdAt)
        const remainingInstallments = installments - installmentsPaid
        
        // Se ainda terá parcelas daqui a 2 meses (pelo menos 3 parcelas restantes)
        if (remainingInstallments >= 3) {
          return acc + (bill.getValue().toNumber() / installments)
        }
        return acc
      }, 0)
      
      const partialValue3MonthsLater = totalFixedBillsValue + installmentBillsActiveFiltered.reduce((acc, bill) => {
        const installments = bill.getInstallmentsNumber()!.toNumber()
        const createdAt = bill.getCreatedAt().toDate()
        const installmentsPaid = this.calculateInstallmentsPaid(installments, createdAt)
        const remainingInstallments = installments - installmentsPaid
        
        // Se ainda terá parcelas daqui a 3 meses (pelo menos 4 parcelas restantes)
        if (remainingInstallments >= 4) {
          return acc + (bill.getValue().toNumber() / installments)
        }
        return acc
      }, 0)
  
      const totalBillAmount = totalInstallmentValue + totalFixedBillsValue + totalMonthlyMiscBillsValue
  
      const totalValue = totalFixedBillsValue + totalMonthlyMiscBillsValue + totalInstallmentMonthlyValue
  
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
