import { Bill, Planning, User } from "@/domain/entities";
import { IBillQueryRepository, IGeneratePlanning, IPlanningCommandRepository, TBillsSummary, TPlanning } from "@/domain/protocols";
import { DateEpoch, Description, Goal, Id, MoneyValue, Name, Plan } from "@/domain/valueObjects";
import { DatabaseException } from "@/infra/exceptions";
import { IAIService, JSONSchema } from "@/infra/protocols";
import { BadRequestError } from "@/presentation/exceptions";

type Output = { name: string, plan: string, description: string }

export class GeneratePlanning implements IGeneratePlanning {
  constructor(
    private readonly planningCommandRepository: IPlanningCommandRepository,
    private readonly billQueryRepository: IBillQueryRepository,
    private readonly aiService: IAIService
  ) {}

  public async execute(user: User, goal: Goal, goalValue: MoneyValue, description?: Description): Promise<Planning> {
    const salary = user.getSalary()
    if (!salary) throw new BadRequestError("User does not have a salary")
      
    const userId = user.getId()
    const billsSummary = await this.billsHandler(userId)
    const prompt = this.getPrompt(billsSummary, goal, goalValue, salary, user.getName(), description)
    const outputSchema = this.getOutputSchema()

    const result = await this.aiService.generateStructured<Output>(prompt, outputSchema)

    return await this.planningCommandRepository.create(
      new Planning(
        Id.generate(),
        userId,
        new Name(result.data.name),
        goal,
        goalValue,
        new Plan(result.data.plan),
        new DateEpoch(new Date()),
        new Description(result.data.description)
      )
    )
  }

  private getPrompt(billsSummary: TBillsSummary, goal: Goal, goalValue: MoneyValue, salary: MoneyValue, name: Name, description?: Description): string {
    return `
    # Financial Planning Agent
    ## Description
    You are a financial expert agent.
    You goal is to analise the user's situation and generate a plan to achieve the goal.
    You are assisting user named ${name.toString()}.
    ## Rules:
    - The plant must to be consice and to the point.
    - The plant must to be realistic and achievable.
    - The plant must to be flexible and adaptable to the user's situation.
    - The plant must to be easy to understand and follow.
    - The plant must to be easy to implement and execute.
    - The plant must to be easy to measure and track.
    - The plant must to be easy to adjust and modify.
    - You can recommend to the user cancel some bills if it is not necessaty and it helps to achieve the goal.
    - You must not recommend to user avoid to pay some bills.
    - The plan must to be in the user's language and currency.
    - The plan must to be based on the user's bills and expenses and salary.
    ## inputs
    - Goal(string): The user's goal to achieve
    - Goal value(number): The value of the user's goal to achieve
    - Description(string): The description of the user's goal to achieve
    - User's salary(number): The user's salary
    - Bills summary(object): The summary of the user's bills and expenses. It must to be a object with the following properties:
      - totalBillAmount(number): The total amount of the user's bills and expenses for the next 3 months
      - totalValue(number): The total amount is the sum of the totalInstallmentValue, totalFixedBillsValue and totalMonthlyMiscBillsValue.
      - totalInstallmentValue(number): The total amount of the user's installment bills of this month
      - totalFixedBillsValue(number): The total amount of the user's fixed bills
      - totalMonthlyMiscBillsValue(number): The total amount of the user's monthly miscellaneous bills of this month
      - partialValueNextMonth(number): The total amount of the user's bills and expenses to be paid in the next month
      - partialValue2MonthsLater(number): The total amount of the user's bills and expenses to be paid in the next 2 months
      - partialValue3MonthsLater(number): The total amount of the user's bills and expenses to be paid in the next 3 months. This is the amount of the user's bills and expenses to be paid in the next 3 months.

    ## analize the situation and generate the plan:
    - Bills summary: ${JSON.stringify(billsSummary)}
    - Goal: ${goal.toString()}
    - Goal value: ${goalValue.toNumber()}
    - User's salary: ${salary.toNumber()}
    ${description ? `- Description: ${description.toString()}` : ""}
    `
  }

  private getOutputSchema(): JSONSchema {
    return {
      title: "planning_generation",
      description: "Planning generation",
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the planning"
        },
        plan: {
          type: "string",
          description: "Plan to achieve the goal"
        },
        description: {
          type: "string",
          description: "Description why the plan was generated and how it was relevant to achieve the goal"
        },
      },
      required: ["name", "plan", "description"]
    }
  }

  private async billsHandler(userId: Id): Promise<TBillsSummary> {
    try {
      const bills = await this.billQueryRepository.list({ userId: userId.toString() })

      const fixesBills = bills.filter((bill: Bill) => bill.getInstallmentsNumber() === undefined)
      const monthlyMiscBills = bills.filter((bill: Bill) => bill.getInstallmentsNumber()?.toNumber() === 1)
      const installment_bills = bills.filter(
        (bill: Bill) => bill.getInstallmentsNumber()?.toNumber() !== undefined && bill.getInstallmentsNumber()!.toNumber() > 1
      )

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

      const totalInstallmentValue = installmentBillsActiveFiltered.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalFixedBillsValue = fixesBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const totalMonthlyMiscBillsValue = thisMonthMiscBills.reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValueNextMonth = nextMonthInstallmentBills["1"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValue2MonthsLater = nextMonthInstallmentBills["2"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)
      const partialValue3MonthsLater = nextMonthInstallmentBills["3"].reduce((acc, bill) => acc + bill.getValue().toNumber(), 0)

      const totalBillAmount = totalInstallmentValue + totalFixedBillsValue + totalMonthlyMiscBillsValue + partialValueNextMonth + partialValue2MonthsLater + partialValue3MonthsLater

      const totalValue = totalInstallmentValue + totalFixedBillsValue + totalMonthlyMiscBillsValue

      return {
        totalBillAmount: totalBillAmount,
        totalValue: totalValue,
        totalInstallmentValue: totalInstallmentValue,
        totalFixedBillsValue: totalFixedBillsValue,
        totalMonthlyMiscBillsValue: totalMonthlyMiscBillsValue,
        partialValueNextMonth: partialValueNextMonth,
        partialValue2MonthsLater: partialValue2MonthsLater,
        partialValue3MonthsLater: partialValue3MonthsLater
      }
    }
    catch(error) {
      if (error instanceof DatabaseException && error.message === "Bills not found") {
        return {
          totalBillAmount: 0,
          totalValue: 0,
          totalInstallmentValue: 0,
          totalFixedBillsValue: 0,
          totalMonthlyMiscBillsValue: 0,
          partialValueNextMonth: 0,
          partialValue2MonthsLater: 0,
          partialValue3MonthsLater: 0
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