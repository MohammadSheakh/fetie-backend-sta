import OpenAI from 'openai';
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
import mongoose from 'mongoose';
import { IPersonalizeJourney } from '../_personalizeJourney/personalizeJourney/personalizeJourney.interface';
import { Message } from '../_chatting/message/message.model';
import { Conversation } from '../_chatting/conversation/conversation.model';
import { FertieService } from '../fertie/fertie.service';
import { RoleType } from '../_chatting/message/message.constant';
import { PersonalizeJourney } from '../_personalizeJourney/personalizeJourney/personalizeJourney.model';

let dailyCycleInsightService = new DailyCycleInsightsService();
let personalizeJourneyService = new PersonalizedJourneyService();

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, //OPENAI_API_KEY // OPENROUTER_API_KEY
  // baseURL: 'https://openrouter.ai/api/v1',
  baseURL: 'https://api.openai.com/v1'
});


interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}  

const openAiHeaders = {
  "Content-Type": "application/json",
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
}

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

const XXXXXXXXXXXXXXchatbotResponseLongPollingWithHistoryXXXXXXXXXXXXXX = async (
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
        { lastMessageSenderRole: RoleType.botReply},
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

/************
 * 
 *  This is Good Version .. But We Found New Best Version Which is given by claude ... 
 * That Controller name is chatbotResponseLongPolling_V2_Claude
 * 
 * ******** */
const chatbotResponseLongPollingWithEmbeddingHistory = async (
  req: Request,
  res: Response
) => {
  try {

    /***********
     * 
     * conversationId ta exist kore kina check korte hobe //TODO ::::::::::::: 
     * 
     * *********/ 

    const userId = req?.user?.userId;
    const userMessage = req?.body?.message;
    const conversationId = req?.body?.conversationId;
    if (!conversationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `conversationId must be provided.`
      );
    }
    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }
    let messageService = new MessagerService();


    /*********
     * 
     * before saving .. create embedding for user messsage .. 
     * 
     * ******/

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: openAiHeaders,
      body: JSON.stringify({
        model: "text-embedding-3-small", // // Updated model (ada-002 is deprecated)
        input: userMessage
      })
    });

    if (!embeddingResponse.ok) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to create embedding: ${embeddingResponse.statusText}`
      );
    }

    const embeddingData: OpenAIEmbeddingResponse = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    /**********
     *
     * save message in the database ..
     * 
     *********/

    const saveMessageToDbRes: IMessage | null = await messageService.create({
      text: userMessage,
      senderId: req.user.userId,
      conversationId: conversationId,
      senderRole:
        req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
      embedding: embedding // as OpenAIEmbeddingResponse
    });

    // also update the last message sender role of the conversation 
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessageSenderRole: RoleType.user},
      { new: true }
    );

    /**********
     *
     * get all messages by conversationId --- But as we are using embedding, 
     * we don't need to fetch all messages
     * 
     *********/
    
    /******************
     
    const previousMessageHistory: IMessage[] | null =
      await Message.find({
        conversationId
      }).populate("text senderRole conversationId"); // conversationId

    // console.log("previousMessageHistory 🟢🟢🟢", previousMessageHistory);

    ******************** */

    // Set up headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let systemPrompt = await ChatBotService.dateParse(userMessage, userId);

     // Convert previous messages to the format expected by the API
    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // formattedMessages.push({
    //   role: 'user',
    //   content: userMessage.toString(),
    // });

    /************************

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

    *************************/


    const testPipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 100,
        limit: 20
      }
    },
    {
      $match: {
        senderId: new mongoose.Types.ObjectId(userId),  // Add this stage to filter by senderId
        senderRole: 'user'
      }
    },
    {
      $project: {
        text: 1,
        conversationId: 1,
        senderId: 1,  // Include senderId in the projection if needed
        senderRole: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ];

  const similarMessagesHistory = await Message.aggregate(testPipeline);
  
  //console.log("similarMessagesHistory 🟢🟢🟢", similarMessagesHistory);

  if (similarMessagesHistory && similarMessagesHistory.length > 0) {
     
      similarMessagesHistory.forEach((msg, i) => {
        if(msg.senderRole == 'user'){
          // console.log("msg.text.toString() 🟢🟢🟢", msg.text.toString());
          const role = msg.senderRole === RoleType.user ? 'user' : 'assistant';
          formattedMessages.push({
            role: role,
            content: msg.text.toString(),
          });

          console.log('role user 🎯 formattedMessages ',i," :: ", formattedMessages)
        }
      });
    }

    

    // console.log("formattedMessages 🟢🟢🟢", formattedMessages);
    
    // Initialize response string
    let responseText = '';

    // Retry logic for API rate limits
    const maxRetries = 3;
    let retries = 0;
    let delay = 1000; // Start with 1 second delay
    let stream;

    // console.log("formattedMessages 🟢🟢🟢", formattedMessages);
    
    console.log("userMessage.toString()---------", userMessage.toString());
    formattedMessages.push(
      {
        role: 'user',
        content: userMessage.toString(),
      }
    )
   
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
        console.log("🌋🌋🌋🌋🌋");
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
      res.write(`data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n`);


      /***********
       * 
       * before saving .. create embedding for bot messsage .. 
       * 
       * *********/

      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: openAiHeaders,
        body: JSON.stringify({
          model: "text-embedding-3-small", // // Updated model (ada-002 is deprecated)
          input: userMessage
        })
      });

      if (!embeddingResponse.ok) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Failed to create embedding: ${embeddingResponse.statusText}`
        );
      }
      const embeddingData: OpenAIEmbeddingResponse = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      

      /********
       *
       * save bots response in the database ..
       * 
       *********/

      const saveMessageToDbRes: IMessage | null = await messageService.create({
        text: responseText,
        senderId: new mongoose.Types.ObjectId('68206aa9e791351fc9fdbcde'),
        conversationId: conversationId,
        senderRole: RoleType.bot,
        embedding: embedding // as OpenAIEmbeddingResponse
      });

      // also update the last message of the conversation 
      await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageSenderRole: RoleType.botReply},
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

