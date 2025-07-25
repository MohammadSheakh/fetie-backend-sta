import { GenericService } from '../../__Generic/generic.services';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { PersonalizeJourney } from './personalizeJourney.model';
import { IPersonalizeJourney } from './personalizeJourney.interface';
import { IPregnancyHistory } from '../pregnancyHistory/pregnancyHistory.interface';
import {
  IMedicalAndLifeStyle,
} from '../medicalAndLifeStyle/medicalAndLifeStyle.interface';
import { User } from '../../user/user.model';
import { PregnancyHistory } from '../pregnancyHistory/pregnancyHistory.model';
import { MedicalAndLifeStyle } from '../medicalAndLifeStyle/medicalAndLifeStyle.model';

export class PersonalizedJourneyService extends GenericService<
  typeof PersonalizeJourney,
  IPersonalizeJourney
> {
  constructor() {
    super(PersonalizeJourney);
  }

  async saveOptionalInformation(data: any, userId: string) {
    /*******************
     * 
     * ekhane data gula ke group group korte hobe ..
     * and shegula ke alada alada collection e save korte hobe ..
     *
     ******************/

    const {
      trackOvulationBy,
      doYouHavePain,
      expectedPeriodStartDate,
      predictedOvulationDate,
    }: IPersonalizeJourney = data;
    const {
      haveYouEverBeenPregnant,
      howManyTimes,
      outcomes,
      wasItWithYourCurrentPartner,
    }: IPregnancyHistory = data;
    const {
      medicalConditionsOrSergeriesDetails,
      medicationAndSuplimentsDetails,
      anyHistoryOfStdOrPelvicInfection,
      doYouSmokeDrink,
      anyFamilyHealthConditionLegacy,
      wantToSharePartnersHeathInfo,
    }: IMedicalAndLifeStyle = data;

    const personalizedJourneyData = {
      trackOvulationBy,
      doYouHavePain,
      expectedPeriodStartDate,
      predictedOvulationDate,
    };
    const pregnancyHistoryData = {
      haveYouEverBeenPregnant,
      howManyTimes,
      outcomes,
      wasItWithYourCurrentPartner,
    };
    const medicalAndLifeStyleData = {
      medicalConditionsOrSergeriesDetails,
      medicationAndSuplimentsDetails,
      anyHistoryOfStdOrPelvicInfection,
      doYouSmokeDrink,
      anyFamilyHealthConditionLegacy,
      wantToSharePartnersHeathInfo,
    };

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    let existingJourney;
    if (user?.personalize_Journey_Id) {
      existingJourney = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );
    }

    // Check if the required fields for primary collection are present
    if (
      trackOvulationBy ||
      doYouHavePain.trim() !== '' ||
      expectedPeriodStartDate ||
      predictedOvulationDate
    ) {
      // check if ther users personalize journey is already created or not
      // if yes then update the data

      if (existingJourney) {
        // Update the existing optional information
        await PersonalizeJourney.findByIdAndUpdate(
          existingJourney._id,
          personalizedJourneyData,
          { new: true }
        );
        // console.log('Data updated in primary collection.');
      } else {
        // Create a new personalized journey
        const personalizedJourney = new PersonalizeJourney(
          personalizedJourneyData
        );
        await personalizedJourney.save();
        user.personalize_Journey_Id = personalizedJourney._id;
        await user.save();
      }
    }

    // Check if the required fields for pregnancy history collection are present
    if (
      haveYouEverBeenPregnant ||
      howManyTimes ||
      outcomes ||
      wasItWithYourCurrentPartner
    ) {
      // Save to pregnancy history collection

      if (existingJourney?.pregnancy_History_Id) {
        // update the existing pregnancy history
        await PregnancyHistory.findByIdAndUpdate(
          existingJourney.pregnancy_History_Id,
          pregnancyHistoryData,
          { new: true }
        );
      } else {
        // create pregnancy history
        const pregHistory = await PregnancyHistory.create(pregnancyHistoryData);
        if (pregHistory) {
          
          await PersonalizeJourney.findByIdAndUpdate(
            existingJourney?._id,
            { pregnancy_History_Id: pregHistory._id },
            { new: true }
          );
        }
      }
    }

    if (
      medicalConditionsOrSergeriesDetails ||
      medicationAndSuplimentsDetails ||
      anyHistoryOfStdOrPelvicInfection ||
      doYouSmokeDrink ||
      anyFamilyHealthConditionLegacy ||
      wantToSharePartnersHeathInfo
    ) {
      // data save to medical and life style collection
      if (existingJourney?.medical_And_LifeStyle_Id) {
        // update the existing medical and life style
        await MedicalAndLifeStyle.findByIdAndUpdate(
          existingJourney.medical_And_LifeStyle_Id,
          medicalAndLifeStyleData,
          { new: true }
        );
      } else {
        // create medical and life style
        const medicalAndLifeStyle = await MedicalAndLifeStyle.create(
          medicalAndLifeStyleData
        );
        if (medicalAndLifeStyle) {
          await PersonalizeJourney.findByIdAndUpdate(
            existingJourney?._id,
            { medical_And_LifeStyle_Id: medicalAndLifeStyle._id },
            { new: true }
          );
        }
      }
    }

    return {
      personalizedJourneyData,
      pregnancyHistoryData,
      medicalAndLifeStyleData,
    };
  }

  async getByUserId(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Database error while searching user'
      );
    }

    const personalizedJourney = await PersonalizeJourney.findById(
      user?.personalize_Journey_Id
    ).select(
      'periodStartDate periodLength periodEndDate avgMenstrualCycleLength expectedPeriodStartDate predictedOvulationDate'
    );

    if (!personalizedJourney) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Personalized Journey not found'
      );
    }

    return personalizedJourney;
  }

  // 🔥 logic ta check dite hobe .. 
  async addOrUpdatePeriodLengthService(userId : string, periodStartDate : Date, periodLength : number){
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    let existingJourney;
    if (user?.personalize_Journey_Id) {
      existingJourney = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );
    }
    if (!existingJourney) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Personalized Journey not found'
      );
    }

    let data; 


    // If both periodLength and periodStartDate are missing, update them
    if (!existingJourney?.periodLength || !existingJourney?.periodStartDate) {
      data = await PersonalizeJourney.findByIdAndUpdate(
          existingJourney._id,
          { periodLength, periodStartDate },
          { new: true }
      );
  } else if (existingJourney?.periodLength !== periodLength || existingJourney?.periodStartDate !== periodStartDate) {
      // If period length or start date is different, update
      data = await PersonalizeJourney.findByIdAndUpdate(
          existingJourney._id,
          { periodLength, periodStartDate },
          { new: true }
      );
  } else {
      // Optional: If the values are the same, no need to update
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Period length and/or start date already match the existing values');
  }
  return data;
  }

  async addOrUpdateAvgMenstrualCycleLengthService(userId : string, avgMenstrualCycleLength : number){
    const user = await
      User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    let existingJourney;
    if (user?.personalize_Journey_Id) {
      existingJourney = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );
    }
    if (!existingJourney) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Personalized Journey not found'
      );
    }
    let data;
    // if avgMenstrualCycleLength is not present then update it
    if (!existingJourney?.avgMenstrualCycleLength) {
      data = await PersonalizeJourney.findByIdAndUpdate(
        existingJourney._id,
        { avgMenstrualCycleLength },
        { new: true }
      );
    }
    // if avgMenstrualCycleLength is present then check if it is different or not
    else if (existingJourney?.avgMenstrualCycleLength !== avgMenstrualCycleLength) {
      data = await PersonalizeJourney.findByIdAndUpdate(
        existingJourney._id,
        { avgMenstrualCycleLength },
        { new: true }
      );
    } else {
      // Optional: If the values are the same, no need to update
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Avg menstrual cycle length already match the existing values');
    }
    return data;  
  } 
}
