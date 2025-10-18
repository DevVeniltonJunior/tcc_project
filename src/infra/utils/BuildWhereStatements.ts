import { DeepPartial } from "@/domain/protocols"

type Primitive = string | number | boolean | Date | null

export function buildWhereInput<T extends Record<string, any>>(
  filters?: DeepPartial<T>,
  options?: {
    stringFields?: (keyof T)[]
    dateFields?: (keyof T)[]
  }
): Record<string, any> {
  if (!filters) return {}

  const where: Record<string, any> = {}

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue

    if (options?.stringFields?.includes(key as keyof T)) {
      where[key] = { contains: value as string, mode: "insensitive" }
      continue
    }

    if (options?.dateFields?.includes(key as keyof T)) {
      where[key] = new Date(value as string)
      continue
    }

    where[key] = value as Primitive
  }

  return where
}
