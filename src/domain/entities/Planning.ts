import {TPlanning} from "@/domain/protocols";
import { Id, Name, Description, Goal, MoneyValue, Plan, DateEpoch } from "@/domain/valueObjects";

export class Planning {
  constructor(
    private readonly _id: Id,
    private readonly _userId: Id,
    private readonly _name: Name,
    private readonly _goal: Goal,
    private readonly _goalValue: MoneyValue,
    private readonly _plan: Plan,
    private readonly _createdAt: DateEpoch,
    private readonly _description?: Description,
    private readonly _updatedAt?: DateEpoch,
    private readonly _deletedAt?: DateEpoch
  ) {}

  public getId(): Id {
    return this._id;
  }

  public getUserId(): Id {
    return this._userId;
  }

  public getName(): Name {
    return this._name;
  }

  public getDescription(): Description | undefined {
    return this._description;
  }

  public getGoal(): Goal {
    return this._goal;
  }

  public getGoalValue(): MoneyValue {
    return this._goalValue;
  }

  public getPlan(): Plan {
    return this._plan;
  }

  public getCreatedAt(): DateEpoch {
    return this._createdAt;
  }

  public getUpdatedAt(): DateEpoch | undefined {
    return this._updatedAt;
  }

  public getDeletedAt(): DateEpoch | undefined {
    return this._deletedAt;
  }

  public toJson(): TPlanning.Entity {
    return {
      id: this._id.toString(),
      userId: this._userId.toString(),
      name: this._name.toString(),
      description: this._description?.toString(),
      goal: this._goal.toString(),
      goalValue: this._goalValue.toNumber(),
      plan: this._plan.toString(),
      createdAt: this._createdAt.toISO(),
      updatedAt: this._updatedAt?.toISO(),
      deletedAt: this._deletedAt?.toISO(),
    };
  }
}