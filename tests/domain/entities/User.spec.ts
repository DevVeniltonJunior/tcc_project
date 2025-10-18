import { User, Password, Bill, Planning } from "@/domain/entities";
import { Id, Name, DateEpoch, Email, MoneyValue } from "@/domain/valueObjects";

const id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf33");
const name = new Name("John Doe");
const birthdate = new DateEpoch(new Date("1990-01-01"));
const email = new Email("john.doe@example.com");
const password = { toJson: () => ({ id: "password-1" }) } as unknown as Password;
const billMock = { toJson: () => ({ id: "bill-1" }) } as unknown as Bill;
const planningMock = { toJson: () => ({ id: "plan-1" }) } as unknown as Planning;
const createdAt = new DateEpoch(new Date("2024-01-01"));
const updatedAt = new DateEpoch(new Date("2024-06-01"));
const deletedAt = new DateEpoch(new Date("2024-07-01"));
const salary = new MoneyValue(5000);

describe("[Entities] User", () => {
  it("should create a user and return correct values", () => {
    const user = new User(
      id,
      name,
      birthdate,
      email,
      createdAt,
      password,
      [billMock],
      [planningMock],
      salary,
      updatedAt,
      deletedAt
    );

    expect(user.getId()).toBe(id);
    expect(user.getName()).toBe(name);
    expect(user.getBirthdate()).toBe(birthdate);
    expect(user.getEmail()).toBe(email);
    expect(user.getPassword()).toBe(password);
    expect(user.getBills()).toEqual([billMock]);
    expect(user.getPlanning()).toEqual([planningMock]);
    expect(user.getCreatedAt()).toBe(createdAt);
    expect(user.getUpdatedAt()).toBe(updatedAt);
    expect(user.getDeletedAt()).toBe(deletedAt);
    expect(user.getSalary()).toBe(salary);
  });

  it("should serialize user to JSON correctly", () => {
    const user = new User(
      id,
      name,
      birthdate,
      email,
      createdAt,
      password,
      [billMock],
      [planningMock],
      salary,
      updatedAt,
      deletedAt
    );

    const json = user.toJson();

    expect(json).toEqual({
      id: "a7edd8e9-6d17-4f83-9de4-4c14a29bbf33",
      name: "John Doe",
      birthdate: birthdate.toISO(),
      email: "john.doe@example.com",
      salary: 5000,
      password: password.toJson(),
      bills: [{ id: "bill-1" }],
      planning: [{ id: "plan-1" }],
      createdAt: createdAt.toISO(),
      updatedAt: updatedAt.toISO(),
      deletedAt: deletedAt.toISO(),
    });
  });

  it("should handle optional fields correctly when undefined", () => {
    const user = new User(
      id,
      name,
      birthdate,
      email,
      createdAt,
      password
    );

    const json = user.toJson();

    expect(json.salary).toBeUndefined();
    expect(json.updatedAt).toBeUndefined();
    expect(json.deletedAt).toBeUndefined();
  });
});
