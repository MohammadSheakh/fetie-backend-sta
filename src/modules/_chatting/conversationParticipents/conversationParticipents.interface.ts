import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { RoleType } from './conversationParticipents.constant';

export interface IConversationParticipents {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  conversationId: Types.ObjectId;
  joinedAt : Date;
  role :  RoleType.bot | RoleType.user;
  isDeleted : boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConversationParticipentsModel extends Model<IConversationParticipents> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IConversationParticipents>>;
}