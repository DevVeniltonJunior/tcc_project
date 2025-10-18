import { DateEpoch } from '@/domain/valueObjects'
import { InvalidParam } from '@/domain/exceptions'

describe('[ValueObjects] DateEpoch', () => {
  const validDates = [
    {
      input: 1752070932575,
      expectedDate: new Date(1752070932575),
    },
    {
      input: new Date('2021-10-01T00:00:00.000Z'),
      expectedDate: new Date('2021-10-01T00:00:00.000Z'),
    },
    {
      input: '2023-01-01T00:00:00.000Z',
      expectedDate: new Date('2023-01-01T00:00:00.000Z'),
    },
  ]

  validDates.forEach(({ input, expectedDate }) => {
    it(`should create a DateEpoch with valid input ${input}`, () => {
      const vo = new DateEpoch(input)

      expect(vo.toNumber()).toBe(expectedDate.getTime())
      expect(vo.toDate().getTime()).toBe(expectedDate.getTime())
      expect(vo.toISO()).toBe(expectedDate.toISOString())
    })
  })

  const invalidInputs = [-1, 'invalid', null, undefined]

  invalidInputs.forEach((input) => {
    it(`should throw InvalidParam for invalid input ${input}`, () => {
      expect(() => new DateEpoch(input as any)).toThrow(InvalidParam)
      expect(() => new DateEpoch(input as any)).toThrow(`${input} is invalid`)
    })
  })
})
