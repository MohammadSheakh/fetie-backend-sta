import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { DailyCycleInsightsService } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service';
import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
import { UserService } from '../user/user.service';
import sendResponse from '../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

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
    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    const dateObj = new Date();

    // const personalizedJourney = await personalizeJourneyService.getByUserId(
    //   userId
    // );
    
    const [insights, personalizedJourney, userProfileData] = await Promise.all([
      dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);


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

- labTestLog : ${JSON.stringify(insights?.labTestLogId)}  || 'N/A'}
`;
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(messages);

  
    sendResponse(res, {
      code: StatusCodes.OK,
      data: response.content,
      message: `chat bot response successfully`,
      success: true,
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

export const ChatBotController = {
  chatbotResponse,
};

/*
// This function receives userId and user message
const chatbotResponse = async (req, res) => {
  const userId = req.user.userId;
  const userMessage = req.body.message;

  const insights = await getDailyInsights(userId);
  const labs = await getLabResults(userId);
  const ovulationDate = await getNextOvulationDate(userId);

  const prompt = `You are a friendly health assistant. Based on user’s current cycle, lab tests, and daily logs, help them.

User said: ${userMessage}

Info you have:
- Next ovulation: ${ovulationDate}
- Latest LH: ${labs?.LH}
- Latest Progesterone: ${labs?.progesterone}
- Daily Mood: ${insights?.mood}
- Menstrual Flow: ${insights?.menstrualFlow}
- Phase: ${insights?.phase}
- Symptoms: ${insights?.symptoms}

Respond kindly.`;

  const chain = RunnableSequence.from([formatMessages, model]);
  const response = await chain.invoke({ input: userMessage, context: prompt });

  res.json({ message: response });
};

export const ChatBotController = {
  chatbotResponse,
  // add more functions as needed
};
*/
