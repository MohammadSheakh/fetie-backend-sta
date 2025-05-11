import { z } from 'zod';

export const createConversationValidationSchema = z.object({
  body: z.object({
    participants : z.array(z.string(), {
      required_error: 'participants is required, participants must be an array of strings.',
      invalid_type_error: 'participants must be an array of strings.',
    }).min(1, {
      message: 'participants must be at least 1 participants.',
    }), 
    message: z.string({
      required_error: 'message is required',
      invalid_type_error: 'message must be a string',
    }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






