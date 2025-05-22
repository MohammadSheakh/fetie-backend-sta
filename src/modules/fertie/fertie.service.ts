import OpenAI from 'openai';
import { GenericService } from "../__Generic/generic.services";
import { DailyCycleInsights } from "../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.model";
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
      
      // Now fetch daily insights for each month we have predictions for
      for (const monthKey of Object.keys(predictionsByMonth)) {
        const [year, month] = monthKey.split('-').map(Number);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        
        // Fetch DailyCycleInsights for this month
        const insights = await DailyCycleInsights.find({
          userId,
          date: { $gte: startDate, $lte: endDate },
        }).lean();
        
        const formattedData:any = {};
        
        insights.forEach(entry => {
          const dateKey = entry.date
            .toISOString()
            .slice(0, 10)
            .split('-')
            .reverse()
            .join('-'); // DD-MM-YYYY
          
          const { menstrualFlow, phase } = entry;
          
          formattedData[dateKey] = {};
          
          if (menstrualFlow)
            formattedData[dateKey].menstrualFlow = menstrualFlow;
          if (phase) 
            formattedData[dateKey].phase = phase;
        });
        
        predictionsByMonth[monthKey].dailyLogs = formattedData;
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
          "title" : "You're on Cycle Day 10- this is a key time 🪴" 
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
              // Send error message to client before throwing
              // 🔴
              /*
                res.write(
                  `data: ${JSON.stringify({
                    error: 'Rate limit exceeded. Please try again later.',
                  })}\n\n`
                );
              */
              // res.end();
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
            // 🔴
            /*
            res.write(
              `data: ${JSON.stringify({
                error: 'An error occurred while processing your request.',
              })}\n\n`
            );
            */
            // res.end();
            return; // Exit the function
          }
        }
      }
  
      if (!stream) {
        // 🔴
        /*
        res.write(
          `data: ${JSON.stringify({
            error: 'Failed to generate a response. Please try again.',
          })}\n\n`
        );
        */
        // res.end();
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

          console.log("🟢 No AI Generated Notification found for today ... Lets generate ... 🤖");

          console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);
        
          return jsonResponse;
        } catch (parseError) {
          // If direct parsing fails, try to extract JSON from the response
          console.log("Failed to parse direct response, attempting to extract JSON");
          
          // Try to extract JSON using regex
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              // ---------------------------------------------------------------------------------
              console.log("jsonMatch 🔴🔴 : ", jsonMatch); // [0]
              jsonResponse = JSON.parse(jsonMatch[0]); 

              console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);

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
        
        // Send end of stream marker
        // res.write(`data: ${JSON.stringify({ done: true, fullResponse: responseText })}\n\n `); // 🟢
  
        /*
          // 🔴
          sendResponse(res, {
            code: StatusCodes.OK,
            data: {jsonResponse,newAIGeneratedNotification, allNotificaiton} ,  //   jsonResponse  //session.url,
            message: `Notification generated successfully..`,
            success: true,
          });
        */
  
        /**
         *
         * save bots response in the database ..
        */
  
        // res.end(); // 🟢🟢🟢 end korte hobe
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        /*
          // 🔴
          res.write(
            `data: ${JSON.stringify({
              error: 'Stream processing error. Please try again.',
            })}\n\n`
          );
        */
        //  res.end();
      }
    }

/**
 * Calculate fertility score based on user data
 * Returns a score from 0-100 with breakdown of factors
 */

