import { GetBillsSummary } from "@/domain/utils/GetBillsSummary"
import { Bill } from "@/domain/entities"
import { IBillQueryRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, MoneyValue, InstallmentsNumber, Description } from "@/domain/valueObjects"
import { DatabaseException } from "@/infra/exceptions"

describe("[Utils] GetBillsSummary", () => {
  let repository: jest.Mocked<IBillQueryRepository>
  let util: GetBillsSummary
  let userId: Id

  beforeEach(() => {
    repository = {
      list: jest.fn(),
      find: jest.fn(),
      get: jest.fn()
    } as unknown as jest.Mocked<IBillQueryRepository>

    util = new GetBillsSummary(repository)
    userId = Id.generate()
  })

  describe("execute", () => {
    it("should return empty summary when DatabaseException with 'Bills not found' is thrown", async () => {
      repository.list.mockRejectedValue(new DatabaseException("Bills not found"))

      const result = await util.execute(userId)

      expect(result).toEqual({
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
      })
    })

    it("should throw error when exception is not DatabaseException with 'Bills not found'", async () => {
      const error = new Error("Generic error")
      repository.list.mockRejectedValue(error)

      await expect(util.execute(userId)).rejects.toThrow("Generic error")
    })

    it("should throw error when DatabaseException with different message is thrown", async () => {
      const error = new DatabaseException("Database connection failed")
      repository.list.mockRejectedValue(error)

      await expect(util.execute(userId)).rejects.toThrow("Database connection failed")
    })

    it("should categorize and calculate summary for fixed bills only", async () => {
      const fixedBill1 = new Bill(
        Id.generate(),
        userId,
        new Name("Internet"),
        new MoneyValue(100),
        new DateEpoch(Date.now()),
        new Description("Monthly internet")
      )

      const fixedBill2 = new Bill(
        Id.generate(),
        userId,
        new Name("Rent"),
        new MoneyValue(1000),
        new DateEpoch(Date.now()),
        new Description("Monthly rent")
      )

      repository.list.mockResolvedValue([fixedBill1, fixedBill2])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(2)
      expect(result.totalFixedBillsValue).toBe(1100)
      expect(result.totalValue).toBe(1100)
      expect(result.totalBillAmount).toBe(1100)
      expect(result.totalInstallmentValue).toBe(0)
      expect(result.totalMonthlyMiscBillsValue).toBe(0)
      expect(result.fixesBillsNames).toBe("Internet, Rent")
      expect(result.monthlyMiscBillsNames).toBe("")
      expect(result.installmentBillsNames).toBe("")
    })

    it("should categorize and calculate summary for monthly misc bills (installments = 1) from current month", async () => {
      const now = new Date()
      const monthlyBill1 = new Bill(
        Id.generate(),
        userId,
        new Name("Grocery"),
        new MoneyValue(200),
        new DateEpoch(now),
        new Description("Monthly grocery"),
        new InstallmentsNumber(1)
      )

      const monthlyBill2 = new Bill(
        Id.generate(),
        userId,
        new Name("Restaurant"),
        new MoneyValue(150),
        new DateEpoch(now),
        new Description("Restaurant bill"),
        new InstallmentsNumber(1)
      )

      repository.list.mockResolvedValue([monthlyBill1, monthlyBill2])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(2)
      expect(result.totalMonthlyMiscBillsValue).toBe(350)
      expect(result.totalValue).toBe(350)
      expect(result.totalBillAmount).toBe(350)
      expect(result.totalFixedBillsValue).toBe(0)
      expect(result.totalInstallmentValue).toBe(0)
      expect(result.monthlyMiscBillsNames).toBe("Grocery, Restaurant")
      expect(result.fixesBillsNames).toBe("")
      expect(result.installmentBillsNames).toBe("")
    })

    it("should ignore monthly misc bills from previous months", async () => {
      const now = new Date()
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      
      const currentMonthBill = new Bill(
        Id.generate(),
        userId,
        new Name("Current Month"),
        new MoneyValue(100),
        new DateEpoch(now),
        new Description("Current month bill"),
        new InstallmentsNumber(1)
      )

      const previousMonthBill = new Bill(
        Id.generate(),
        userId,
        new Name("Previous Month"),
        new MoneyValue(200),
        new DateEpoch(previousMonth),
        new Description("Previous month bill"),
        new InstallmentsNumber(1)
      )

      repository.list.mockResolvedValue([currentMonthBill, previousMonthBill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.totalMonthlyMiscBillsValue).toBe(100)
      // Note: monthlyMiscBillsNames includes ALL bills with installments=1, not just current month
      expect(result.monthlyMiscBillsNames).toBe("Current Month, Previous Month")
    })

    it("should categorize and calculate summary for active installment bills", async () => {
      const now = new Date()
      // Bill created 2 months ago with 6 installments (4 remaining)
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15)
      
      const installmentBill = new Bill(
        Id.generate(),
        userId,
        new Name("Television"),
        new MoneyValue(300),
        new DateEpoch(twoMonthsAgo),
        new Description("TV installment"),
        new InstallmentsNumber(6)
      )

      repository.list.mockResolvedValue([installmentBill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.totalInstallmentValue).toBe(300)
      expect(result.totalValue).toBe(300)
      expect(result.installmentBillsNames).toBe("Television")
      expect(result.partialValue3MonthsLater).toBe(300) // 4 remaining installments (>=3)
    })

    it("should exclude fully paid installment bills", async () => {
      const now = new Date()
      // Bill created 6 months ago with 6 installments (all paid)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 15)
      
      const paidBill = new Bill(
        Id.generate(),
        userId,
        new Name("Phone"),
        new MoneyValue(500),
        new DateEpoch(sixMonthsAgo),
        new Description("Phone installment"),
        new InstallmentsNumber(6)
      )

      repository.list.mockResolvedValue([paidBill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(0)
      expect(result.totalInstallmentValue).toBe(0)
      expect(result.totalValue).toBe(0)
    })

    it("should categorize installment bills by remaining installments (1 remaining)", async () => {
      const now = new Date()
      // Bill created 5 months ago with 6 installments (1 remaining)
      const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 15)
      
      const bill = new Bill(
        Id.generate(),
        userId,
        new Name("Laptop"),
        new MoneyValue(1200),
        new DateEpoch(fiveMonthsAgo),
        new Description("Laptop installment"),
        new InstallmentsNumber(6)
      )

      repository.list.mockResolvedValue([bill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.partialValueNextMonth).toBe(1200)
      expect(result.partialValue2MonthsLater).toBe(0)
      expect(result.partialValue3MonthsLater).toBe(0)
    })

    it("should categorize installment bills by remaining installments (2 remaining)", async () => {
      const now = new Date()
      // Bill created 4 months ago with 6 installments (2 remaining)
      const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 15)
      
      const bill = new Bill(
        Id.generate(),
        userId,
        new Name("Tablet"),
        new MoneyValue(800),
        new DateEpoch(fourMonthsAgo),
        new Description("Tablet installment"),
        new InstallmentsNumber(6)
      )

      repository.list.mockResolvedValue([bill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.partialValueNextMonth).toBe(0)
      expect(result.partialValue2MonthsLater).toBe(800)
      expect(result.partialValue3MonthsLater).toBe(0)
    })

    it("should categorize installment bills by remaining installments (3+ remaining)", async () => {
      const now = new Date()
      // Bill created 1 month ago with 12 installments (11 remaining)
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      
      const bill = new Bill(
        Id.generate(),
        userId,
        new Name("Course"),
        new MoneyValue(600),
        new DateEpoch(oneMonthAgo),
        new Description("Online course"),
        new InstallmentsNumber(12)
      )

      repository.list.mockResolvedValue([bill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.partialValueNextMonth).toBe(0)
      expect(result.partialValue2MonthsLater).toBe(0)
      expect(result.partialValue3MonthsLater).toBe(600)
    })

    it("should handle bills created in the current month", async () => {
      const now = new Date()
      
      const bill = new Bill(
        Id.generate(),
        userId,
        new Name("New Purchase"),
        new MoneyValue(400),
        new DateEpoch(now),
        new Description("Recent purchase"),
        new InstallmentsNumber(4)
      )

      repository.list.mockResolvedValue([bill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(1)
      expect(result.totalInstallmentValue).toBe(400)
      expect(result.partialValue3MonthsLater).toBe(400) // 4 remaining installments
    })

    it("should calculate comprehensive summary with mixed bill types", async () => {
      const now = new Date()
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15)
      const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 15)
      
      // Fixed bill (no installments)
      const fixedBill = new Bill(
        Id.generate(),
        userId,
        new Name("Internet"),
        new MoneyValue(100),
        new DateEpoch(now)
      )

      // Monthly misc bill (installments = 1, current month)
      const monthlyBill = new Bill(
        Id.generate(),
        userId,
        new Name("Grocery"),
        new MoneyValue(200),
        new DateEpoch(now),
        new Description("Monthly grocery"),
        new InstallmentsNumber(1)
      )

      // Active installment bill (4 remaining out of 6)
      const installmentBill = new Bill(
        Id.generate(),
        userId,
        new Name("Television"),
        new MoneyValue(300),
        new DateEpoch(twoMonthsAgo),
        new Description("TV installment"),
        new InstallmentsNumber(6)
      )

      // Installment bill with 1 remaining
      const almostPaidBill = new Bill(
        Id.generate(),
        userId,
        new Name("Laptop"),
        new MoneyValue(1200),
        new DateEpoch(fiveMonthsAgo),
        new Description("Laptop installment"),
        new InstallmentsNumber(6)
      )

      repository.list.mockResolvedValue([fixedBill, monthlyBill, installmentBill, almostPaidBill])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(4)
      expect(result.totalFixedBillsValue).toBe(100)
      expect(result.totalMonthlyMiscBillsValue).toBe(200)
      expect(result.totalInstallmentValue).toBe(1500) // 300 + 1200
      expect(result.totalValue).toBe(1800) // 100 + 200 + 1500
      // totalBillAmount = totalValue (1800) + partialNextMonth (1200) + partial3MonthsLater (300) = 3300
      expect(result.totalBillAmount).toBe(3300)
      expect(result.partialValueNextMonth).toBe(1200) // almostPaidBill
      expect(result.partialValue3MonthsLater).toBe(300) // installmentBill (4 remaining)
      expect(result.fixesBillsNames).toBe("Internet")
      expect(result.monthlyMiscBillsNames).toBe("Grocery")
      expect(result.installmentBillsNames).toBe("Television, Laptop")
    })

    it("should handle empty bill list", async () => {
      repository.list.mockResolvedValue([])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(0)
      expect(result.totalValue).toBe(0)
      expect(result.totalBillAmount).toBe(0)
      expect(result.fixesBillsNames).toBe("")
      expect(result.monthlyMiscBillsNames).toBe("")
      expect(result.installmentBillsNames).toBe("")
    })

    it("should call repository with correct userId", async () => {
      repository.list.mockResolvedValue([])

      await util.execute(userId)

      expect(repository.list).toHaveBeenCalledWith({ userId: userId.toString() })
    })

    it("should calculate totalBillAmount including all partial values", async () => {
      const now = new Date()
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 15)
      const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 15)
      
      // Bill with 1 remaining (partialValueNextMonth)
      const bill1 = new Bill(
        Id.generate(),
        userId,
        new Name("Bill1"),
        new MoneyValue(100),
        new DateEpoch(fiveMonthsAgo),
        new Description("Bill 1"),
        new InstallmentsNumber(6)
      )

      // Bill with 2 remaining (partialValue2MonthsLater)
      const bill2 = new Bill(
        Id.generate(),
        userId,
        new Name("Bill2"),
        new MoneyValue(200),
        new DateEpoch(fourMonthsAgo),
        new Description("Bill 2"),
        new InstallmentsNumber(6)
      )

      // Bill with 11 remaining (partialValue3MonthsLater)
      const bill3 = new Bill(
        Id.generate(),
        userId,
        new Name("Bill3"),
        new MoneyValue(300),
        new DateEpoch(oneMonthAgo),
        new Description("Bill 3"),
        new InstallmentsNumber(12)
      )

      repository.list.mockResolvedValue([bill1, bill2, bill3])

      const result = await util.execute(userId)

      expect(result.totalInstallmentValue).toBe(600)
      expect(result.totalValue).toBe(600)
      expect(result.partialValueNextMonth).toBe(100)
      expect(result.partialValue2MonthsLater).toBe(200)
      expect(result.partialValue3MonthsLater).toBe(300)
      // totalBillAmount = totalValue (600) + all partials (100 + 200 + 300) = 1200
      expect(result.totalBillAmount).toBe(1200)
    })

    it("should handle bills created in future months (edge case)", async () => {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15)
      
      const futureBill = new Bill(
        Id.generate(),
        userId,
        new Name("Future Bill"),
        new MoneyValue(500),
        new DateEpoch(nextMonth),
        new Description("Future bill"),
        new InstallmentsNumber(12)
      )

      repository.list.mockResolvedValue([futureBill])

      const result = await util.execute(userId)

      // Since it's created in the future, months passed will be negative, clamped to 0
      // So 0 installments paid, 12 remaining (>=3)
      expect(result.billsActiveCount).toBe(1)
      expect(result.totalInstallmentValue).toBe(500)
      expect(result.partialValue3MonthsLater).toBe(500)
    })

    it("should handle multiple bills with same remaining installments count", async () => {
      const now = new Date()
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      
      const bill1 = new Bill(
        Id.generate(),
        userId,
        new Name("Bill A"),
        new MoneyValue(100),
        new DateEpoch(oneMonthAgo),
        new Description("Bill A"),
        new InstallmentsNumber(12)
      )

      const bill2 = new Bill(
        Id.generate(),
        userId,
        new Name("Bill B"),
        new MoneyValue(200),
        new DateEpoch(oneMonthAgo),
        new Description("Bill B"),
        new InstallmentsNumber(15)
      )

      repository.list.mockResolvedValue([bill1, bill2])

      const result = await util.execute(userId)

      expect(result.billsActiveCount).toBe(2)
      expect(result.totalInstallmentValue).toBe(300)
      expect(result.partialValue3MonthsLater).toBe(300) // Both have >= 3 remaining
      expect(result.installmentBillsNames).toBe("Bill A, Bill B")
    })
  })
})

