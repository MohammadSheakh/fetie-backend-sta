import OpenAI from 'openai';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { PaginateOptions } from '../../types/paginate';
import { FertieService } from '../fertie/fertie.service';
import { differenceInDays } from 'date-fns';

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, //OPENAI_API_KEY // OPENROUTER_API_KEY
  // baseURL: 'https://openrouter.ai/api/v1',
  baseURL: 'https://api.openai.com/v1'
});

const addNotification = async (
  payload: INotification
): Promise<INotification> => {
  // Save the notification to the database
  const result = await Notification.create(payload);
  return result;
};


 const sendNotificationByChatGpt = async (userId : string, currentDate: Date): Promise<void> => {
    // Generate notification from chatgpt ... 

    // first we need to get the users current months all information .. 
    // like ⚡predictedPeriodStart ⚡ predictedPeriodEnd
    // ⚡ predictedOvulationDate ⚡ fertileWindow

    let data:any = await new FertieService().predictAllDates(userId);

    console.log('data from predictAllDates 🟢in sendNotificationByChatGpt🟢 : ', data);

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
  
    console.log('periodEvent :::::::::::: ', periodEvent);

    
    const periodStartDate = periodEvent.predictedPeriodStart//.split('T')[0];

    let cycleDay = differenceInDays(currentDate, periodStartDate) + 1; // 🔰 req.body.date e hocche current date
  
    // 🔴🔴  Date.now() e shomossha thakte pare .. new Date()
    /**
     * now we have information like 
     * periodEvent {
     *   predictedPeriodStart
     *   predictedPeriodEnd
     *   predictedOvulationDate 
     *   fertileWindow [ Date , Date ]
     * }
     * 
     * and cycleDay .. 
     */

    // Build system prompt
    const systemPrompt = `You are a friendly reproductive health assistant Named Fertie.
      Based on current months different dates like predictedPeriodStart, predictedPeriodEnd, 
      predictedOvulationDate, fertileWindow, cycleDay
      provide notification if current date matched with any of those date.

      Data available: 

      - PeriodStartDate: ${periodEvent.predictedPeriodStart || 'N/A'}
      - PeriodEndDate: ${periodEvent.predictedPeriodEnd || 'N/A'}
      - predictedOvulationDate: ${periodEvent.predictedOvulationDate || 'N/A'}
      - fertileWindow: ${periodEvent.fertileWindow || 'N/A'}
      - cycleDay: ${cycleDay || 'N/A'}
      - currentDate: ${currentDate || 'N/A'} 

      -------------- Now generate notification title and subtitle .. if current date matched with any of those date --------------
  
      ---------------------------
      if any date matched give me notification response like {
        "title" : "notification title here!",
        "subTitle" : "notification subTitle here!"
      }

      -------------------------
      if no date matched give me response like {
        "title" : "Hey! Don’t forget to check your cycle insights today!",
        "subTitle" : "Remainder"
      }
    `;
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
          let newAIGeneratedNotification;
          let allNotificaiton;
          let jsonResponse;
          try {
            // First, try to parse the response directly
            jsonResponse = JSON.parse(responseText);

            //-------------- we have to save this response to notification database .. 
                // and first we have to check if todays notification already generated or not
                // and if todays notification is not found in database .. then ai will generate new notification
                // for today and save it to database ..

            console.log("🟢 No AI Generated Notification found for today ... Lets generate ... 🤖");

            newAIGeneratedNotification = await Notification.create({
              title: jsonResponse.title,
              subTitle: jsonResponse.subTitle,
              receiverId: userId,
            })

            allNotificaiton = await Notification.find({
              receiverId: userId,
            });


            console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);
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

                //-------------- we have to save this response to notification database .. 
                // and first we have to check if todays notification already generated or not
                // and if todays notification is not found in database .. then ai will generate new notification
                // for today and save it to database ..


                console.log("🟢No AI Generated Notification found for today ... Lets generate ... 🤖");

                newAIGeneratedNotification = await Notification.create({
                  title: jsonResponse.title,
                  subTitle: jsonResponse.subTitle,
                  receiverId: userId,
                })

                allNotificaiton = await Notification.find({
                  receiverId: userId,
                });

                console.log("jsonResponse 🟢🟢🟢 :", jsonResponse);

                //----------------------------------------------------------------------------------
              } catch (extractError) {
                console.error('Failed to extract valid JSON:', extractError);
                jsonResponse = {
                  suggestion: "Failed to parse AI response. Please try again.",
                };
              }
            } else {
              // Fallback to a structured response if parsing fails
              jsonResponse = {
                suggestion: responseText.substring(0, 200) + "...",
                patternFertieNoticed: "Unable to parse the complete response",
                whatToKeepInMindInThisCycle: "Please try again later"
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

    //////////////////////////////////////////////////////       
  }



const getALLNotification = async (
  filters: Partial<INotification>,
  options: PaginateOptions,
  userId: string
) => {
  filters.receiverId = userId;
  const unViewNotificationCount = await Notification.countDocuments({
    receiverId: userId,
    viewStatus: false,
  });

  const result = await Notification.paginate(filters, options);
  return { ...result, unViewNotificationCount };
};
/*
const getAdminNotifications = async (
  filters: Partial<INotification>,
  options: PaginateOptions
): Promise<PaginateResult<INotification>> => {
  filters.role = 'admin'; // Important SQL
  return Notification.paginate(filters, options);
};

const getSingleNotification = async (
  notificationId: string
): Promise<INotification | null> => {
  const result = await Notification.findById(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

const addCustomNotification = async (
  eventName: string,
  notifications: INotification,
  userId?: string
) => {
  const messageEvent = `${eventName}::${userId}`;
  const result = await addNotification(notifications);

  if (eventName === 'admin-notification' && notifications.role === 'admin') {
    //@ts-ignore
    io.emit('admin-notification', {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  } else {
    //@ts-ignore
    io.emit(messageEvent, {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  }
  return result;
};

const viewNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndUpdate(
    notificationId,
    { viewStatus: true },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};
*/

/* /// Written by Sheakh

// Test korte hobe .. 
const deleteNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndDelete(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

// Test korte hobe ... 
const clearAllNotification = async (userId: string) => {
  const user = await User.findById(userId);
  if (user?.role === 'projectManager') {
    const result = await Notification.deleteMany({ role: 'projectManager' });
    return result;
  }
  const result = await Notification.deleteMany({ receiverId: userId });
  return result;
};

*/
export const NotificationService = {
  addNotification,
  getALLNotification,
  sendNotificationByChatGpt
  // getAdminNotifications,
  // getSingleNotification,
  // addCustomNotification,
  // viewNotification,
  // deleteNotification,
  // clearAllNotification,
};