/*
 calculateFertilityScore = async (userId : string) => {
  try {
    // Fetch all required data from database
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const personalJourney = await PersonalizeJourney.findById(user.personalize_Journey_Id);
    if (!personalJourney) throw new Error('Personalized journey data not found');
    
    // Get daily insights for the current cycle
    const currentDate = new Date(); // '2025-05-16'
    // Assuming we want to look at data from the past 30 days to capture the current cycle
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    const dailyInsights = await DailyCycleInsights.find({
      userId,
      date: {
        $gte: thirtyDaysAgo,
        $lte: currentDate
      }
    }).sort({ date: 1 }); // Sorting by date ascending

    console.log('1️⃣ ', dailyInsights);

    // Get lab test IDs from the daily insights
    const labTestIds = dailyInsights
      .filter(insight => insight.labTestLogId)
      .map(insight => insight.labTestLogId);

    // Fetch all referenced lab tests
    const labTests = labTestIds.length > 0 
      ? await LabTestLog.find({ _id: { $in: labTestIds } })
      : [];
    
    // Calculate sub-scores based on available data
    const scores = {
      ovulationSignals: calculateOvulationScore(dailyInsights, personalJourney),
      intercourse: calculateIntercourseScore(dailyInsights, personalJourney),
      hormones: calculateHormoneScore(labTests, dailyInsights),
      cycleConsistency: calculateCycleConsistencyScore(personalJourney, dailyInsights),
      lifestyle: calculateLifestyleScore(dailyInsights)
    };
    
    // Calculate the final weighted score
    const finalScore = Math.round(
      (scores.ovulationSignals * 0.35) +
      (scores.intercourse * 0.25) +
      (scores.hormones * 0.20) +
      (scores.cycleConsistency * 0.10) +
      (scores.lifestyle * 0.10)
    );
    
    // Ensure the score is within 0-100 range
    const boundedScore = Math.min(100, Math.max(0, finalScore));
    
    return {
      fertilityScore: boundedScore,
      breakdown: {
        ovulationSignals: scores.ovulationSignals,
        intercourse: scores.intercourse,
        hormones: scores.hormones,
        cycleConsistency: scores.cycleConsistency,
        lifestyle: scores.lifestyle
      },
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error('Error calculating fertility score:', error);
    throw error;
  }
};
*/
   
    // Add more service here ..
}


/**
 * Calculate score for ovulation signals (35% of total)
 * Checks cervical mucus, ovulation tests, and symptoms
 */
/*
const calculateOvulationScore = (dailyInsights : Partial<IDailyCycleInsights[]>, personalJourney : Partial<IPersonalizeJourney> ) => {
  // Initialize with a base score
  let score = 50;
  
  // If no data available, return baseline score
  if (!dailyInsights || dailyInsights.length === 0) return score;
  
  // Get current cycle day
  const cycleDay = getCurrentCycleDay(dailyInsights, personalJourney);
  
  // Check for fertile cervical mucus entries
  const hasFertileCervicalMucus = dailyInsights.some(day => day && day.cervicalMucus &&
    day.cervicalMucus === TCervicalMucus.eggWhite || day && day.cervicalMucus && day.cervicalMucus === TCervicalMucus.creamy // 'watery'
  );
  
  // Check ovulation symptoms
  const hasOvulationSymptoms = dailyInsights.some(day => 
    (day && day.symptoms && (day.symptoms.includes(TSymptoms.pain) || day.symptoms.includes(TSymptoms.bloating)))
  );
  
  // Calculate projected fertile window based on cycle data
  const { periodStartDate, avgMenstrualCycleLength = 28 } = personalJourney || {};
  
  // If we have data to calculate a fertile window
  if (periodStartDate && cycleDay) {
    // Typical fertile window is around cycle days 10-17 for a 28-day cycle
    // Adjust based on the user's average cycle length
    const fertileWindowStart = Math.max(8, Math.round(Number(avgMenstrualCycleLength) * 0.3));
    const fertileWindowEnd = Math.min(20, Math.round(Number(avgMenstrualCycleLength) * 0.6));
    
    // If user is in fertile window, increase score
    if (cycleDay >= fertileWindowStart && cycleDay <= fertileWindowEnd) {
      score += 20;
      
      // If in likely ovulation days (cycle day 12-16 in a 28-day cycle), increase further
      const ovulationStart = Math.round(Number(avgMenstrualCycleLength) * 0.4);
      const ovulationEnd = Math.round(Number(avgMenstrualCycleLength) * 0.5);
      
      if (cycleDay >= ovulationStart && cycleDay <= ovulationEnd) {
        score += 15;
      }
    }
  }
  
  // Add points for fertility signals
  if (hasFertileCervicalMucus) score += 15;
  if (hasOvulationSymptoms) score += 10;

  console.log('4️⃣ ovulation ', score);
  
  // Cap at 100
  return Math.min(100, score);
};
*/



