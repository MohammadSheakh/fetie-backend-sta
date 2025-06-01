import catchAsync from "../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
// import { ChatOpenAI } from '@langchain/openai';
  import OpenAI from 'openai';
  import { HumanMessage, SystemMessage } from '@langchain/core/messages';
  import { RunnableSequence } from '@langchain/core/runnables';
  import { DailyCycleInsightsService } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service';
  import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
  import { UserService } from '../user/user.service';
  import { differenceInDays } from 'date-fns';
  import { isValid, parse } from 'date-fns';
  import ApiError from '../../errors/ApiError';
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
  import { json, text } from 'body-parser';
  import { FertieService } from '../fertie/fertie.service';
  
  let dailyCycleInsightService = new DailyCycleInsightsService();
  let personalizeJourneyService = new PersonalizedJourneyService();
  

//******** Not working  
// import { OpenAIEmbeddings } from '@langchain/embeddings/openai';
// import { MongoDBAtlasVectorSearch } from '@langchain/vectorstores/mongodb_atlas';

// OpenAI URL and Headers 


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

export class ChatBotTestController {

  private openAiHeaders = {
    "Content-Type": "application/json",
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  }

  /*************
    what can we do with this embedding .. 
    1. we can use PDF library to read PDF .. 
    2. chunk PDF into smaller chunks ..
    3. create embedding for each chunk ..
    4. store embedding in mongoDB or any vector database like Pinecone, Weaviate, etc.
    5. when user asks question, we can use embedding to find the most relevant chunk ..
    6. then we can use that chunk to answer the question .. 
  
  ************** */

  createEmbedding = catchAsync(async (req: Request, res: Response) => {
    const { textToEmbed } = req.body as { textToEmbed: string };
    
    let response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: openAiHeaders,
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: textToEmbed
      })
    });

    if(response.ok){
      response.json().then(data => {
        console.log("embedding data : ⏳", data)

        sendResponse(res, {
          code: StatusCodes.OK,
          data: data,
          message: `Embedding created successfully .. now we have to store this in mongoDb.. `,
          success: true,
        });
        /**********************
      {
        "attributes": {
            "object": "list",
            "data": [
                {
                    "object": "embedding",
                    "index": 0,
                    "embedding": [
                        -0.025122926,
                        -0.019487135,
                            -0.006002911
                    ]
                }
            ],
            "model": "text-embedding-ada-002-v2",
            "usage": {
                "prompt_tokens": 1,
                "total_tokens": 1
            }
        }
      }
         **************************** */
        // return data
      })
    }
  })

  /*
  createEmbeddingV3 = catchAsync(async (req: Request, res: Response) => {
    const { messageToEmbed } = req.body as { textToEmbed: string };

    // Assume you already have a MongoDB collection instance
    const embeddings = new OpenAIEmbeddings();

    const vectorStore = await MongoDBAtlasVectorSearch.fromDocuments(
      [messageToEmbed],
      embeddings,
      {
        collection,
        indexName: 'vector_index',
        textKey: 'embedding_text',
        embeddingKey: 'embedding',
      }
    );
  })
  */

  chatbotResponseLongPolHistoryVector = async (
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

      /*****
       * 
       * before saving .. create embedding for user messsage .. 
       * 
       * ******/

      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: this.openAiHeaders,
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
      
      console.log("embedding : ⏳", embedding);
      
      /**
       *
       * save message in the database ..
       */
  
      /*
          const saveMessageToDbRes: IMessage | null = await messageService.create({
            text: userMessage,
            senderId: req.user.userId,
            conversationId: conversationId,
            senderRole:
              req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
            embedding: embedding // as OpenAIEmbeddingResponse
          });
      */
  
    
      // also update the last message of the conversation 
      /*
      await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageSenderRole: RoleType.user},
        { new: true }
      );
      */
  
      /**
       *
       * get all simmilar messages by conversationId
       */

      const testPipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding", 
            queryVector: embedding,
            numCandidates: 10,
            limit: 3
          }
        },
        {
          $project: {
            text: 1,
            conversationId: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];

      const similarMessages = await Message.aggregate(testPipeline);

      console.log("similarMessages : ⏳", similarMessages);

      /****************************

      const previousMessageHistory: IMessage[] | null =
        await Message.find({
          conversationId
        }).populate("text senderRole conversationId"); // conversationId
  
      // console.log("previousMessageHistory 🟢🟢🟢", previousMessageHistory);
  
  
       *************************/

      sendResponse(res, {
        code: StatusCodes.OK,
        data: {
          similarMessages
        },
        message: `Message saved successfully and embedding created.`,
        success: true,
      });
      
  }catch(error){
      console.error('Chatbot error:', error);
    /// Make sure we haven't already started a response
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
  }
  }


