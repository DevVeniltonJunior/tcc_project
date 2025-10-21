import { Planning, User } from "@/domain/entities"
import { Description, Goal, MoneyValue } from "@/domain/valueObjects"

export interface IGeneratePlanning {
  execute: (user: User, goal: Goal, goalValue: MoneyValue, description?: Description, previousPlanning?: Planning) => Promise<Planning>
}