/**
 * Calculate score for intercourse timing (25% of total)
 */
/*
const calculateIntercourseScore = (dailyInsights : Partial<IDailyCycleInsights[]>, personalJourney  : Partial<IPersonalizeJourney>) => {
  // Initialize score
  let score = 0;
  
  // If no data, return 0
  if (!dailyInsights || dailyInsights.length === 0) return score;
  
  // Check for intercourse entries
  const intercourseEntries = dailyInsights.filter(day => day && day.activity &&   
    day.activity ===  TActivity.intercourse || day &&   day.activity && day.activity === TActivity.insemination
  );
  
  if (intercourseEntries.length === 0) return score;
  
  // Get current cycle day - either from the database if available or calculate it
  let cycleDay;
  const todayInsight = dailyInsights.find(day => {
    const dayDate = new Date(day.date);
    const today = new Date();
    return dayDate.getDate() === today.getDate() && 
           dayDate.getMonth() === today.getMonth() && 
           dayDate.getFullYear() === today.getFullYear();
  });
  
  if (todayInsight && todayInsight.cycleDay) {
    cycleDay = todayInsight.cycleDay;
  } else {
    cycleDay = getCurrentCycleDay(dailyInsights, personalJourney);
  }
  
  // Calculate fertile window
  const { avgMenstrualCycleLength = 28 } = personalJourney || {};
  const fertileWindowStart = Math.max(8, Math.round(Number(avgMenstrualCycleLength)  * 0.3));
  const fertileWindowEnd = Math.min(20, Math.round(Number(avgMenstrualCycleLength) * 0.6));
  
  // Calculate estimated ovulation day
  const estimatedOvulationDay = Math.round(Number(avgMenstrualCycleLength) * 0.45);
  
  // Check if intercourse happened during fertile window
  let hasIntercourseInFertileWindow = false;
  let hasIntercourseNearOvulation = false;
  
  intercourseEntries.forEach(entry => {
    const entryCycleDay = entry ? (entry.cycleDay || getCycleDayForDate(entry.date, personalJourney, dailyInsights)) : null;
    
    if (entryCycleDay >= fertileWindowStart && entryCycleDay <= fertileWindowEnd) {
      hasIntercourseInFertileWindow = true;
      
      // Check if intercourse was very close to ovulation (±2 days)
      if (Math.abs(entryCycleDay - estimatedOvulationDay) <= 2) {
        hasIntercourseNearOvulation = true;
      }
    }
  });
  
  // Score based on timing
  if (hasIntercourseNearOvulation) {
    score = 90; // Excellent timing
  } else if (hasIntercourseInFertileWindow) {
    score = 70; // Good timing
  } else {
    // Some points for trying, but not ideal timing
    score = 30;
  }
  
  // Bonus for multiple intercourse sessions during fertile window
  const intercourseDuringFertileWindow = intercourseEntries.filter(entry => {
    const entryCycleDay = entry.cycleDay || getCycleDayForDate(entry.date, personalJourney, dailyInsights);
    return entryCycleDay >= fertileWindowStart && entryCycleDay <= fertileWindowEnd;
  });
  
  if (intercourseDuringFertileWindow.length > 1) {
    score = Math.min(100, score + 10); // Bonus for multiple attempts
  }
  
  console.log('5️⃣ intercourse score', score);

  return score;
};
*/


/**
 * Calculate score based on hormone levels (20% of total)
 */
