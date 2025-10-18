import { UserDTO } from "@/domain/dtos";
import { Id, Name, DateEpoch, Email, MoneyValue } from "@/domain/valueObjects";

const id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf33");
const name = new Name("John Doe");
const birthdate = new DateEpoch(new Date("1990-01-01"));
const email = new Email("john.doe@example.com");
const createdAt = new DateEpoch(new Date("2024-01-01"));
const updatedAt = new DateEpoch(new Date("2024-06-01"));
const deletedAt = new DateEpoch(new Date("2024-07-01"));
const salary = new MoneyValue(5000);

describe("[Entities] User", () => {
  it("should create a user and return correct values", () => {
    const user = new UserDTO(
      id,
      name,
      birthdate,
      email,
      salary,
      updatedAt,
      deletedAt
    );

    expect(user.getId()).toBe(id);
    expect(user.getName()).toBe(name);
    expect(user.getBirthdate()).toBe(birthdate);
    expect(user.getEmail()).toBe(email);
    expect(user.getUpdatedAt()).toBe(updatedAt);
    expect(user.getDeletedAt()).toBe(deletedAt);
    expect(user.getSalary()).toBe(salary);
  });

  it("should serialize user to JSON correctly", () => {
    const user = new UserDTO(
      id,
      name,
      birthdate,
      email,
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
      updatedAt: updatedAt.toISO(),
      deletedAt: deletedAt.toISO(),
    });
  });

  it("should handle optional fields correctly when undefined", () => {
    const user = new UserDTO(
      id
    );

    const json = user.toJson();

    expect(json.name).toBeUndefined();
    expect(json.birthdate).toBeUndefined();
    expect(json.email).toBeUndefined();
    expect(json.salary).toBeUndefined();
    expect(json.updatedAt).toBeUndefined();
    expect(json.deletedAt).toBeUndefined();
  });
});
