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
import { Request, Response } from 'express';

let dailyCycleInsightService = new DailyCycleInsightsService();
let personalizeJourneyService = new PersonalizedJourneyService();

const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'qwen/qwen3-30b-a3b:free',
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  streaming: true,  // Enable streaming
});

const chatbotResponse = async (req: Request, res: Response) => {

  try {
    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    if (!req.user || !req.user.userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`,
      );
    }

    if (!userMessage) {
      console.error("No message provided in the request body.");
      return res.status(400).json({ error: "Message is required" });
    }

    // Set up headers for streaming
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const dateObj = new Date();

    const [insights, personalizedJourney, userProfileData] = await Promise.all([
      dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);

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

    const response  = await model.invoke(messages); // const response = 

    // console.log('Chatbot response:', response);
    // Stream the response back to the client
    /*
    stream.on('data', (chunk) => {
      if (chunk && chunk.text) {
        // Send chunked response as each part of the response is available
        res.write(chunk.text);
      }
    });

    stream.on('end', () => {
      // End the response once the stream is finished
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: `Something went wrong during streaming. ${error.message}` });
    });
    */

    /*
    for await (const chunk of stream) {
      res.write(chunk.content);
    }

    res.end();
    */

  sendResponse(res, {
    code: StatusCodes.OK,
    data: response.content  , /* response.content  */ 
    message: `chat bot response successfully`,
    success: true,
  });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: `Something went wrong. ${error}`});
  }
}

export const ChatBotV0Controller = {
  chatbotResponse,
};