/*
const calculateHormoneScore = (labTests, dailyInsights : Partial<IDailyCycleInsights[]>) => {
  // If no lab tests available, return neutral score
  if (!labTests || labTests.length === 0) return 50;
  
  // Create a mapping of lab tests to their corresponding dates using dailyInsights
  const labTestDates: Record<string, Date> = {};
  dailyInsights.forEach(insight => {
    if (insight && insight.labTestLogId) {
      labTestDates[insight.labTestLogId.toString()] = insight.date;
    }
  });
  
  // Sort lab tests by date (most recent first)
  const sortedLabTests = [...labTests].sort((a, b) => {
    const dateA = labTestDates[a._id.toString()] || new Date(a.createdAt);
    const dateB = labTestDates[b._id.toString()] || new Date(b.createdAt);
    return dateB - dateA;
  });
  
  let score = 50; // Start with neutral score
  
  // Map each lab test to get scores for each hormone type
  const testScores = sortedLabTests.map((test, index) => {
    // Give more weight to more recent tests (index 0 is most recent)
    const recencyWeight = Math.max(0.5, 1 - (index * 0.1));
    let testScore = 0;
    let factorsEvaluated = 0;
    
    // Check FSH (follicle stimulating hormone)
    if (test.follicleStimulatingHormoneTest) {
      factorsEvaluated++;
      const fsh = parseFloat(test.follicleStimulatingHormoneTest);
      if (fsh >= 3.5 && fsh <= 12.5) {
        testScore += 10; // Normal range
      } else if (fsh < 3.5) {
        testScore -= 5; // Low
      } else if (fsh > 12.5) {
        testScore -= 10; // High could indicate diminished ovarian reserve
      }
    }
    
    // Check LH (luteinizing hormone)
    if (test.luteinizingHormoneTest) {
      factorsEvaluated++;
      const lh = parseFloat(test.luteinizingHormoneTest);
      if (lh >= 5 && lh <= 25) {
        testScore += 10; // Normal range
      } else {
        testScore -= 5; // Outside normal range
      }
    }
    
    // Check estradiol
    if (test.estradiolTest) {
      factorsEvaluated++;
      const estradiol = parseFloat(test.estradiolTest);
      if (estradiol >= 30 && estradiol <= 400) {
        testScore += 10; // Normal range depends on cycle phase
      } else {
        testScore -= 5;
      }
    }
    
    // Check progesterone
    if (test.progesteroneTest) {
      factorsEvaluated++;
      const progesterone = parseFloat(test.progesteroneTest);
      // Higher progesterone in luteal phase indicates ovulation occurred
      if (progesterone > 3) {
        testScore += 15; // Good indicator of ovulation
      } else {
        testScore -= 10; // May indicate anovulation
      }
    }
    
    // Check AMH
    if (test.antiMullerianHormoneTest) {
      factorsEvaluated++;
      const amh = parseFloat(test.antiMullerianHormoneTest);
      if (amh >= 1.0 && amh <= 4.0) {
        testScore += 10; // Good AMH range
      } else if (amh < 1.0) {
        testScore -= 10; // Low AMH suggests reduced ovarian reserve
      }
    }
    
    // Check thyroid
    if (test.thyroidStimulatingHormoneTest) {
      factorsEvaluated++;
      const tsh = parseFloat(test.thyroidStimulatingHormoneTest);
      if (tsh >= 0.4 && tsh <= 4.0) {
        testScore += 5; // Normal range
      } else {
        testScore -= 10; // Thyroid issues can affect fertility
      }
    }
    
    // Check prolactin
    if (test.prolactinTest) {
      factorsEvaluated++;
      const prolactin = parseFloat(test.prolactinTest);
      if (prolactin <= 25) {  // Normal range in ng/mL
        testScore += 5; // Normal range
      } else {
        testScore -= 10; // Elevated prolactin can inhibit ovulation
      }
    }
    
    // Return weighted score if factors were evaluated
    return factorsEvaluated > 0 ? (testScore / factorsEvaluated) * recencyWeight : 0;
  });
  
  // Average the scores from all tests
  if (testScores.length > 0) {
    const totalTestScore = testScores.reduce((sum, score) => sum + score, 0);
    score = 50 + (totalTestScore / testScores.length);
  }
  
  // Ensure score stays in 0-100 range
  return Math.min(100, Math.max(0, score));
};
*/

/**
 * Calculate score for cycle consistency (10% of total)
 */
