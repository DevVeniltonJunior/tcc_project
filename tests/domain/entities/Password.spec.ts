import { Password } from "@/domain/entities";
import { Id, DateEpoch, PasswordHash, Bool } from "@/domain/valueObjects";

const id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf33");
const user_id = new Id("a7edd8e9-6d17-4f83-9de4-4c14a29bbf65");
const passwordHash = new PasswordHash("Save for vacation");
const active = new Bool(true);
const createdAt = new DateEpoch(new Date("2024-01-01"));

describe("[Entities] Password", () => {
  it("should create a Password and return correct values", () => {
    const entity = new Password(
      id,
      user_id,
      passwordHash,
      active,
      createdAt
    );

    expect(entity.getId()).toBe(id);
    expect(entity.getUserId()).toBe(user_id);
    expect(entity.getPassword()).toBe(passwordHash);
    expect(entity.isActive()).toBe(active);
    expect(entity.getCreatedAt()).toBe(createdAt);
  });

  it("should serialize Password to JSON correctly", () => {
    const entity = new Password(
      id,
      user_id,
      passwordHash,
      active,
      createdAt
    );

    const json = entity.toJson();

    expect(json).toEqual({
      id: "a7edd8e9-6d17-4f83-9de4-4c14a29bbf33",
      userId: "a7edd8e9-6d17-4f83-9de4-4c14a29bbf65",
      password: "Save for vacation",
      active: true,
      createdAt: createdAt.toISO(),
    });
  });
});
