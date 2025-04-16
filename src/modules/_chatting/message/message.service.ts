import { GenericService } from "../../__Generic/generic.services";
import { IMessage } from "./message.interface";
import { Message } from "./message.model";

export class MessagerService extends GenericService<typeof Message, IMessage>{ /**typeof Message */
    constructor(){
        super(Message)
    }

    async getAllByConversationId(conversationId: string) {
        const object = await this.model.find({ conversationId});
        
        if (!object) {
          // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
          return null;
        }
        return object;
      }
    
}