import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import {
  getDailyInsights,
  getLabResults,
  getNextOvulationDate,
} from '../utils/dataFetchers';

const model = new ChatOpenAI({ temperature: 0.6, modelName: 'gpt-4' });

const chatbotResponse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userMessage = req.body.message;

    const insights = await getDailyInsights(userId);
    const labs = await getLabResults(userId);
    const ovulationDate = await getNextOvulationDate(userId);

    // Construct system prompt with dynamic context
    const systemPrompt = `You are a friendly reproductive health assistant.
Based on user's cycle, lab tests, and daily logs, provide helpful responses.
Be empathetic, short, and encouraging.

Data available:
- Next Ovulation: ${ovulationDate || 'Not available'}
- LH: ${labs?.LH || 'N/A'}
- Progesterone: ${labs?.progesterone || 'N/A'}
- Mood: ${insights?.mood || 'N/A'}
- Menstrual Flow: ${insights?.menstrualFlow || 'N/A'}
- Phase: ${insights?.phase || 'N/A'}
- Symptoms: ${insights?.symptoms?.join(', ') || 'None'}
`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(messages);

    res.status(200).json({ message: response.content });
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