chatbotV3 = async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req?.user?.userId;
      const userMessage = req?.body?.message;
      const conversationId = req?.body?.conversationId;
      const minAccuracy = req?.body?.minAccuracy || 0.1; // Default 80%, but can be adjusted
      
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

      // Create embedding for user message
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: this.openAiHeaders,
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
      
      console.log(`Searching for messages with ${minAccuracy * 100}%+ accuracy`);

      // Pipeline with configurable accuracy threshold
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding", 
            queryVector: embedding,
            numCandidates: 100, // High number for better recall
            limit: 50
          }
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" }
          }
        },
        {
          $match: {
            conversationId: conversationId,
            score: { $gte: minAccuracy } // Use configurable threshold
          }
        },
        {
          $project: {
            text: 1,
            conversationId: 1,
            senderId: 1,
            senderRole: 1,
            createdAt: 1,
            score: 1,
            accuracyPercentage: { 
              $multiply: ["$score", 100] // Convert to percentage
            }
          }
        },
        {
          $sort: { score: -1 }
        },
        {
          $limit: 5
        }
      ];

      const similarMessages = await Message.aggregate(pipeline as any[]);

      console.log(`Found ${similarMessages.length} messages with ${minAccuracy * 100}%+ accuracy`);
      
      if (similarMessages.length > 0) {
        console.log("Top result accuracy:", `${(similarMessages[0].score * 100).toFixed(1)}%`);
      }

      sendResponse(res, {
        code: StatusCodes.OK,
        data: {
          similarMessages: similarMessages,
          searchCriteria: {
            minAccuracy: minAccuracy,
            minAccuracyPercentage: `${minAccuracy * 100}%`,
            conversationId: conversationId
          }
        },
        message: `Found ${similarMessages.length} messages with ${minAccuracy * 100}%+ accuracy.`,
        success: true,
      });
      
    } catch(error) {
      console.error('Chatbot error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: `Something went wrong. ${error.message || error}` 
        });
      } else {
        res.write(
          `data: ${JSON.stringify({
            error: `Something went wrong. ${error.message || error}`,
          })}\n\n`
        );
        res.end();
      }
    }
  }


  chatbotV4 = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?.userId;
    const { message: userMessage, conversationId, minAccuracy = 0.1 } = req.body;

    if (!conversationId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `conversationId must be provided.`);
    }
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, `User not authenticated.`);
    }
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const openAiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    };

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: openAiHeaders,
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: userMessage,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `OpenAI Error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;


     // Save message with embedding
    await Message.create({
      text: userMessage,
      conversationId: conversationId,
      senderId: userId,
      senderRole: RoleType.user,
      embedding
    });

    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 50,
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          conversationId,
          score: { $gte: minAccuracy },
        },
      },
      {
        $project: {
          text: 1,
          conversationId: 1,
          senderId: 1,
          senderRole: 1,
          createdAt: 1,
          score: 1,
          accuracyPercentage: { $multiply: ["$score", 100] },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 5 },
    ];

    const similarMessages = await Message.aggregate(pipeline);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        similarMessages,
        searchCriteria: {
          minAccuracy,
          minAccuracyPercentage: `${minAccuracy * 100}%`,
          conversationId,
        },
      },
      message: `Found ${similarMessages.length} messages with ${minAccuracy * 100}%+ accuracy.`,
      success: true,
    });

  } catch (error: any) {
    console.error('Chatbot error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: `Something went wrong. ${error.message || error}` });
    } else {
      res.write(`data: ${JSON.stringify({ error: `Something went wrong. ${error.message || error}` })}\n\n`);
      res.end();
    }
  }
};
 
}























