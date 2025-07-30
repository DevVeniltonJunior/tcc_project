import {TPlanning} from "@/domain/protocols";
import { Id, Name, Description, Goal, MoneyValue, Plan, DateEpoch } from "@/domain/valueObjects";

export class PlanningDTO {
  constructor(
    private readonly _id: Id,
    private readonly _name?: Name,
    private readonly _goal?: Goal,
    private readonly _goalValue?: MoneyValue,
    private readonly _plan?: Plan,
    private readonly _description?: Description,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getName(): Name | undefined {
    return this._name;
  }

  public getDescription(): Description | undefined {
    return this._description;
  }

  public getGoal(): Goal | undefined {
    return this._goal;
  }

  public getGoalValue(): MoneyValue | undefined {
    return this._goalValue;
  }

  public getPlan(): Plan | undefined {
    return this._plan;
  }

  public getUpdatedAt(): DateEpoch | undefined {
    return this._updatedAt;
  }

  public getDeletedAt(): DateEpoch | undefined {
    return this._deletedAt;
  }

  public toJson(): TPlanning.DTO {
    return {
      id: this._id.toString(),
      name: this._name ? this._name.toString() : undefined,
      description: this._description ? this._description.toString() : undefined,
      goal: this._goal ? this._goal.toString() : undefined,
      goalValue: this._goalValue ? this._goalValue.toNumber() : undefined,
      plan: this._plan ? this._plan.toString() : undefined,
      updatedAt: this._updatedAt ? this._updatedAt.toISO() : undefined,
      deletedAt: this._deletedAt ? this._deletedAt.toISO() : undefined,
    };
  }
}