import { BillDTO } from '@/domain/dtos'

export interface IUpdateBill {
  execute: (dto: BillDTO) => Promise<void>
}