/************
 * 
 * New Best Version Which is given by claude ... 
 * 
 * ******** */
const chatbotResponseLongPolling_V2_Claude = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req?.user?.userId;
    const userMessage = req?.body?.message;
    const conversationId = req?.body?.conversationId;
    const now = new Date();
    
    if (!conversationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `conversationId must be provided.`
      );
    }
    if (!userMessage) {
      console.error('No message provided in the request body.');
      return res.status(400).json({ error: 'Message is required' });
    }
    
    let messageService = new MessagerService();

    // Create embedding for user message
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: openAiHeaders,
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: userMessage
      })
    });

    if (!embeddingResponse.ok) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to create embedding: ${embeddingResponse.statusText}`
      );
    }

    const embeddingData: OpenAIEmbeddingResponse = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Save user message to database
    const saveMessageToDbRes: IMessage | null = await messageService.create({
      text: userMessage,
      senderId: req.user.userId,
      conversationId: conversationId,
      senderRole: req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
      embedding: embedding,
      // createdAt: now, // Explicitly set the same timestamp
      // updatedAt: now
    });

    // also update the last message sender role of the conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessageSenderRole: RoleType.user},
      { new: true }
    );

    // Set up headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let systemPrompt = await ChatBotService.dateParse(userMessage, userId);

    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // FIXED: Search both user messages AND bot responses for context
    const contextPipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 30 // Increased limit to get more context
        }
      },
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(userId), // User's messages
          //conversationId: new mongoose.Types.ObjectId(conversationId) // Same conversation
        }
      },
      {
        $project: {
          text: 1,
          conversationId: 1,
          senderId: 1,
          senderRole: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $sort: { score: -1 } // Sort by relevance score
      }
    ];

    // FIXED: Also search bot responses for relevant information
    const botContextPipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 30
        }
      },
      {
        $match: {
          senderRole: 'bot',
          conversationId: new mongoose.Types.ObjectId(conversationId)
        }
      },
      {
        $project: {
          text: 1,
          conversationId: 1,
          senderId: 1,
          senderRole: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $sort: { score: -1 }
      }
    ];

    const recentMessagesPipeline = [
  {
    $match: {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      // Optionally exclude very old messages
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
    }
  },
  {
    $sort: { createdAt: -1 } // newest first
  },
  {
    $limit: 4 // get last 4 messages (2 user + 2 bot)
  },
  {
    $sort: { createdAt: 1 } // now sort chronologically (important!)
  },
  {
    $project: {
      text: 1,
      senderRole: 1,
      createdAt: 1
    }
  }
];

    const [userContext , recentMessages, /* botContext*/ ] = await Promise.all([
      Message.aggregate(contextPipeline),
      // Message.aggregate(botContextPipeline)
      Message.aggregate(recentMessagesPipeline)
    ]);

    console.log("🖼️🖼️🖼️🖼️ Recent messages:", recentMessages);

    // FIXED: Build conversational context by pairing related messages
    const buildConversationalContext = (userMsgs:any /*, botMsgs:any*/) => {
      const contextMessages = [];
      
      /*************
      // Add high-relevance bot responses first (these contain the actual information)
      botMsgs.slice(0, 10).forEach(msg => {
        console.log("msg =====", msg)
        if (msg.score > 0.7) { // Only high-relevance bot messages
          contextMessages.push({
            role: 'assistant',
            content: msg.text.toString()
          });
        }
      });
      ******** */
      // Add relevant user messages for context
      userMsgs.slice(0, 5).forEach((msg,i) => {
        if (msg.score > 0.75) { // Higher threshold for user messages
          contextMessages.push({
            role: 'user',
            content: msg.text.toString()
          });
          console.log("-----------",i, msg.text.toString());
        }
      });

      return contextMessages;
    };

    const contextMessages = buildConversationalContext(userContext /*, botContext */);
    
    // FIXED: Add context messages to formatted messages
    formattedMessages.push(...contextMessages);

    

    // 🟢🟢🟢🟢🟢 here we need to pass recent conversation context
    const recentContextMessages = recentMessages.map(msg => ({
      role: msg.senderRole === 'user' ? 'user' : 'assistant',
      content: msg.text.toString()
    }));
    formattedMessages.push(...recentContextMessages);

    // Add current user message
    formattedMessages.push({
      role: 'user',
      content: userMessage.toString(),
    });

    console.log("Context messages added:", contextMessages.length);

    // Initialize response string
    let responseText = '';

    // Retry logic for API rate limits
    const maxRetries = 3;
    let retries = 0;
    let delay = 1000;
    let stream;

    while (retries <= maxRetries) {
      try {
        stream = await model.chat.completions.create({
          model: 'gpt-4o',
          messages: formattedMessages,
          temperature: 0.7,
          stream: true,
        });
        break;
      } catch (error) {
        console.log("🌋🌋🌋🌋🌋");
        if (error.status === 429) {
          if (error.message && (error.message.includes('quota') || error.message.includes('billing'))) {
            if (retries === 0) {
              console.log('Quota or billing issue. Trying fallback model...');
              try {
                stream = await model.chat.completions.create({
                  model: 'gpt-3.5-turbo',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                  ],
                  temperature: 0.7,
                  stream: true,
                });
                break;
              } catch (fallbackError) {
                console.error('Fallback model failed:', fallbackError);
              }
            } else {
              console.log('Quota or billing issue. No more fallbacks available.');
              throw error;
            }
          }

          retries++;
          if (retries > maxRetries) {
            res.write(`data: ${JSON.stringify({
              error: 'Rate limit exceeded. Please try again later.',
            })}\n\n`);
            res.end();
            throw error;
          }

          console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = delay * 2 * (0.5 + Math.random());
        } else {
          console.error('OpenAI API error:', error);
          res.write(`data: ${JSON.stringify({
            error: 'An error occurred while processing your request.',
          })}\n\n`);
          res.end();
          return;
        }
      }
    }

    if (!stream) {
      res.write(`data: ${JSON.stringify({
        error: 'Failed to generate a response. Please try again.',
      })}\n\n`);
      res.end();
      return;
    }

    // Process each chunk as it arrives
    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          responseText += content;
          res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          if (res.flush) {
            res.flush();
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n`);

      // FIXED: Create embedding for bot response (not user message)
      const botEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: openAiHeaders,
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: responseText // FIXED: Use responseText instead of userMessage
        })
      });

      if (!botEmbeddingResponse.ok) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Failed to create embedding: ${botEmbeddingResponse.statusText}`
        );
      }
      
      const botEmbeddingData: OpenAIEmbeddingResponse = await botEmbeddingResponse.json();
      const botEmbedding = botEmbeddingData.data[0].embedding;


      // const now2 = new Date();
      
          // Save bot response to database
          const saveBotMessageToDbRes: IMessage | null = await messageService.create({
            text: responseText,
            senderId: new mongoose.Types.ObjectId('68206aa9e791351fc9fdbcde'),
            conversationId: conversationId,
            senderRole: RoleType.bot,
            embedding: botEmbedding, // FIXED: Use bot embedding
            // createdAt: now2, //set the current time stamp
            // updatedAt: now2
          });
      

      // Update conversation
      await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageSenderRole: RoleType.botReply},
        { new: true }
      );

      res.end();
    } catch (streamError) {
      console.error('Error processing stream:', streamError);
      res.write(`data: ${JSON.stringify({
        error: 'Stream processing error. Please try again.',
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: `Something went wrong. ${error.message || error}` });
    } else {
      res.write(`data: ${JSON.stringify({
        error: `Something went wrong. ${error.message || error}`,
      })}\n\n`);
      res.end();
    }
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
  const [insights, allInsights, personalizedJourney, userProfileData] 
  : [any, any, IPersonalizeJourney, any]
  = await Promise.all([
    dailyCycleInsightService.getByDateAndUserId(new Date(), userId),
    dailyCycleInsightService.getByUserId(userId),
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

      console.log("🟢Fahim Vai test🟢", data)
  
      //  const [year, month] = req.body.date.split('-');
       const [year, month] = new Date().toISOString().split('T')[0].split('-');
      const targetYearMonth = `${year}-${month}`;
  
      // Find the month object that matches the target year-month
      const monthData = data.find(item => item.month === targetYearMonth);

      console.log("🟢Fahim Vai test monthData🟢", monthData)
  
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

      ----- in Daily cycle Insights Collection
      - menstrualFlow: ${insights?.menstrualFlow || 'N/A'}
      - mood: ${insights?.mood || 'N/A'}
      - activity: ${insights?.activity || 'N/A'}
      - symptoms: ${insights?.symptoms || 'N/A'}
      
      - cervicalMucus: ${insights?.cervicalMucus || 'N/A'}

      - allInsights: ${JSON.stringify(allInsights) || 'N/A'}
    
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

    // - labTestLog: ${JSON.stringify(insights?.labTestLogId) || 'N/A'}
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
                console.error('Fallback model failed:', fallbackError); //> vofdmvldfbdifvifdnidfn
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
    // Fetch user data
    const [personalizedJourney, userProfileData] 
    : [IPersonalizeJourney, any]
    = await Promise.all([
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);

    console.log("personalizedJourney 🎯: ", personalizedJourney);
    console.log("userProfileData : 🎯", userProfileData);

    // Get fertility data
    let data: any = await new FertieService().predictAllDates(req.user.userId);

    console.log("data :🌀🌀🌀🌀 ", data);
    
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

    const journey = await PersonalizeJourney.findById(
            userProfileData?.personalize_Journey_Id
    );

    if (!journey) return;

    const { periodStartDate, avgMenstrualCycleLength } =
        journey;

    const today = new Date();
    const baseDate = new Date(periodStartDate);

    let cycleDay = calculateCurrentCycleDay(
        today,
        baseDate,
        Number(avgMenstrualCycleLength)
    );

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
  XXXXXXXXXXXXXXchatbotResponseLongPollingWithHistoryXXXXXXXXXXXXXX,
  chatbotResponseLongPolling_V2_Claude,
  chatbotResponseLongPollingWithEmbeddingHistory
};


// Helper function to calculate current cycle day
function calculateCurrentCycleDay(
  currentDate: Date,
  baseDate: Date,
  avgCycleLength: number
): number {
  const daysSinceBase = Math.floor(
    (currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceBase < 0) {
    // Current date is before the base date
    return 1;
  }

  // Calculate which cycle we're in and what day of that cycle
  const cycleDay = (daysSinceBase % avgCycleLength) + 1;

  return cycleDay;
}