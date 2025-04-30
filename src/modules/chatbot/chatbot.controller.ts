import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { DailyCycleInsightsService } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service';
import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
import { UserService } from '../user/user.service';
import sendResponse from '../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { isValid, parse } from 'date-fns';
import ApiError from '../../errors/ApiError';

// const model = new ChatOpenAI({ temperature: 0.6, modelName: 'gpt-4' });

const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'qwen/qwen3-30b-a3b:free',
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
});

let dailyCycleInsightService = new DailyCycleInsightsService();
let personalizeJourneyService = new PersonalizedJourneyService();



// https://openrouter.ai/qwen/qwen3-30b-a3b:free/activity

const chatbotResponse = async (req: Request, res: Response) => {
  try {

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`,
      );
    }

    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    
    if (!userMessage) {
      console.error("No message provided in the request body.");
      return res.status(400).json({ error: "Message is required" });
    }

    // const dateObj = new Date();

    let dateObj = new Date(); // Default fallback

    // Regex to match multiple date formats
    const dateRegex =
      /(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{2,4})|(\d{1,2})\s([a-zA-Z]+)(\s(\d{4}))?/;

    const match = userMessage.match(dateRegex);

    if (match) {
      console.log('Detected Date Match 📅:', match);

      // Handle numeric format like 29-4-2025 or 5/4/2025
      if (match[1] && match[2] && match[3]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearStr = match[3];
        const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

        // Detect whether it's DD-MM-YYYY or MM-DD-YYYY
        let parsedDate;

        // If day > 12, must be DD-MM-YYYY
        if (day > 12) {
          parsedDate = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date());
        } else {
          // Try both formats for ambiguous cases
          const format1 = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date());
          const format2 = parse(`${year}-${day}-${month}`, 'yyyy-dd-MM', new Date());

          parsedDate = isValid(format1) ? format1 : isValid(format2) ? format2 : null;
        }

        if (parsedDate && isValid(parsedDate)) {
          dateObj = parsedDate;
          console.log('✅ Parsed Date (DD-MM-YYYY/MM-DD-YYYY):', dateObj.toLocaleString());
        } else {
          console.warn('❌ Invalid numeric date after parsing');
        }
      }

      // Handle natural language dates like "5 March 2025"
      if (match[4] && match[5]) {
        const day = parseInt(match[4], 10);
        const monthName = match[5].charAt(0).toUpperCase() + match[5].slice(1).toLowerCase();
        const year = match[7] ? parseInt(match[7], 10) : new Date().getFullYear();

        const formattedDateString = `${day} ${monthName} ${year}`;
        const parsedDate = parse(formattedDateString, 'd MMMM yyyy', new Date());

        if (isValid(parsedDate)) {
          dateObj = parsedDate;
          console.log('✅ Parsed Date (Natural Language):', dateObj.toLocaleString());
        } else {
          console.warn('❌ Invalid natural language date');
        }
      }
    } else {
      console.log('📅 No date detected, using current date');
    }

    // Final check
    if (!isValid(dateObj)) {
      console.warn('⚠️ Date is invalid, falling back to current date.');
      dateObj = new Date();
    }

    console.log('Final dateObj used:', dateObj.toLocaleString());

    // console.log('📆 Extracted dateObj (local time):', dateObj.toLocaleString());

    const [insights, personalizedJourney, userProfileData] = await Promise.all([
      dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);

    // const personalizedJourney = await personalizeJourneyService.getByUserId(
    //   userId
    // );

    console.log ('insights 🧪', insights);
    console.log ('personalizedJourney 🧪', personalizedJourney);
    console.log ('userProfileData 🧪', userProfileData);

    // const labs = await getLabResults(userId);
    // const ovulationDate = await getNextOvulationDate(userId);

    // Construct system prompt with dynamic context
    const systemPrompt = `You are a friendly reproductive health assistant.
Based on user's cycle, lab tests, and daily logs, provide helpful responses.
Be empathetic, short, and encouraging.

Data available: 
----- in Personalized Journey Collection
- dateOfBirth: ${personalizedJourney?.dateOfBirth || 'N/A'}
- age: ${personalizedJourney?.age || 'N/A'}
- height: ${personalizedJourney?.height || 'N/A'}
- heightUnit: ${personalizedJourney?.heightUnit || 'N/A'}
- weight: ${personalizedJourney?.weight || 'N/A'}
- weightUnit: ${personalizedJourney?.weightUnit || 'N/A'}
- tryingToConceive: ${personalizedJourney?.tryingToConceive || 'N/A'}
- areCyclesRegular: ${personalizedJourney?.areCyclesRegular || 'N/A'}
- describeFlow: ${personalizedJourney?.describeFlow || 'N/A'}
- periodStartData: ${personalizedJourney?.periodStartDate || 'N/A'}
- periodLength: ${personalizedJourney?.periodLength || 'N/A'}
- periodEndDate: ${personalizedJourney?.periodEndDate || 'N/A'}
- averageMenstrualCycleLength: ${personalizedJourney?.avgMenstrualCycleLength || 'N/A'}
- trackOvulationBy : ${personalizedJourney?.trackOvulationBy || 'N/A'}
- doYouHavePain : ${personalizedJourney?.doYouHavePain || 'N/A'}
- expectedNextPeriodStartDate : ${personalizedJourney?.expectedPeriodStartDate || 'N/A'}
- predictedOvulationDate : ${personalizedJourney?.predictedOvulationDate || 'N/A'}

----- in Daily cycle Insights Collection
- menstrualFlow : ${insights?.menstrualFlow || 'N/A'}
- mood : ${insights?.mood || 'N/A'}
- activity : ${insights?.activity || 'N/A'}
- symptoms : ${insights?.symptoms || 'N/A'}
- phase : ${insights?.phase || 'N/A'}
- fertilityLevel : ${insights?.fertilityLevel || 'N/A'}
- cycleDay : ${insights?.cycleDay || 'N/A'}
- cervicalMucus : ${insights?.cervicalMucus || 'N/A'}

----- User Data 
- name : ${userProfileData?.name || 'N/A'}
- email : ${userProfileData?.email || 'N/A'}
- role : ${userProfileData?.role || 'N/A'}
- subscriptionType : ${userProfileData?.subscriptionType || 'N/A'}
- phoneNumber : ${userProfileData?.phoneNumber || 'N/A'}
- lastPasswordChangeDate : ${userProfileData?.lastPasswordChange || 'N/A'}

- labTestLog : ${JSON.stringify(insights?.labTestLogId)}'}
`;
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    // const messages = [
    //   { role: "system", content: systemPrompt },
    //   { role: "user", content: userMessage },
    // ];

    const response = await model.invoke(messages);


    console.log('Model Response: 🧪🧪🧪🧪🧪', response.content); // confirm output

  
    sendResponse(res, {
      code: StatusCodes.OK,
      data: response.content  , /* {insights, dateObj }*/ 
      
      message: `chat bot response successfully`,
      success: true,
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: `Something went wrong. ${error}`});
  }
};

export const ChatBotController = {
  chatbotResponse,
};
