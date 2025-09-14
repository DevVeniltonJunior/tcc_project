import { Password } from '@/domain/entities'
import { TPassword } from '@/domain/protocols'
import { Id, DateEpoch, PasswordHash, Bool } from '@/domain/valueObjects'

export class PasswordAdapter {
  public static toEntity(model: TPassword.Entity): Password {
    return new Password(
      new Id(model.id),
      new Id(model.userId),
      new PasswordHash(model.password),
      new Bool(model.active),
      new DateEpoch(model.createdAt)
    )
  }

  public static toModel(entity: Password): TPassword.Model {
    return entity.toJson()
  }
}
