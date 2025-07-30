import { BillDTO } from "@/domain/dtos";
import { Id, Name, DateEpoch, Goal, MoneyValue, Plan, Description, InstallmentsNumber } from "@/domain/valueObjects";

const id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf33");
const user_id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf65");
const name = new Name("Save for vacation");
const value = new MoneyValue(50);
const installmentsNumber = new InstallmentsNumber(2);
const description = new Description("Bill for vacation savings");
const createdAt = new DateEpoch(new Date("2024-01-01"));
const updatedAt = new DateEpoch(new Date("2024-06-01"));
const deletedAt = new DateEpoch(new Date("2024-07-01"));

describe("[Entities] Bill", () => {
  it("should create a Bill and return correct values", () => {
    const entity = new BillDTO(
      id,
      name,
      value,
      description,
      installmentsNumber,
      updatedAt,
      deletedAt
    );

    expect(entity.getId()).toBe(id);
    expect(entity.getName()).toBe(name);
    expect(entity.getDescription()).toBe(description);
    expect(entity.getValue()).toBe(value);
    expect(entity.getInstallmentsNumber()).toBe(installmentsNumber);
    expect(entity.getUpdatedAt()).toBe(updatedAt);
    expect(entity.getDeletedAt()).toBe(deletedAt);
  });

  it("should serialize Bill to JSON correctly", () => {
    const entity = new BillDTO(
      id,
      name,
      value,
      description,
      installmentsNumber,
      updatedAt,
      deletedAt
    );

    const json = entity.toJson();

    expect(json).toEqual({
      id: "a7edd8e9-6d17-4f83-9de4-4c14a29bbf33",
      name: "Save for vacation",
      description: "Bill for vacation savings",
      value: 50.00,
      installmentsNumber: 2,
      updatedAt: updatedAt.toISO(),
      deletedAt: deletedAt.toISO(),
    });
  });

  it("should handle optional fields correctly when undefined", () => {
    const user = new BillDTO(
      id
    )

    const json = user.toJson();

    expect(json.name).toBeUndefined();
    expect(json.description).toBeUndefined();
    expect(json.value).toBeUndefined();
    expect(json.installmentsNumber).toBeUndefined();
    expect(json.updatedAt).toBeUndefined();
    expect(json.deletedAt).toBeUndefined();
  });
});
