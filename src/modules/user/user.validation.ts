import { z } from 'zod';
import { Role, Roles } from '../../middlewares/roles';
import { max } from 'date-fns';

const createUserValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'name is required.',
        invalid_type_error: 'name must be a string.',
      })
      .min(1, 'name cannot be empty.'),
    email: z
      .string({
        required_error: 'Email is required.',
        invalid_type_error: 'Email must be a string.',
      })
      .email('Invalid email address.'),
    password: z
      .string({
        required_error: 'Password is required.',
        invalid_type_error: 'Password must be a string.',
      })
      .min(8, 'Password must be at least 8 characters long.'),

    role: z.string({
        required_error: 'Role is required.',
        invalid_type_error: 'Role must be a string.',
    })
    .refine(role => role === 'user', {
        message: 'Role must be "user".',
    }),

    /*
    role: z
      .string({
        required_error: 'Role is required.',
        invalid_type_error: 'Role must be a string.',
      })
      .refine(role => Roles.includes(role as Role), {
        message: `Role must be one of the following: ${Roles.join(', ')}`,
      }),
    */
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string({
        invalid_type_error: 'Full name must be a string.',
      })
      .min(1, 'Full name cannot be empty.')
      .optional(),
    email: z
      .string({
        invalid_type_error: 'Email must be a string.',
      })
      .email('Invalid email address.')
      .optional(),
    password: z
      .string({
        invalid_type_error: 'Password must be a string.',
      })
      .min(8, 'Password must be at least 8 characters long.')
      .optional(),
    branch: z
      .string({
        invalid_type_error: 'Branch must be a string.',
      })
      .optional(),
    currentStatus: z
      .enum(['active-duty', 'reserve', 'retried'], {
        invalid_type_error: 'Current status must be a valid option.',
      })
      .optional(),
    description: z
      .string({
        invalid_type_error: 'Description must be a string.',
      })
      .optional(),
    role: z
      .string({
        invalid_type_error: 'Role must be a string.',
      })
      .refine(role => Roles.includes(role as Role), {
        message: `Role must be one of the following: ${Roles.join(', ')}`,
      })
      .optional(),
    isDeleted: z
      .boolean({
        invalid_type_error: 'isDeleted must be a boolean.',
      })
      .optional(),
    isBlocked: z
      .boolean({
        invalid_type_error: 'isBlocked must be a boolean.',
      })
      .optional(),
    isEmailVerified: z
      .boolean({
        invalid_type_error: 'isEmailVerified must be a boolean.',
      })
      .optional(),
    isResetPassword: z
      .boolean({
        invalid_type_error: 'isResetPassword must be a boolean.',
      })
      .optional(),
  }),
});

const changeUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(['Active', 'Inactive'], {
      required_error: 'Status is required.',
      invalid_type_error: 'Status must be a valid option.',
    }),
  }),
});


const createAccessPinCodeValidationSchema = z.object({
  body: z.object({
    accessPinCode : z
      .string({
        required_error: 'accessPinCode is required.',
        invalid_type_error: 'accessPinCode must be a string.',
      })
      .min(5, 'accessPinCode should be atleast 5 number.')
      .max(5, 'accessPinCode can not exceed 5 number.'),
  }),
});

const sendInvitationToBeAdminValidationSchema = z.object({
  body: z.object({
    email : z.
      string({
        required_error: 'email is required.',
        invalid_type_error: 'email must be a string.',
      })
      .email('Invalid email address.'),
    password : z
      .string({
        required_error: 'password is required.',
        invalid_type_error: 'password must be a string.',
      }),
      
      fullName: z.string({
        required_error: 'fullName is required.',
        invalid_type_error: 'fullName must be a string.',
      }),
  
    role :  z.string({
        required_error: 'role is required.',
        invalid_type_error: 'role must be a string.',
      }),
    message :  z.string({
        required_error: 'message is required.',
        invalid_type_error: 'message must be a string.',
      })
    
}),
});


export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  changeUserStatusValidationSchema,
  createAccessPinCodeValidationSchema,
  sendInvitationToBeAdminValidationSchema
};
