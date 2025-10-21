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
    
    ## Your Role
    You are an expert financial advisor specializing in personalized financial planning.
    Your goal is to analyze the user's financial situation and create a detailed, actionable plan to help them achieve their financial goal.
    
    ## Context
    - User: ${name.toString()}
    - Date: ${new Date().toLocaleDateString()}
    
    ## Planning Requirements
    - Create a DETAILED and SPECIFIC plan with clear, actionable steps
    - Include concrete numbers, timelines, and milestones
    - Be realistic and achievable based on the user's financial situation
    - Provide practical advice that can be implemented immediately
    - Structure the plan chronologically with measurable objectives
    - Calculate exact monthly savings needed and provide a timeline to reach the goal
    - Analyze current expenses and identify optimization opportunities
    - You may suggest canceling non-essential bills if it helps achieve the goal faster
    - NEVER recommend avoiding payment of legitimate bills or debts
    - The plan must be in the user's language and use their currency
    - Base all recommendations on the provided salary, bills, and expenses data
    - DO NOT use Markdown formatting (no #, *, -, etc.). Write in plain text using paragraphs only
    - ALWAYS respond in the same language as the user's input data (goal, description, etc.)
    
    ## Financial Data Summary
    
    ### User's Goal
    - Goal: ${goal.toString()}
    - Target Amount: ${goalValue.toNumber()}
    ${description ? `- Additional Details: ${description.toString()}` : ""}
    
    ### Monthly Income
    - Salary: ${salary.toNumber()}
    
    ### Bills and Expenses Breakdown
    ${JSON.stringify(billsSummary, null, 2)}
    
    **Key Metrics:**
    - totalValue: Current month's total expenses (installments + fixed bills + miscellaneous)
    - totalInstallmentValue: Installment payments this month
    - totalFixedBillsValue: Recurring fixed expenses
    - totalMonthlyMiscBillsValue: Variable miscellaneous expenses this month
    - partialValueNextMonth: Projected expenses for next month
    - partialValue2MonthsLater: Projected expenses in 2 months
    - partialValue3MonthsLater: Projected expenses in 3 months
    - totalBillAmount: Total projected expenses for the next 3 months
    
    ${previousPlanning ? `### Previous Planning Reference\nThis goal already has an existing plan. Analyze it and generate an UPDATED plan that reflects the current financial situation:\n${previousPlanning.toJson()}\n` : ""}
    
    ## Task
    Analyze the financial data above and generate a comprehensive, step-by-step financial plan that will enable ${name.toString()} to achieve their goal of ${goal.toString()} with a target amount of ${goalValue.toNumber()}.
    
    Your plan should include:
    1. Current financial situation analysis (income vs. expenses)
    2. Monthly saving capacity calculation
    3. Estimated timeline to reach the goal
    4. Specific actions to optimize expenses (with amounts)
    5. Monthly milestones and checkpoints
    6. Contingency recommendations
    7. Bills or expenses that could be reduced or eliminated (be specific)
    `
  }

  private getOutputSchema(): JSONSchema {
    return {
      title: "planning_generation",
      description: "Financial planning generation with detailed action plan",
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "A concise and meaningful name for this financial plan (max 60 characters), do not use the user's name."
        },
        plan: {
          type: "string",
          description: "The COMPLETE and DETAILED financial plan. Must include: financial situation analysis, exact monthly savings calculations, specific timeline with milestones, concrete actions to optimize expenses (with amounts), step-by-step instructions, and contingency recommendations. This should be comprehensive and actionable. Write in the user's language and use their currency."
        },
        description: {
          type: "string",
          description: "A VERY BRIEF summary of the plan in 1-2 sentences. This is just a quick overview, NOT the detailed plan. Write in the user's language."
        },
      },
      required: ["name", "plan", "description"]
    }
  }
}
