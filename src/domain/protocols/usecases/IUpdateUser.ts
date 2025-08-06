import { UserDTO } from '@/domain/dtos'

export interface IUpdateUser {
  execute: (dto: UserDTO) => Promise<void>
}