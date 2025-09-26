import { BadRequestError } from "@/presentation/exceptions"

export function validateRequiredFields<T extends object>(
  obj: Partial<T>,
  requiredFields: (keyof T)[]
): void {
  requiredFields.forEach((key) => {
    if (obj[key] === undefined || obj[key] === null) {
      throw new BadRequestError(`Missing required parameter: ${String(key)}`)
    }
  })
}