/*
const calculateCycleConsistencyScore = (personalJourney : Partial<IPersonalizeJourney>, dailyInsights : Partial<IDailyCycleInsights[]> ) => {
  let score = 50; // Start with neutral score
  
  if (!personalJourney) return score;
  
  // Look at period regularity
  if (personalJourney.areCyclesRegular === true) {
    score += 20;
  } else if (personalJourney.areCyclesRegular === false) {
    score -= 10;
  }
  
  // Consider cycle length
  const { avgMenstrualCycleLength } = personalJourney;
  if (avgMenstrualCycleLength) {
    // Very short or very long cycles can indicate issues
    if (Number(avgMenstrualCycleLength) >= 25 && Number(avgMenstrualCycleLength) <= 35) {
      score += 20; // Ideal range
    } else if (Number(avgMenstrualCycleLength) >= 21 && Number(avgMenstrualCycleLength) <= 40) {
      score += 10; // Acceptable range
    } else {
      score -= 10; // Outside normal range
    }
  }
  
  // Look at flow patterns
  if (dailyInsights && dailyInsights.length > 0) {
    // const hasHeavyFlow = dailyInsights.some(day => day.menstrualFlow === 'heavy');
    const hasHeavyFlow = dailyInsights.some(day => day && day.menstrualFlow === TMenstrualFlow.heavy);
    const hasSpottingFlow = dailyInsights.some(day => day && day.menstrualFlow === TMenstrualFlow.spotting);
    
    // Very heavy flow might indicate issues
    if (hasHeavyFlow) {
      score -= 5;
    }
    
    // Spotting outside period can indicate hormonal imbalance
    if (hasSpottingFlow) {
      score -= 5;
    }
  }

  console.log('7️⃣ cycle consistency ', score);
  
  return Math.min(100, Math.max(0, score));
};
*/

/**
 * Calculate score for lifestyle factors (10% of total)
 */
/*
const calculateLifestyleScore = (dailyInsights : Partial<IDailyCycleInsights[]>) => {
  let score = 50; // Start with neutral score
  
  if (!dailyInsights || dailyInsights.length === 0) return score;
  
  // Look at mood patterns
  const moodCounts = {
    great: 0,
    good: 0, 
    relaxed: 0,
    happy: 0,
    irritable: 0,
    indifferent: 0
  };
  
  dailyInsights.forEach(day => {
    if (day && moodCounts.hasOwnProperty(day.mood)) {
      moodCounts[day.mood]++;
    }
  });
  
  // Calculate percentage of positive moods
  const totalMoodEntries = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
  const positiveMoods = moodCounts.great + moodCounts.good + moodCounts.relaxed + moodCounts.happy;
  
  if (totalMoodEntries > 0) {
    const positiveRatio = positiveMoods / totalMoodEntries;
    
    // Add points for positive mood states
    if (positiveRatio > 0.7) {
      score += 20; // Mostly positive
    } else if (positiveRatio > 0.5) {
      score += 10; // Somewhat positive
    } else if (positiveRatio < 0.3) {
      score -= 10; // Mostly negative
    }
  }
  
  // Look at symptoms that may indicate stress
  const hasStressSigns = dailyInsights.some(day => 
    day && day.symptoms && day.symptoms.includes(TSymptoms.headache) // 'headache'
  );
  
  if (hasStressSigns) {
    score -= 5; // Stress can impact fertility
  }

  console.log('8️⃣ life style score', score);
  
  return Math.min(100, Math.max(0, score));
};
*/


/**
 * Helper function to determine current cycle day
 */
/*
const getCurrentCycleDay = (dailyInsights : Partial<IDailyCycleInsights[]>, personalJourney : Partial<IPersonalizeJourney>) => {
  if (!personalJourney || !personalJourney.periodStartDate) return null;
  
  const today = new Date();
  const periodStartDate = new Date(personalJourney.periodStartDate);
  
  // Find days since period start
  const daysSincePeriodStart = Math.floor((today - periodStartDate) / (1000 * 60 * 60 * 24));
  
  // If menstrual period started more than a cycle length ago, find the most recent period start
  if (dailyInsights && dailyInsights.length > 0 && personalJourney.avgMenstrualCycleLength) {
    const avgCycleLength = personalJourney.avgMenstrualCycleLength;
    
    if (daysSincePeriodStart > Number(avgCycleLength)) {
      // Find most recent period start from daily insights
      const periodStartEntries = dailyInsights.filter(day => day && day.menstrualFlow &&
        day.menstrualFlow && day.menstrualFlow !== TMenstrualFlow.no //'none'
      ).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (periodStartEntries.length > 0) {
        const mostRecentPeriodStart = periodStartEntries[0] ? new Date(periodStartEntries[0].date) : null;
        return Math.floor((today - mostRecentPeriodStart) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
  }
  
  return daysSincePeriodStart + 1; // Adding 1 because day 1 is first day of period
}
*/


