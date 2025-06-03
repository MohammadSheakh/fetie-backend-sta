import { isValid, parse } from "date-fns";
import { DailyCycleInsightsService } from "../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service";
import { PersonalizedJourneyService } from "../_personalizeJourney/personalizeJourney/personalizeJourney.service";
import { UserService } from "../user/user.service";

const dummyServiceToHitAnotherApi = async (message: string) => {
  const response = await fetch('https://url.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error from OpenAI API: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const dateParse = async (userMessage: string, userId: string) => {

  let dailyCycleInsightService = new DailyCycleInsightsService();
  let personalizeJourneyService = new PersonalizedJourneyService();

// Date parsing logic
    let dateObj;
    const dateRegex = /(\d{1,2})[-\/\s](\d{1,2})[-\/\s](\d{2,4})|(\d{1,2})\s([a-zA-Z]+)(\s(\d{4}))?/;
    const match = userMessage.match(dateRegex);

    if (match) {
      // Handle numeric format like 6-05-2025 or 5/6/2025
      if (match[1] && match[2] && match[3]) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearStr = match[3];
        const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

        // Construct the date string as yyyy-MM-dd
        const dateString = `${year}-${month < 10 ? '0' + month : month}-${
          day < 10 ? '0' + day : day
        }`;

        console.log('dateString 📅:', dateString);
        dateObj = new Date(dateString);
      }
      // Handle natural language dates like "5 March 2025"
      else if (match[4] && match[5]) {
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
          dateObj = new Date();
        }
      }
    } else {
      console.log('📅 No date detected, using current date');
      dateObj = new Date();
    }

    console.log('dateObj 📢', dateObj);

    // Fetch user data
    const [insights, allInsights, personalizedJourney, userProfileData] = await Promise.all([
     
      dailyCycleInsightService.getByDateAndUserId(dateObj, userId),
      dailyCycleInsightService.getByUserId(userId),
      
      personalizeJourneyService.getByUserId(userId),
      UserService.getMyProfile(userId),
    ]);

    // Build system prompt
    const systemPrompt = `You are a friendly reproductive health assistant.
      Based on user's cycle, lab tests, and daily logs, provide helpful responses.
      Be empathetic, short, and encouraging. and give answer strictly based on users last message

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
      - trackOvulationBy: ${personalizedJourney?.trackOvulationBy || 'N/A'}
      - doYouHavePain: ${personalizedJourney?.doYouHavePain || 'N/A'}
      - expectedNextPeriodStartDate: ${personalizedJourney?.expectedPeriodStartDate || 'N/A'}
      - predictedOvulationDate: ${personalizedJourney?.predictedOvulationDate || 'N/A'}

      ----- in Daily cycle Insights Collection
      - menstrualFlow: ${insights?.menstrualFlow || 'N/A'}
      - mood: ${insights?.mood || 'N/A'}
      - activity: ${insights?.activity || 'N/A'}
      - symptoms: ${insights?.symptoms || 'N/A'}
      - phase: ${insights?.phase || 'N/A'}
      - fertilityLevel: ${insights?.fertilityLevel || 'N/A'}
      - cycleDay: ${insights?.cycleDay || 'N/A'}
      - cervicalMucus: ${insights?.cervicalMucus || 'N/A'}

      
      - allInsights: ${JSON.stringify(allInsights) || 'N/A'}

      ----- User Data 
      - name: ${userProfileData?.name || 'N/A'}
      - email: ${userProfileData?.email || 'N/A'}
      - role: ${userProfileData?.role || 'N/A'}
      - subscriptionType: ${userProfileData?.subscriptionType || 'N/A'}
      - phoneNumber: ${userProfileData?.phoneNumber || 'N/A'}
      - lastPasswordChangeDate: ${userProfileData?.lastPasswordChange || 'N/A'}

    `;

     
    // - labTestLog: ${JSON.stringify(insights?.labTestLogId) || 'N/A'}

    return systemPrompt;
}

export const ChatBotService = {
  dummyServiceToHitAnotherApi,
  dateParse
}