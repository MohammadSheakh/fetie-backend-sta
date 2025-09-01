import { z } from 'zod';
import { TActivity, TCervicalMucus, TFertilityLevel, TMenstrualFlow, TMood, TPhase, TSymptoms } from './dailyCycleInsights.constant';

export const createDailyCycleInsightsValidationSchema = z.object({
  body: z.object({
    
    menstrualFlow: z
      .string({
        required_error: 'menstrualFlow is not required.',
        invalid_type_error: 'menstrualFlow must be a string.',
      })
      .refine(menstrualFlow => Object.keys(TMenstrualFlow).includes(menstrualFlow as keyof typeof TMenstrualFlow), {
        message: `menstrualFlow must be one of the following: ${Object.keys(TMenstrualFlow).join(', ')}`,
      }),
    mood: z
    .string({
      required_error: 'mood is not required.',
      invalid_type_error: 'mood must be a string.',
    })
    .refine(mood => Object.keys(TMood).includes(mood as keyof typeof TMood), {
      message: `mood must be one of the following: ${Object.keys(TMood).join(', ')}`,
    }),

    activity: z
    .string({
      required_error: 'activity is not required.',
      invalid_type_error: 'activity must be a string.',
    })
    .refine(activity => Object.keys(TActivity).includes(activity as keyof typeof TActivity), {
      message: `activity must be one of the following: ${Object.keys(TActivity).join(', ')}`,
    }),

    symptoms: z.array(z.string({
          required_error: 'symptoms is required.',
          invalid_type_error: 'symptoms must be a string.',
        }).refine(symptoms => Object.keys(TSymptoms).includes(symptoms as keyof typeof TSymptoms), {
          message: `symptoms must be one of the following: ${Object.keys(TSymptoms).join(', ')}`,
        })),

    phase: z
    .string({
      required_error: 'phase is not required.',
      invalid_type_error: 'phase must be a string.',
    }).optional()
    // .refine(phase => Object.keys(TPhase).includes(phase as keyof typeof TPhase), {
    //   message: `phase must be one of the following: ${Object.keys(TPhase).join(', ')}`,
    // })
    ,

    fertilityLevel: z
    .string({
      required_error: 'fertilityLevel is not required.',
      invalid_type_error: 'fertilityLevel must be a string.',
    })
    .refine(fertilityLevel => Object.keys(TFertilityLevel).includes(fertilityLevel as keyof typeof TFertilityLevel), {
      message: `fertilityLevel must be one of the following: ${Object.keys(TFertilityLevel).join(', ')}`,
    }).optional(),


    cycleDay : z.number({
      required_error: 'cycleDay is not required.',
      invalid_type_error: 'cycleDay must be a number.',
    }).min(0, 'cycleDay must be at least greater than 0.').optional(),

    cervicalMucus: z
    .string({
      required_error: 'cervicalMucus is not required.',
      invalid_type_error: 'cervicalMucus must be a string.',
    })
    .refine(cervicalMucus => Object.keys(TCervicalMucus).includes(cervicalMucus as keyof typeof TCervicalMucus), {
      message: `cervicalMucus must be one of the following: ${Object.keys(TCervicalMucus).join(', ')}`,
    }),

    date : z.string({
      required_error: 'date is required',
      invalid_type_error: 'date must be a date.',
    })
    .transform((str) => new Date(str)) // Transform the string into a Date object
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format.',
    })
  })
});