/**
 * Helper function to get cycle day for a specific date
 */
/*
const getCycleDayForDate = (date, personalJourney, dailyInsights) => {
  if (!personalJourney || !personalJourney.periodStartDate) return null;
  
  const checkDate = new Date(date);
  
  // First check if this date has a cycle day already recorded
  if (dailyInsights && dailyInsights.length > 0) {
    const matchingInsight = dailyInsights.find(insight => {
      const insightDate = new Date(insight.date);
      return insightDate.getDate() === checkDate.getDate() && 
             insightDate.getMonth() === checkDate.getMonth() && 
             insightDate.getFullYear() === checkDate.getFullYear();
    });
    
    if (matchingInsight && matchingInsight.cycleDay) {
      return matchingInsight.cycleDay;
    }
  }
  
  // If not found in insights, calculate based on period start date
  const periodStartDate = new Date(personalJourney.periodStartDate);
  
  // Calculate days since period start
  const daysSincePeriodStart = Math.floor((checkDate - periodStartDate) / (1000 * 60 * 60 * 24));
  
  // If this is from a previous cycle, try to find the most recent period start before this date
  if (daysSincePeriodStart < 0 && dailyInsights && dailyInsights.length > 0) {
    const periodStartsBeforeCheckDate = dailyInsights
      .filter(day => 
        day.menstrualFlow && 
        day.menstrualFlow !== 'no' && 
        new Date(day.date) < checkDate
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (periodStartsBeforeCheckDate.length > 0) {
      const mostRecentPeriodStart = new Date(periodStartsBeforeCheckDate[0].date);
      return Math.floor((checkDate - mostRecentPeriodStart) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    return null; // Can't determine cycle day for dates before first recorded period
  }
  
  // If we have cycle length and it's more than one cycle ago
  if (personalJourney.avgMenstrualCycleLength && 
      daysSincePeriodStart >= personalJourney.avgMenstrualCycleLength) {
    
    // Calculate how many complete cycles have passed
    const cycles = Math.floor(daysSincePeriodStart / personalJourney.avgMenstrualCycleLength);
    // Return the day within the current cycle
    return (daysSincePeriodStart % personalJourney.avgMenstrualCycleLength) + 1;
  }
  
  return daysSincePeriodStart + 1; // Adding 1 because day 1 is first day of period
};
*/

/**
 * Helper function to get cycle day for a specific date
 */
/*
const getCycleDayForDate_ = (date, personalJourney : Partial<IPersonalizeJourney>) => {
  if (!personalJourney || !personalJourney.periodStartDate) return null;
  
  const checkDate = new Date(date);
  const periodStartDate = new Date(personalJourney.periodStartDate);
  
  // Calculate days since period start
  const daysSincePeriodStart = Math.floor((checkDate - periodStartDate) / (1000 * 60 * 60 * 24));
  
  // If this is from a previous cycle, return null
  if (daysSincePeriodStart < 0) return null;
  
  // If we have cycle length and it's more than one cycle ago
  if (personalJourney.avgMenstrualCycleLength && 
      daysSincePeriodStart >= personalJourney.avgMenstrualCycleLength) {
    
    const cycles = Math.floor(daysSincePeriodStart / personalJourney.avgMenstrualCycleLength);
    return (daysSincePeriodStart % personalJourney.avgMenstrualCycleLength) + 1;
  }
  
  return daysSincePeriodStart + 1; // Adding 1 because day 1 is first day of period
};
*/