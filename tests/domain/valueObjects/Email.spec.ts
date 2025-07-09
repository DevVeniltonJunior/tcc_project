import { Email } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Email', () => {
  const validInput = ['john-doe@gmail.com', 'doe_john@outlook.com', 'rnt.rnt10@hotmail.com'];
  const invalidInput = ['john@doe@gmail.com', 'doe_john', '@hotmail.com'];

  validInput.map((email) => {
    it(`should create an valid email with a value ${email}`, () => {
      const valueObject = new Email(email);
      expect(valueObject.toString()).toBe(email);
    });
  })

  invalidInput.map((email) => {
    it(`should throw an error with an invalid email with a value ${email}`, () => {
      expect(() => new Email(email)).toThrow(InvalidParam);
      expect(() => new Email(email)).toThrow(`${email} is invalid`);
    });
  })
})