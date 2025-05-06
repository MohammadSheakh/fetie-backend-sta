import { ChatOpenAI } from '@langchain/openai';
// import { ChatOpenAI} from 'openai'
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
  //modelName: 'openai/chatgpt-4o-latest',
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
     baseURL: 'https://openrouter.ai/api/v1',
    //baseURL: 'https://api.openai.com/v1'
  },
  streaming: true, // Enable streaming
});

const chatbotResponseV2 = async (req: Request, res: Response) => {
  try {
    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    if (!req.user || !req.user.userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`
      );
    }

    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up headers for streaming
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    let dateObj;

    // Regex to match multiple date formats
    const dateRegex =
      /(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{2,4})|(\d{1,2})\s([a-zA-Z]+)(\s(\d{4}))?/;

    const match = userMessage.match(dateRegex);

    if (match) {
      // console.log('Detected Date Match 📅:', match);

      // Handle numeric format like 6-05-2025 or 5/6/2025
      if (match[1] && match[2] && match[3]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearStr = match[3];
        const year =
          yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

        // Construct the date string as yyyy-MM-dd
        const dateString = `${year}-${month < 10 ? '0' + month : month}-${
          day < 10 ? '0' + day : day
        }`;

        console.log('dateString 📅:', dateString);
        dateObj = new Date(dateString).toISOString(); // toUTCString().
      }

      // Handle natural language dates like "5 March 2025"
      if (match[4] && match[5]) {
        const day = parseInt(match[4], 10);
        const monthName =
          match[5].charAt(0).toUpperCase() + match[5].slice(1).toLowerCase();
        const year = match[7]
          ? parseInt(match[7], 10)
          : new Date().getFullYear();

        const formattedDateString = `${day} ${monthName} ${year}`;
        const parsedDate = parse(
          formattedDateString,
          'd MMMM yyyy',
          new Date()
        );

        if (isValid(parsedDate)) {
          dateObj = parsedDate;
          console.log(
            '✅ Parsed Date (Natural Language):',
            dateObj.toLocaleString()
          );
        } else {
          console.warn('❌ Invalid natural language date');
        }
      }
    } else {
      console.log('📅 No date detected, using current date');
      dateObj = new Date();
    }

    console.log('dateObj 📢📢📢📢📢📢', dateObj);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const [insights, allInsights, personalizedJourney, userProfileData] =
      await Promise.all([
        dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
        dailyCycleInsightService.getByUserId(userId),
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
      - averageMenstrualCycleLength: ${
        personalizedJourney?.avgMenstrualCycleLength || 'N/A'
      }
      - trackOvulationBy : ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain : ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate : ${
        personalizedJourney?.expectedPeriodStartDate || 'N/A'
      }
      - predictedOvulationDate : ${
        personalizedJourney?.predictedOvulationDate || 'N/A'
      }

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

      - labTestLog : ${JSON.stringify(insights?.labTestLogId)}'
      - allInsights : ${JSON.stringify(allInsights)}'
    `;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(messages); // const response =

    sendResponse(res, {
      code: StatusCodes.OK,
      data: response.content /* response.content  */,
      message: `chat bot response successfully`,
      success: true,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: `Something went wrong. ${error}` });
  }
};

const chatbotResponseV3ClaudeStreaming = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    if (!req.user || !req.user.userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`
      );
    }

    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    let dateObj;

    // Regex to match multiple date formats
    const dateRegex =
      /(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{2,4})|(\d{1,2})\s([a-zA-Z]+)(\s(\d{4}))?/;

    const match = userMessage.match(dateRegex);

    if (match) {
      // console.log('Detected Date Match 📅:', match);

      // Handle numeric format like 6-05-2025 or 5/6/2025
      if (match[1] && match[2] && match[3]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearStr = match[3];
        const year =
          yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

        // Construct the date string as yyyy-MM-dd
        const dateString = `${year}-${month < 10 ? '0' + month : month}-${
          day < 10 ? '0' + day : day
        }`;

        console.log('dateString 📅:', dateString);
        dateObj = new Date(dateString).toISOString(); // toUTCString().
      }

      // Handle natural language dates like "5 March 2025"
      if (match[4] && match[5]) {
        const day = parseInt(match[4], 10);
        const monthName =
          match[5].charAt(0).toUpperCase() + match[5].slice(1).toLowerCase();
        const year = match[7]
          ? parseInt(match[7], 10)
          : new Date().getFullYear();

        const formattedDateString = `${day} ${monthName} ${year}`;
        const parsedDate = parse(
          formattedDateString,
          'd MMMM yyyy',
          new Date()
        );

        if (isValid(parsedDate)) {
          dateObj = parsedDate;
          console.log(
            '✅ Parsed Date (Natural Language):',
            dateObj.toLocaleString()
          );
        } else {
          console.warn('❌ Invalid natural language date');
        }
      }
    } else {
      console.log('📅 No date detected, using current date');
      dateObj = new Date();
    }

    console.log('dateObj 📢📢📢📢📢📢', dateObj);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const [insights, allInsights, personalizedJourney, userProfileData] =
      await Promise.all([
        dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
        dailyCycleInsightService.getByUserId(userId),
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
      - averageMenstrualCycleLength: ${
        personalizedJourney?.avgMenstrualCycleLength || 'N/A'
      }
      - trackOvulationBy : ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain : ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate : ${
        personalizedJourney?.expectedPeriodStartDate || 'N/A'
      }
      - predictedOvulationDate : ${
        personalizedJourney?.predictedOvulationDate || 'N/A'
      }

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

      - labTestLog : ${JSON.stringify(insights?.labTestLogId)}'
      - allInsights : ${JSON.stringify(allInsights)}'
    `;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    ///////// const response = await model.invoke(messages);

    // Initialize response string
    let responseText = '';

    // Use streaming with callbacks
    const stream = await model.stream(messages);

    // Process each chunk as it arrives
    for await (const chunk of stream) {
      if (chunk.content) {
        responseText += chunk.content;

        // Send the chunk to the client
        res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);

        // Flush the data to ensure it's sent immediately
        if (res.flush) {
          res.flush();
        }
      }
    }

    // Send end of stream marker
    res.write(
      `data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n`
    );
    res.end();

    // sendResponse(res, {
    //   code: StatusCodes.OK,
    //   data: response.content /* response.content  */,
    //   message: `chat bot response successfully`,
    //   success: true,
    // });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: `Something went wrong. ${error}` });
  }
};

