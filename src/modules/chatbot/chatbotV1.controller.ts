// import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { DailyCycleInsightsService } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service';
import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
import { UserService } from '../user/user.service';
import sendResponse from '../../shared/sendResponse';
import { differenceInDays } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import { isValid, parse } from 'date-fns';
import ApiError from '../../errors/ApiError';
import { Request, Response } from 'express';
import { ChatBotService } from './chatbotV1.service';
import { IMessage } from '../_chatting/message/message.interface';
import { MessagerService } from '../_chatting/message/message.service';
import { RoleType } from '../_chatting/conversationParticipents/conversationParticipents.constant';
import mongoose from 'mongoose';
import { IDailyCycleInsights } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.interface';
import { IPersonalizeJourney } from '../_personalizeJourney/personalizeJourney/personalizeJourney.interface';
import { IUser } from '../user/user.interface';
import { Message } from '../_chatting/message/message.model';
import { Conversation } from '../_chatting/conversation/conversation.model';
import { json } from 'body-parser';
import { FertieService } from '../fertie/fertie.service';

let dailyCycleInsightService = new DailyCycleInsightsService();
let personalizeJourneyService = new PersonalizedJourneyService();

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, //OPENAI_API_KEY // OPENROUTER_API_KEY
  // baseURL: 'https://openrouter.ai/api/v1',
  baseURL: 'https://api.openai.com/v1'
});

/*
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
*/

const chatbotResponseLongPollingWithHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req?.user?.userId;
    const userMessage = req?.body?.message;
    const conversationId = req?.body?.conversationId;
    if (!conversationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `conversationId must be provided.`
      );
    }
    if (!userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not authenticated. Please log in.`
      );
    }
    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }
    let messageService = new MessagerService();

    /**
     *
     * save message in the database ..
     */

    const saveMessageToDbRes: IMessage | null = await messageService.create({
      text: userMessage,
      senderId: req.user.userId,
      conversationId: conversationId,
      senderRole:
        req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
    });

    // also update the last message of the conversation 
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessageSenderRole: RoleType.user},
      { new: true }
    );

    /**
     *
     * get all messages by conversationId
     */

    const previousMessageHistory: IMessage[] | null =
      await Message.find({
        conversationId
      }).populate("text senderRole conversationId"); // conversationId

    // console.log("previousMessageHistory 🟢🟢🟢", previousMessageHistory);


    // Set up headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let systemPrompt = await ChatBotService.dateParse(userMessage, userId);

     // Convert previous messages to the format expected by the API
    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (previousMessageHistory && previousMessageHistory.length > 0) {
      // We may want to limit the number of messages to avoid token limits
      const maxHistoryMessages = 300; // Adjust based on your needs
      const recentMessages = previousMessageHistory.slice(-maxHistoryMessages);

      // console.log("recentMessages 🟢🟢🟢", recentMessages);
      
      recentMessages.forEach(msg => {
        const role = msg.senderRole === RoleType.user ? 'user' : 'assistant';
        formattedMessages.push({
          role: role,
          content: msg.text.toString(),
        });
      });
    }


    // Initialize response string
    let responseText = '';

    // Retry logic for API rate limits
    const maxRetries = 3;
    let retries = 0;
    let delay = 1000; // Start with 1 second delay
    let stream;

    // console.log("formattedMessages 🟢🟢🟢", formattedMessages);

    while (retries <= maxRetries) {
      try {
        stream = await model.chat.completions.create({
          model: 'gpt-4o', // GPT-4o // qwen/qwen3-30b-a3b:free <- is give wrong result   // gpt-3.5-turbo <- give perfect result
          messages: formattedMessages,
          /*
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          */
          temperature: 0.7,
          stream: true,
        });

        // If we get here, the request was successful
        break;
      } catch (error) {
        // Check if it's a rate limit error (429)
        if (error.status === 429) {
          if (
            error.message &&
            (error.message.includes('quota') ||
              error.message.includes('billing'))
          ) {
            // This is a quota/billing issue - try fallback if we haven't already
            if (retries === 0) {
              console.log('Quota or billing issue. Trying fallback model...');
              try {
                // Try a different model as fallback
                stream = await model.chat.completions.create({
                  model: 'gpt-3.5-turbo', // Using the same model as a placeholder, replace with actual fallback
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                  ],
                  temperature: 0.7,
                  stream: true,
                });
                break; // If fallback succeeds, exit the retry loop
              } catch (fallbackError) {
                console.error('Fallback model failed:', fallbackError);
                // Continue with retries
              }
            } else {
              console.log(
                'Quota or billing issue. No more fallbacks available.'
              );
              throw error; // Give up after fallback attempts
            }
          }

          // Regular rate limit - apply exponential backoff
          retries++;
          if (retries > maxRetries) {
            // Send error message to client before throwing
            res.write(
              `data: ${JSON.stringify({
                error: 'Rate limit exceeded. Please try again later.',
              })}\n\n`
            );
            res.end();
            throw error; // Give up after max retries
          }

          console.log(
            `Rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));

          // Exponential backoff with jitter
          delay = delay * 2 * (0.5 + Math.random()); // Multiply by random factor between 1 and 1.5
        } else {
          // Not a rate limit error
          console.error('OpenAI API error:', error);
          res.write(
            `data: ${JSON.stringify({
              error: 'An error occurred while processing your request.',
            })}\n\n`
          );
          res.end();
          return; // Exit the function
        }
      }
    }

    if (!stream) {
      res.write(
        `data: ${JSON.stringify({
          error: 'Failed to generate a response. Please try again.',
        })}\n\n`
      );
      res.end();
      return;
    }

    // Process each chunk as it arrives
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          responseText += content;

          // Send the chunk to the client
          res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);

          // Flush the data to ensure it's sent immediately
          if (res.flush) {
            res.flush();
          }
        }
      }

      // Send end of stream marker
      // res.write(`data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n`);

      /**
       *
       * save bots response in the database ..
       */

      const saveMessageToDbRes: IMessage | null = await messageService.create({
        text: responseText,
        senderId: new mongoose.Types.ObjectId('68206aa9e791351fc9fdbcde'),
        conversationId: conversationId,
        senderRole: RoleType.bot,
      });

      // also update the last message of the conversation 
      await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageSenderRole: RoleType.bot},
        { new: true }
      );

      res.end(); // 🟢🟢🟢 end korte hobe
    } catch (streamError) {
      console.error('Error processing stream:', streamError);
      res.write(
        `data: ${JSON.stringify({
          error: 'Stream processing error. Please try again.',
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    // Make sure we haven't already started a response
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: `Something went wrong. ${error.message || error}` });
    } else {
      res.write(
        `data: ${JSON.stringify({
          error: `Something went wrong. ${error.message || error}`,
        })}\n\n`
      );
      res.end();
    }

    //res.end(); // 🟢🟢🟢 remove korte hobe
  }
};


// TODO : // 🤖🤖🤖 client er kotha moto change korte hobe ... 

const getCycleInsightWithStreamTrue = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  const currentDate = new Date();
  
  const personalizedJourneyService = new PersonalizedJourneyService();

  // const personalizedJourney = await personalizedJourneyService.getByUserId(
  //     userId
  //   );

  // Fetch user data
  const [/*insights, allInsights,*/ personalizedJourney, userProfileData] 
  : [IPersonalizeJourney, any]
  = await Promise.all([
    /*
    // 🤖🤖🤖 client bad dise 
    dailyCycleInsightService.getByDateAndUserId(new Date(), userId),
    dailyCycleInsightService.getByUserId(userId),
    */
    personalizeJourneyService.getByUserId(userId),
    UserService.getMyProfile(userId),
  ]);

  
  // if(insights.whatToKeepInMindInThisCycle && insights.suggestion && insights.patternFertieNoticed && insights.currentCycleInfo) {
  //   sendResponse(res, {
  //       code: StatusCodes.OK,
  //       data: {
  //         whatToKeepInMindInThisCycle: insights.whatToKeepInMindInThisCycle,
  //         suggestion: insights.suggestion,
  //         patternFertieNoticed: insights.patternFertieNoticed,
  //         currentCycleInfo: insights.currentCycleInfo,
  //       },
  //       message: `not created successfully`,
  //       success: true,
  //     });
  // }


  // first we need to get the users current months all information .. 
      // like ⚡predictedPeriodStart ⚡ predictedPeriodEnd
      // ⚡ predictedOvulationDate ⚡ fertileWindow
  
      let data:any = await new FertieService().predictAllDates(req.user.userId);
  
      //  const [year, month] = req.body.date.split('-');
       const [year, month] = new Date().toISOString().split('T')[0].split('-');
      const targetYearMonth = `${year}-${month}`;
  
      // Find the month object that matches the target year-month
      const monthData = data.find(item => item.month === targetYearMonth);
  
      if (!monthData) {
        console.error(`No data found for month: ${targetYearMonth}`);
        return;
      }
  
      // Extract period start date for the found month
      const periodEvent : {
        predictedPeriodStart: Date;
        predictedPeriodEnd: Date;
        predictedOvulationDate: Date;
        fertileWindow: [Date, Date];
      } = monthData.events.find(event => event.predictedPeriodStart);
    
      // console.log('periodEvent :::::::::::: ', periodEvent);
  
      
      const periodStartDate = periodEvent.predictedPeriodStart//.split('T')[0];

  let cycleDay =
        differenceInDays(currentDate, periodStartDate) + 1;

  let phase = '';
    let fertilityLevel = '';
    if (cycleDay <= 5) {
      phase = 'Menstrual';
      fertilityLevel = 'Very Low';
    } else if (cycleDay <= 13) {
      phase = 'Follicular';
      fertilityLevel = 'Low to Medium';
    } else if (cycleDay === 14) {
      phase = 'Ovulatory';
      fertilityLevel = 'Very High';
    } else if (
      cycleDay <= Number(personalizedJourney?.avgMenstrualCycleLength)
    ) {
      phase = 'Luteal';
      fertilityLevel = 'Low';
    } else {
      phase = 'Unknown';
      fertilityLevel = 'Unknown';
    }

  
    // Build system prompt
    const systemPrompt = `You are a friendly reproductive health assistant Named Fertie.
      Based on user's cycle, lab tests, Pattern you noticed and daily logs, provide helpful Suggestion.
  
      Be Statistic.

      Data available: 

      - phase: ${phase || 'N/A'}
      - fertilityLevel: ${fertilityLevel || 'N/A'}
      - cycleDay: ${cycleDay || 'N/A'}

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
      - trackOvulationBy: ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain: ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate: ${personalizedJourney?.expectedPeriodStartDate || 'N/A'}
      - predictedOvulationDate: ${personalizedJourney?.predictedOvulationDate || 'N/A'}

    
      ----- User Data 
      - name: ${userProfileData?.name || 'N/A'}
      - email: ${userProfileData?.email || 'N/A'}
      - role: ${userProfileData?.role || 'N/A'}
      - subscriptionType: ${userProfileData?.subscriptionType || 'N/A'}
      - phoneNumber: ${userProfileData?.phoneNumber || 'N/A'}
      - lastPasswordChangeDate: ${userProfileData?.lastPasswordChange || 'N/A'}

      ---------------------------
      give me response like {
        "currentCycleInfo" : "Current cycle info here",
        "suggestion" : "Your suggestion here",
        "patternFertieNoticed" : "Pattern you noticed here",
        "whatToKeepInMindInThisCycle" : "What to keep in mind in this cycle",
      }
    `;

    /*
      // 🤖🤖🤖 client bad dise ..  
    ----- in Daily cycle Insights Collection
      - menstrualFlow: ${insights?.menstrualFlow || 'N/A'}
      - mood: ${insights?.mood || 'N/A'}
      - activity: ${insights?.activity || 'N/A'}
      - symptoms: ${insights?.symptoms || 'N/A'}
      
      - cervicalMucus: ${insights?.cervicalMucus || 'N/A'}

      
      - labTestLog: ${JSON.stringify(insights?.labTestLogId) || 'N/A'}
      - allInsights: ${JSON.stringify(allInsights) || 'N/A'}

      */

    //  - phase: ${insights?.phase || 'N/A'}
    //   - fertilityLevel: ${insights?.fertilityLevel || 'N/A'}
    //   - cycleDay: ${insights?.cycleDay || 'N/A'}


    ////////////////////////////////////////////////////

    // Initialize response string
    let responseText = '';

    // Retry logic for API rate limits
    const maxRetries = 3;
    let retries = 0;
    let delay = 1000; // Start with 1 second delay
    let stream;



    while (retries <= maxRetries) {
      try {
        stream = await model.chat.completions.create({
          model: 'gpt-3.5-turbo', // qwen/qwen3-30b-a3b:free <- is give wrong result   // gpt-3.5-turbo <- give perfect result
          messages: [
            { role: 'system', content: systemPrompt },
            // { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          stream: true,
        });

        // If we get here, the request was successful
        break;
      } catch (error) {
        // Check if it's a rate limit error (429)
        if (error.status === 429) {
          if (
            error.message &&
            (error.message.includes('quota') ||
              error.message.includes('billing'))
          ) {
            // This is a quota/billing issue - try fallback if we haven't already
            if (retries === 0) {
              console.log('Quota or billing issue. Trying fallback model...');
              try {
                // Try a different model as fallback
                stream = await model.chat.completions.create({
                  model: 'gpt-3.5-turbo', // Using the same model as a placeholder, replace with actual fallback
                  messages: [
                    { role: 'system', content: systemPrompt },
                    // { role: 'user', content: userMessage },
                  ],
                  temperature: 0.7,
                  stream: true,
                });
                break; // If fallback succeeds, exit the retry loop
              } catch (fallbackError) {
                console.error('Fallback model failed:', fallbackError);
                // Continue with retries
              }
            } else {
              console.log(
                'Quota or billing issue. No more fallbacks available.'
              );
              throw error; // Give up after fallback attempts
            }
          }

          // Regular rate limit - apply exponential backoff
          retries++;
          if (retries > maxRetries) {
            // Send error message to client before throwing
            res.write(
              `data: ${JSON.stringify({
                error: 'Rate limit exceeded. Please try again later.',
              })}\n\n`
            );
            res.end();
            throw error; // Give up after max retries
          }

          console.log(
            `Rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));

          // Exponential backoff with jitter
          delay = delay * 2 * (0.5 + Math.random()); // Multiply by random factor between 1 and 1.5
        } else {
          // Not a rate limit error
          console.error('OpenAI API error:', error);
          res.write(
            `data: ${JSON.stringify({
              error: 'An error occurred while processing your request.',
            })}\n\n`
          );
          res.end();
          return; // Exit the function
        }
      }
    }

    if (!stream) {
      res.write(
        `data: ${JSON.stringify({
          error: 'Failed to generate a response. Please try again.',
        })}\n\n`
      );
      res.end();
      return;
    }

    try {
        // Process each chunk as it arrives
 
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          responseText += content;
        }
      }

      // Parse the JSON string into an object
      let jsonResponse;
      try {
        // First, try to parse the response directly
        jsonResponse = JSON.parse(responseText);
        jsonResponse.cycleDay = cycleDay;

        // console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        console.log("Failed to parse direct response, attempting to extract JSON");
        
        // Try to extract JSON using regex
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonResponse = JSON.parse(jsonMatch[0]);
              
          } catch (extractError) {
            console.error('Failed to extract valid JSON:', extractError);
            jsonResponse = {
              suggestion: "Failed to parse AI response. Please try again.",
              patternFertieNoticed: "",
              whatToKeepInMindInThisCycle: ""
            };
          }
        } else {
          // Fallback to a structured response if parsing fails
          jsonResponse = {
            cycleDay : cycleDay,
            suggestion: responseText.substring(0, 200) + "...",
            patternFertieNoticed: "Unable to parse the complete response",
            whatToKeepInMindInThisCycle: "Please try again later"
          };
        }
      }
     
      // Send end of stream marker
      // res.write(`data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n `); // 🟢

      sendResponse(res, {
        code: StatusCodes.OK,
        data: jsonResponse, //session.url,
        message: `Todays Cycle Insights Generated successfully`,
        success: true,
      });

      /**
       *
       * save bots response in the database ..
       */

      

      res.end(); // 🟢🟢🟢 end korte hobe
    } catch (streamError) {
      console.error('Error processing stream:', streamError);
      res.write(
        `data: ${JSON.stringify({
          error: 'Stream processing error. Please try again.',
        })}\n\n`
      );
      res.end();
    }





    ///////////////////////////////////////////////////

}

