import { PlanningDTO } from "@/domain/dtos";
import { Id, Name, DateEpoch, Goal, MoneyValue, Plan, Description } from "@/domain/valueObjects";

const id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf33");
const user_id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf65");
const name = new Name("Save for vacation");
const goal = new Goal("Save for 5k for vacation");
const goalValue = new MoneyValue(50);
const plan = new Plan("Monthly savings plan");
const description = new Description("Planning for vacation savings");
const createdAt = new DateEpoch(new Date("2024-01-01"));
const updatedAt = new DateEpoch(new Date("2024-06-01"));
const deletedAt = new DateEpoch(new Date("2024-07-01"));

describe("[Entities] Planning", () => {
  it("should create a planning and return correct values", () => {
    const entity = new PlanningDTO(
      id,
      name,
      goal,
      goalValue,
      plan,
      description,
      updatedAt,
      deletedAt
    );

    expect(entity.getId()).toBe(id);
    expect(entity.getName()).toBe(name);
    expect(entity.getDescription()).toBe(description);
    expect(entity.getGoal()).toBe(goal);
    expect(entity.getGoalValue()).toBe(goalValue);
    expect(entity.getPlan()).toBe(plan);
    expect(entity.getUpdatedAt()).toBe(updatedAt);
    expect(entity.getDeletedAt()).toBe(deletedAt);
  });

  it("should serialize planning to JSON correctly", () => {
    const entity = new PlanningDTO(
      id,
      name,
      goal,
      goalValue,
      plan,
      description,
      updatedAt,
      deletedAt
    );

    const json = entity.toJson();

    expect(json).toEqual({
      id: "a7edd8e9-6d17-4f83-9de4-4c14a29bbf33",
      name: "Save for vacation",
      description: "Planning for vacation savings",
      goal: "Save for 5k for vacation",
      goalValue: 50.00,
      plan: "Monthly savings plan",
      updatedAt: updatedAt.toISO(),
      deletedAt: deletedAt.toISO(),
    });
  });

  it("should handle optional fields correctly when undefined", () => {
    const user = new PlanningDTO(
      id
    );

    const json = user.toJson();

    expect(json.name).toBeUndefined();
    expect(json.description).toBeUndefined();
    expect(json.goal).toBeUndefined();
    expect(json.goalValue).toBeUndefined();
    expect(json.plan).toBeUndefined();
    expect(json.updatedAt).toBeUndefined();
    expect(json.deletedAt).toBeUndefined();
  });
});
