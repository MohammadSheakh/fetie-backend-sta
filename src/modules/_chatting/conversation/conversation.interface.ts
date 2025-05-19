import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { ConversationType } from './conversation.constant';
import { RoleType } from '../message/message.constant';

export interface IConversation {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  creatorId : Types.ObjectId;
  type: ConversationType.direct | ConversationType.group;
  //attachedToId? : String,
  //attachedToCategory? : 'TrainingProgram' | ''; // 🔗
  ///////////////////////////////////////
  month: string;
  year: number;
  title?: string;
  lastMessageSenderRole? : RoleType.bot | RoleType.user; //  Types.ObjectId 🔗
  
  ///////////////////////////////////////
  isDeleted? : boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // isGroup : boolean;  
}

export interface IConversationModel extends Model<IConversation> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IConversation>>;
}