/**
 * for cycle insights .. we are calling Stream False from route .. 
 * 
 * Key Changes Made:
    1. Removed Streaming

    Changed stream: false to get complete response at once
    Eliminated complex streaming logic that might confuse Flutter

    2. Improved JSON Parsing

    Added multiple fallback strategies for parsing AI response
    Better error handling for malformed JSON
    Ensures all required fields are present

    3. Better Error Handling

    Wrapped everything in try-catch
    Proper error responses for Flutter
    Added Content-Type headers

    4. Enhanced AI Prompt

    Made it clearer that only JSON should be returned
    Specified exact format requirements
 */

  const getCycleInsightWithStramFalse = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  try {
    const currentDate = new Date();
    
    const personalizedJourneyService = new PersonalizedJourneyService();

    // Fetch user data
    const [personalizedJourney, userProfileData] 
    : [IPersonalizeJourney, any]
    = await Promise.all([
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);

    // Get fertility data
    let data: any = await new FertieService().predictAllDates(req.user.userId);
    
    const [year, month] = new Date().toISOString().split('T')[0].split('-');
    const targetYearMonth = `${year}-${month}`;

    // Find the month object that matches the target year-month
    const monthData = data.find(item => item.month === targetYearMonth);

    if (!monthData) {
      console.error(`No data found for month: ${targetYearMonth}`);
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        data: null,
        message: `No data found for current month`,
        success: false,
      });
    }

    // Extract period start date for the found month
    const periodEvent: {
      predictedPeriodStart: Date;
      predictedPeriodEnd: Date;
      predictedOvulationDate: Date;
      fertileWindow: [Date, Date];
    } = monthData.events.find(event => event.predictedPeriodStart);
  
    const periodStartDate = periodEvent.predictedPeriodStart;

    let cycleDay = differenceInDays(currentDate, periodStartDate) + 1;

    let phase = '';
    let fertilityLevel = '';
    if (cycleDay <= 5) {
      phase = 'Menstrual';
      fertilityLevel = 'Very Low';
    } else if (cycleDay <= 13) {
      phase = 'Follicular';
      fertilityLevel = 'Low to Medium';
    } else if (cycleDay === 14) {
      phase = 'Ovulatory';
      fertilityLevel = 'Very High';
    } else if (
      cycleDay <= Number(personalizedJourney?.avgMenstrualCycleLength)
    ) {
      phase = 'Luteal';
      fertilityLevel = 'Low';
    } else {
      phase = 'Unknown';
      fertilityLevel = 'Unknown';
    }

    // Build system prompt
    const systemPrompt = `You are a friendly reproductive health assistant Named Fertie.
      Based on user's cycle, lab tests, Pattern you noticed and daily logs, provide helpful Suggestion.
  
      Be Statistic.

      Data available: 

      - phase: ${phase || 'N/A'}
      - fertilityLevel: ${fertilityLevel || 'N/A'}
      - cycleDay: ${cycleDay || 'N/A'}

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
      - trackOvulationBy: ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain: ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate: ${personalizedJourney?.expectedPeriodStartDate || 'N/A'}
      - predictedOvulationDate: ${personalizedJourney?.predictedOvulationDate || 'N/A'}

      ----- User Data 
      - name: ${userProfileData?.name || 'N/A'}
      - email: ${userProfileData?.email || 'N/A'}
      - role: ${userProfileData?.role || 'N/A'}
      - subscriptionType: ${userProfileData?.subscriptionType || 'N/A'}
      - phoneNumber: ${userProfileData?.phoneNumber || 'N/A'}
      - lastPasswordChangeDate: ${userProfileData?.lastPasswordChange || 'N/A'}

      ---------------------------
      IMPORTANT: Respond ONLY with valid JSON in exactly this format (no extra text, no markdown, no code blocks):
      {
        "currentCycleInfo": "Current cycle info here",
        "suggestion": "Your suggestion here",
        "patternFertieNoticed": "Pattern you noticed here",
        "whatToKeepInMindInThisCycle": "What to keep in mind in this cycle"
      }
    `;

    // Initialize response string
    let responseText = '';

    // Retry logic for API rate limits
    const maxRetries = 3;
    let retries = 0;
    let delay = 1000;
    let stream;

    while (retries <= maxRetries) {
      try {
        // FIXED: Use stream: false for simpler response handling
        const completion = await model.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
          ],
          temperature: 0.7,
          stream: false, // Changed to false for easier handling
        });

        responseText = completion.choices[0]?.message?.content || '';
        break;

      } catch (error) {
        // Handle rate limit errors
        if (error.status === 429) {
          retries++;
          if (retries > maxRetries) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }

          console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = delay * 2 * (0.5 + Math.random());
        } else {
          console.error('OpenAI API error:', error);
          throw error;
        }
      }
    }

    if (!responseText) {
      throw new Error('Failed to generate a response from AI');
    }

    // IMPROVED: Better JSON parsing with multiple fallback strategies
    let jsonResponse;
    
    try {
      // Strategy 1: Direct parsing
      jsonResponse = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.log("Strategy 1 failed, trying strategy 2...");
      
      try {
        // Strategy 2: Extract JSON from markdown code blocks
        const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonResponse = JSON.parse(codeBlockMatch[1]);
        } else {
          throw new Error("No code block found");
        }
      } catch (codeBlockError) {
        console.log("Strategy 2 failed, trying strategy 3...");
        
        try {
          // Strategy 3: Extract first JSON object found
          const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            jsonResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON object found");
          }
        } catch (extractError) {
          console.log("Strategy 3 failed, using fallback response");
          
          // Strategy 4: Fallback response
          jsonResponse = {
            currentCycleInfo: `You are currently in the ${phase} phase on day ${cycleDay} with ${fertilityLevel.toLowerCase()} fertility level.`,
            suggestion: "Focus on maintaining a healthy lifestyle and tracking your symptoms.",
            patternFertieNoticed: "Fertie is analyzing your cycle patterns.",
            whatToKeepInMindInThisCycle: "Track your symptoms and maintain regular health habits."
          };
        }
      }
    }

    // Ensure all required fields are present
    if (!jsonResponse.currentCycleInfo || !jsonResponse.suggestion || 
        !jsonResponse.patternFertieNoticed || !jsonResponse.whatToKeepInMindInThisCycle) {
      
      // Fill missing fields with defaults
      jsonResponse = {
        currentCycleInfo: jsonResponse.currentCycleInfo || `You are currently in the ${phase} phase on day ${cycleDay}.`,
        suggestion: jsonResponse.suggestion || "Continue tracking your cycle and maintaining healthy habits.",
        patternFertieNoticed: jsonResponse.patternFertieNoticed || "Fertie is learning your cycle patterns.",
        whatToKeepInMindInThisCycle: jsonResponse.whatToKeepInMindInThisCycle || "Focus on consistent tracking and self-care.",
        ...jsonResponse // Keep any other fields that might be present
      };
    }

    // Add cycle day to response
    jsonResponse.cycleDay = cycleDay;

    console.log("Final JSON Response:", jsonResponse);

    // FIXED: Ensure proper headers for JSON response
    res.setHeader('Content-Type', 'application/json');
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: jsonResponse,
      message: `Today's Cycle Insights Generated successfully`,
      success: true,
    });

  } catch (error) {
    console.error('Error in getCycleInsight:', error);
    
    // FIXED: Ensure error response is also properly formatted
    res.setHeader('Content-Type', 'application/json');
    
    sendResponse(res, {
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      data: null,
      message: error.message || 'An error occurred while generating cycle insights',
      success: false,
    });
  }
};

export const ChatBotV1Controller = {
  getCycleInsightWithStreamTrue,
  getCycleInsightWithStramFalse,
  chatbotResponseLongPollingWithHistory
};
