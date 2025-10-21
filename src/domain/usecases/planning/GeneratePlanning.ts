import { Planning, User } from "@/domain/entities"
import { IGeneratePlanning, IGetBillsSummary, IPlanningCommandRepository, TBillsSummary, TPlanning } from "@/domain/protocols"
import { DateEpoch, Description, Goal, Id, MoneyValue, Name, Plan } from "@/domain/valueObjects"
import { IAIService, JSONSchema } from "@/infra/protocols"
import { BadRequestError } from "@/presentation/exceptions"

type Output = { name: string, plan: string, description: string }

export class GeneratePlanning implements IGeneratePlanning {
  constructor(
    private readonly planningCommandRepository: IPlanningCommandRepository,
    private readonly getBillsSummary: IGetBillsSummary,
    private readonly aiService: IAIService
  ) {}

  public async execute(user: User, goal: Goal, goalValue: MoneyValue, description?: Description, previousPlanning?: Planning): Promise<Planning> {
    const salary = user.getSalary()
    if (!salary) throw new BadRequestError("User does not have a salary")
      
    const userId = user.getId()
    const billsSummary = await this.getBillsSummary.execute(userId)
    const prompt = this.getPrompt(billsSummary, goal, goalValue, salary, user.getName(), description, previousPlanning)
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

  private getPrompt(billsSummary: TBillsSummary, goal: Goal, goalValue: MoneyValue, salary: MoneyValue, name: Name, description?: Description, previousPlanning?: Planning): string {
    return `
    # Financial Planning Agent
    ## Description
    You are a financial expert agent.
    You goal is to analise the user's situation and generate a plan to achieve the goal.
    ## Context
    You are assisting user named ${name.toString()}.
    Today is ${new Date().toLocaleDateString()}.
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
    ${previousPlanning ? `- You already have a planning for this goal, so you must to analyze the previous planning and regenerate a new plan based on the previous planning and the user's situation. The previous planning is: ${previousPlanning.toJson()}` : ""}
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
          description: "A concise and descriptive name for the planning"
        },
        plan: {
          type: "string",
          description: "A detailed plan to achieve the goal. It must to be a list of steps to achieve the goal. Each step must to be a concise and descriptive step. The plan must to be in the user's language and currency."
        },
        description: {
          type: "string",
          description: "A concise and descriptive description of the plan. It must to be in the user's language and currency."
        },
      },
      required: ["name", "plan", "description"]
    }
  }
}
