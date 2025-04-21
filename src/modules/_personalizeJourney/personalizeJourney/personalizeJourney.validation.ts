import { z } from 'zod';
import { TDescribeFlow, THeightUnit, TWeightUnit } from './personalizeJourney.constant';


export const createPersonalizeJourneyValidationSchema = z.object({
  body: z.object({
    dateOfBirth: z  
    .string({
        required_error: 'dateOfBirth is required, dateOfBirth must be a date.',
        invalid_type_error: 'dateOfBirth must be a date.',
      })
      .transform((str) => new Date(str)) // Transform the string into a Date object
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid date format.',
      }),
    age: z
      .number({
        required_error: 'age is not required it will be auto calculated based on date.',
        invalid_type_error: 'age must be a number.',
      }).optional()
    ,
    height: z
      .number({
        required_error: 'height is required.',
        invalid_type_error: 'height must be a number.',
      })
      .min(1, 'height must be at least greater than 1.'),
      
    heightUnit: z
      .string({
        required_error: 'heightUnit is required.',
        invalid_type_error: 'heightUnit must be a string.',
      })
      .refine(heightUnit => Object.keys(THeightUnit).includes(heightUnit as keyof typeof THeightUnit), {
        message: `Role must be one of the following: ${Object.keys(THeightUnit).join(', ')}`,
      }),
    weight: z
      .number({
        required_error: 'weight is required.',
        invalid_type_error: 'weight must be a number.',
      })
      .min(1, 'weight must be at least greater than 1.'),
    weightUnit: z
      .string({
        required_error: 'weightUnit is required.',
        invalid_type_error: 'weightUnit must be a string.',
      })
      .refine(weightUnit => Object.keys(TWeightUnit).includes(weightUnit as keyof typeof TWeightUnit), {
        message: `Role must be one of the following: ${Object.keys(TWeightUnit).join(', ')}`,
      }),
    tryingToConceive: z.boolean({
      required_error: 'tryingToConceive is required.',
      invalid_type_error: 'tryingToConceive must be a boolean.',
    }),
    areCyclesRegular: z.boolean({
      required_error: 'areCyclesRegular is required.',
      invalid_type_error: 'areCyclesRegular must be a boolean.',    
    }),

    describeFlow: z
      .string({
        required_error: 'describeFlow is required.',
        invalid_type_error: 'describeFlow must be a string.',
      })
      .refine(describeFlow => Object.keys(TDescribeFlow).includes(describeFlow as keyof typeof TDescribeFlow), {
        message: `Role must be one of the following: ${Object.keys(TDescribeFlow).join(', ')}`,
      }),


    periodStartDate :
    //  z.date({
    //   required_error: 'periodStartDate is required.',
    //   invalid_type_error: 'periodStartDate must be a date.',
    // }),

    z.string({
      required_error: 'periodStartDate is required, dateOfBirth must be a date.',
      invalid_type_error: 'periodStartDate must be a date.',
    })
    .transform((str) => new Date(str)) // Transform the string into a Date object
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format.',
    }),

    periodLength : z.number({
      required_error: 'periodLength is required.',
      invalid_type_error: 'periodLength must be a number.',
    }).min(0, 'periodLength must be greater than 0.'),
    // periodEndDate AutoCalculate hobe .. 

    avgMenstrualCycleLength : z.number({
      required_error: 'avgMenstrualCycleLength is required.',
      invalid_type_error: 'avgMenstrualCycleLength must be a number.',
    }).min(0, 'avgMenstrualCycleLength must be greater than 0.'),
    }),
});


