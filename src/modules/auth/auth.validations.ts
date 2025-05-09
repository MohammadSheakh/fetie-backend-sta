import { z } from 'zod';

const googleLoginValidationSchema = z.object({
  googleId: z.string({
    required_error: 'Google ID is required.',
    invalid_type_error: 'Google ID must be a string.',
  }),
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .email('Invalid email address.'),
  googleAccessToken: z.string({
    required_error: 'Google Access Token is required.',
    invalid_type_error: 'Google Access Token must be a string.',
  }),
});

const appleLoginValidationSchema = z.object({
  appleId: z.string({
    required_error: 'Apple ID is required.',
    invalid_type_error: 'Apple ID must be a string.',
  }),
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .email('Invalid email address.'),
  appleAccessToken: z.string({
    required_error: 'Apple Access Token is required.',
    invalid_type_error: 'Apple Access Token must be a string.',
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
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

    fcmToken: z.string({
      required_error: 'Fcm token is required.',
      invalid_type_error: 'Fcm token must be a string.',
    }).optional(),
  }),
});

const verifyEmailValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required.',
        invalid_type_error: 'Email must be a string.',
      })
      .email('Invalid email address.'),
    otp: z
      .string({
        required_error: 'One time code is required.',
        invalid_type_error: 'One time code must be a string.',
      })
      .min(6, 'One time code must be at least 6 characters long.'),
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required.',
        invalid_type_error: 'Email must be a string.',
      })
      .email('Invalid email address.'),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
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
    otp: z
      .string({
        required_error: 'One time code is required.',
        invalid_type_error: 'One time code must be a string.',
      })
      .min(6, 'One time code must be at least 6 characters long.'),
  }),
});

const resendOtpValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required.',
        invalid_type_error: 'Email must be a string.',
      })
      .email('Invalid email address.'),
    })
  })

const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'Old password is required.',
        invalid_type_error: 'Old password must be a string.',
      })
      .min(8, 'Old password must be at least 8 characters long.'),
    newPassword: z
      .string({
        required_error: 'New password is required.',
        invalid_type_error: 'New password must be a string.',
      })
      .min(8, 'New password must be at least 8 characters long.'),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  verifyEmailValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  changePasswordValidationSchema,
  googleLoginValidationSchema,
  appleLoginValidationSchema,
  resendOtpValidationSchema
};
