
import { GenericService } from "../../__Generic/generic.services";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { PersonalizeJourney } from "./personalizeJourney.model";
import { IPersonalizeJourney } from "./personalizeJourney.interface";
import { IPregnancyHistory } from "../pregnancyHistory/pregnancyHistory.interface";
import { IMedicalAndLifeStyle, IMedicalAndLifeStyleModel } from "../medicalAndLifeStyle/medicalAndLifeStyle.interface";
import { User } from "../../user/user.model";

export class PersonalizedJourneyService extends GenericService<typeof PersonalizeJourney , IPersonalizeJourney>{
    constructor(){
        super(PersonalizeJourney)
    }

    async saveOptionalInformation(data: any, userId: string) {
        /**
         * * ekhane data gula ke group group korte hobe .. 
         * and shegula ke alada alada collection e save korte hobe .. 
         * 
         */

        const {trackOvulationBy, doYouHavePain, expectedPeriodStartDate, predictedOvulationDate}: IPersonalizeJourney = data ;
        const {haveYouEverBeenPregnant, howManyTimes, outcomes, wasItWithYourCurrentPartner} : IPregnancyHistory = data;
        const {medicalConditionsOrSergeriesDetails , medicationAndSuplimentsDetails, anyHistoryOfStdOrPelvicInfection , doYouSmokeDrink, anyFamilyHealthConditionLegacy, wantToSharePartnersHeathInfo } : IMedicalAndLifeStyle = data;

        // check if ther users personalize journey is already created or not
        const user = await User.findById(userId);

       // Check if the required fields for primary collection are present
        if (
            trackOvulationBy &&
            doYouHavePain.trim() !== "" &&
            expectedPeriodStartDate  &&
            predictedOvulationDate 
        ) {
            // Save to primary collection

            const result = await PersonalizeJourney.findByIdAndUpdate(userId, payload, { new: true });
            
            console.log("Data saved to primary collection.");
        }

        // Check if the required fields for pregnancy history collection are present
        if (
            haveYouEverBeenPregnant &&
            howManyTimes &&
            outcomes &&
            wasItWithYourCurrentPartner ) {
            // Save to pregnancy history collection
            
            console.log("Data saved to pregnancy history collection.");
        }

        if(
            medicalConditionsOrSergeriesDetails &&
            medicationAndSuplimentsDetails && 
            anyHistoryOfStdOrPelvicInfection && doYouSmokeDrink &&
            anyFamilyHealthConditionLegacy && wantToSharePartnersHeathInfo
        ){
            // data save to medical and life style collection
        }
      


        // const { userId, ...optionalData } = data;

        // // Check if the user already has optional information
        // const existingJourney = await this.model.findOne({ userId });

        // if (existingJourney) {
        //     // Update the existing optional information
        //     return await this.model.findByIdAndUpdate(existingJourney._id, optional)
        // }

    }
}