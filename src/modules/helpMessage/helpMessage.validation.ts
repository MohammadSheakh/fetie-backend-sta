import { z } from 'zod';

export const createHelpMessageValidationSchema = z.object({
  body: z.object({
    dateOfBirth: z  
    .string({
        required_error: 'dateOfBirth is required, dateOfBirth must be a date.',
        invalid_type_error: 'dateOfBirth must be a date.',
      })
      .transform((str) => new Date(str)) // Transform the string into a Date object
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid date format.',
      })
  }),
});






