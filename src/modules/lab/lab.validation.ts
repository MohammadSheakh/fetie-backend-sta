import { z } from 'zod';

export const createLabValidationSchema = z.object({
  body: z.object({
    name: z  
    .string({
        required_error: 'message is required, message must be a string.',
        invalid_type_error: 'dateOfBirth must be a string.',
      }).min(5, {
      message: 'message must be at least 5 characters long.',
    }).max(500, {
      message: 'message must be at most 500 characters long.',
    }),
    email: z
    .string({
        required_error: 'email is required, email must be a string.',
        invalid_type_error: 'email must be a string.',
      }).email({
      message: 'email must be a valid email address.',
    }),
    url: z
    .string({
        required_error: 'url is required, url must be a string.',
        invalid_type_error: 'url must be a string.',
      }).url({
      message: 'url must be a valid url.',
    }),
    description: z
    .string({
        required_error: 'description is required, description must be a string.',
        invalid_type_error: 'description must be a string.',
      }).min(5, {
      message: 'description must be at least 5 characters long.',
    }).max(500, {
      message: 'description must be at most 500 characters long.',
    }),

    // TODO : FIXME : userId jodi mongoose er objectId hoy tahole zod er objectId validation use kora lagbe
    // userId: z
    // .string({
    //     required_error: 'userId is required, userId must be a string.',
    //     invalid_type_error: 'userId must be a string.',
    //  }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






