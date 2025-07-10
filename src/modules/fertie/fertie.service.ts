import OpenAI from 'openai';
import { GenericService } from "../__Generic/generic.services";
import { PersonalizeJourney } from "../_personalizeJourney/personalizeJourney/personalizeJourney.model";
import { User } from "../user/user.model";
import { IFertie } from "./fertie.interface";
import { Fertie } from "./fertie.model";

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, //OPENAI_API_KEY // OPENROUTER_API_KEY
  // baseURL: 'https://openrouter.ai/api/v1',
  baseURL: 'https://api.openai.com/v1'
});

export class FertieService extends GenericService<typeof Fertie, IFertie>{
    constructor(){
        super(Fertie)
    }

    //>  We This Function Have Issue .. must have to test it properly 
    predictAllDates = async (userId: string) => {
      // , monthQuery:any
      const user = await User.findById(userId);

      const journey = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );

      if (!journey) return null;
  
      const { periodStartDate, periodLength, avgMenstrualCycleLength } = journey;
      const today = new Date();
      
      // This will be our reference date to calculate future periods
      const baseDate = new Date(periodStartDate);
      
      // The month we want to start showing predictions from
      const startMonth =  today; // monthQuery ? new Date(`${monthQuery}-01`) :
      const startYear = startMonth.getFullYear();
      const startMonthNum = startMonth.getMonth();
      
      // Create a map to store predictions by month
      const predictionsByMonth : any = {};
      
      // Calculate predictions for enough cycles to cover 12 months from the start month
      // We'll generate more than 12 months of predictions to ensure we have data for all requested months
      const cyclesToGenerate = 12; // Generate enough cycles to ensure coverage
      
      for (let i = 0; i < cyclesToGenerate; i++) {
        // Calculate this cycle's predicted start date
        const predictedStart = new Date(baseDate);
        predictedStart.setDate(
          predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
        );
        
        // Skip if this prediction is before our start month
        const predictionYear = predictedStart.getFullYear();
        const predictionMonth = predictedStart.getMonth();
        if (
          predictionYear < startYear || 
          (predictionYear === startYear && predictionMonth < startMonthNum)
        ) {
          continue;
        }
        
        // Create month key for this prediction
        const monthKey = `${predictionYear}-${String(predictionMonth + 1).padStart(2, '0')}`;
        
        // Skip if we already have 12 months of predictions
        if (
          Object.keys(predictionsByMonth).length >= 12 && 
          !predictionsByMonth[monthKey]
        ) {
          continue;
        }
        
        // Calculate other prediction dates
        const predictedEnd = new Date(predictedStart);
        predictedEnd.setDate(predictedEnd.getDate() + Number(periodLength) - 1);
  
        const ovulation = new Date(predictedStart);
        ovulation.setDate(
          ovulation.getDate() + Math.floor(Number(avgMenstrualCycleLength) / 2)
        );
  
        const fertileStart = new Date(ovulation);
        fertileStart.setDate(fertileStart.getDate() - 3);
  
        const fertileEnd = new Date(ovulation);
        fertileEnd.setDate(fertileEnd.getDate() + 1);
        
        // Initialize this month's prediction if it doesn't exist
        if (!predictionsByMonth[monthKey]) {
          predictionsByMonth[monthKey] = {
            month: monthKey,
            events: [],
            dailyLogs: {}
          };
        }
        
        // Add this cycle's prediction to the appropriate month
        predictionsByMonth[monthKey].events.push({
          predictedPeriodStart: predictedStart,
          predictedPeriodEnd: predictedEnd,
          predictedOvulationDate: ovulation,
          fertileWindow: [fertileStart, fertileEnd]
        });
      }
      
      // Convert the predictions map to an array sorted by month
      const predictions = Object.values(predictionsByMonth)
        .sort((a: any, b: any) => a.month.localeCompare(b.month))
        .slice(0, 12); // Ensure we only return 12 months
      
      return predictions;
    }

    fixToJson(text: string) {
      // Add double quotes around keys (basic regex, may fail on nested objects)
      return text.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    }


    getChatBotsFeedbackAboutCurrentDailyCycle = async (cycleDay: number) : Promise<void> => {
      const systemPrompt = `Generate a title  based on cycleDay on max 55 character
        Data available: 
          - cycleDay: ${cycleDay || 'N/A'}
          
        Response Example (must be valid JSON string) : 
        {
          "title" : "provide a title based on cycleDay without mentioning cycleDay"  
        }  

      `
      
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
            model: 'gpt-4o', // qwen/qwen3-30b-a3b:free <- is give wrong result   // gpt-3.5-turbo <- give perfect result
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
            
            // res.end();
            return; // Exit the function
          }
        }
      }
  
      if (!stream) {
        
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
          // console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);
        
          return jsonResponse;
        } catch (parseError) {
          // If direct parsing fails, try to extract JSON from the response
          console.log("Failed to parse direct response, attempting to extract JSON");
          
          // Try to extract JSON using regex
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              // ---------------------------------------------------------------------------------
              // console.log("jsonMatch 🔴🔴 : ", jsonMatch); // [0]
              jsonResponse = JSON.parse(jsonMatch[0]); 

              // console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);

              return jsonResponse;
              //----------------------------------------------------------------------------------
            } catch (extractError) {
              console.error('Failed to extract valid JSON:', extractError);
              jsonResponse = {
                title: "Failed to parse AI response. Please try again.",
              };
            }
          } else {
            // Fallback to a structured response if parsing fails
            jsonResponse = {
              title: responseText ? responseText.substring(0, 200) + "..."  : "Hello, I am Fertie Bot",
            };
          }
        }
        
        /**
         *
         * save bots response in the database ..
        */
  
        // res.end(); // 🟢🟢🟢 end korte hobe
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        
      }
    }

    // Add more service here ..
}