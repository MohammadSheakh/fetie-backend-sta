import { GenericService } from '../../__Generic/generic.services';
import { IConversationParticipents } from './conversationParticipents.interface';
import { ConversationParticipents } from './conversationParticipents.model';

export class ConversationParticipentsService extends GenericService<
  typeof ConversationParticipents, IConversationParticipents
> {
  constructor() {
    super(ConversationParticipents);
  }

  async getByUserIdAndConversationId(userId: string, conversationId: string) {
    const object = await this.model.find({ userId , conversationId});
    
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  async getByConversationId(conversationId: any) {
    const object = await this.model.find({ conversationId });
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  // async getByUserId(userId: any) {
  //   const object = await this.model.find({ userId });
  //   if (!object) {
  //     // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
  //     return null;
  //   }
  //   return object;
  // }
}