const chatbotResponseV4ClaudeStreaming_socket = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req?.user.userId;
    const userMessage = req?.body?.message;

    if (!req.user || !req.user.userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`
      );
    }

    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up headers for streaming
     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache'); // no-cache
     res.setHeader('Connection', 'keep-alive');

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    let dateObj;

    // Regex to match multiple date formats
    const dateRegex =
      /(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{2,4})|(\d{1,2})\s([a-zA-Z]+)(\s(\d{4}))?/;

    const match = userMessage.match(dateRegex);

    if (match) {
      // console.log('Detected Date Match 📅:', match);

      // Handle numeric format like 6-05-2025 or 5/6/2025
      if (match[1] && match[2] && match[3]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearStr = match[3];
        const year =
          yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

        // Construct the date string as yyyy-MM-dd
        const dateString = `${year}-${month < 10 ? '0' + month : month}-${
          day < 10 ? '0' + day : day
        }`;

        console.log('dateString 📅:', dateString);
        dateObj = new Date(dateString).toISOString(); // toUTCString().
      }

      // Handle natural language dates like "5 March 2025"
      if (match[4] && match[5]) {
        const day = parseInt(match[4], 10);
        const monthName =
          match[5].charAt(0).toUpperCase() + match[5].slice(1).toLowerCase();
        const year = match[7]
          ? parseInt(match[7], 10)
          : new Date().getFullYear();

        const formattedDateString = `${day} ${monthName} ${year}`;
        const parsedDate = parse(
          formattedDateString,
          'd MMMM yyyy',
          new Date()
        );

        if (isValid(parsedDate)) {
          dateObj = parsedDate;
          console.log(
            '✅ Parsed Date (Natural Language):',
            dateObj.toLocaleString()
          );
        } else {
          console.warn('❌ Invalid natural language date');
        }
      }
    } else {
      console.log('📅 No date detected, using current date');
      dateObj = new Date();
    }

    console.log('dateObj 📢📢📢📢📢📢', dateObj);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    const [insights, allInsights, personalizedJourney, userProfileData] =
      await Promise.all([
        dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
        dailyCycleInsightService.getByUserId(userId),
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
      - averageMenstrualCycleLength: ${
        personalizedJourney?.avgMenstrualCycleLength || 'N/A'
      }
      - trackOvulationBy : ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain : ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate : ${
        personalizedJourney?.expectedPeriodStartDate || 'N/A'
      }
      - predictedOvulationDate : ${
        personalizedJourney?.predictedOvulationDate || 'N/A'
      }

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

      - labTestLog : ${JSON.stringify(insights?.labTestLogId)}'
      - allInsights : ${JSON.stringify(allInsights)}'
    `;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    ///////// const response = await model.invoke(messages);

    // Initialize response string
    let responseText = '';

    // Use streaming with callbacks
    const stream = await model.stream(messages);

    // Process each chunk as it arrives
    for await (const chunk of stream) {
      if (chunk.content) {
        responseText += chunk.content;

        // Send the chunk to the client
        res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);

        // Flush the data to ensure it's sent immediately
        if (res.flush) {
          res.flush();
        }
      }
    }

    // Send end of stream marker
    res.write(
      `data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n`
    );
    res.end();

    // sendResponse(res, {
    //   code: StatusCodes.OK,
    //   data: response.content /* response.content  */,
    //   message: `chat bot response successfully`,
    //   success: true,
    // });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: `Something went wrong. ${error}` });
  }
};

export const ChatBotV0Controller = {
  chatbotResponseV2,
  chatbotResponseV3ClaudeStreaming,
  chatbotResponseV4ClaudeStreaming_socket,
};
