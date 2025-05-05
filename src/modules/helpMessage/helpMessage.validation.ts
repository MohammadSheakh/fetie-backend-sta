import { z } from 'zod';

export const createHelpMessageValidationSchema = z.object({
  body: z.object({
    message: z  
    .string({
        required_error: 'message is required, message must be a string.',
        invalid_type_error: 'dateOfBirth must be a string.',
      }).min(5, {
      message: 'message must be at least 5 characters long.',
    }).max(500, {
      message: 'message must be at most 500 characters long.',
    }),
    
    // TODO : FIXME : userId jodi mongoose er objectId hoy tahole zod er objectId validation use kora lagbe
    userId: z
    .string({
        required_error: 'userId is required, userId must be a string.',
        invalid_type_error: 'userId must be a string.',
     }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






