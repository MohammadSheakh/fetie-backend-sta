import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { Roles } from '../../middlewares/roles';
import {AttachmentType, AttachedToType } from './attachment.constant';

// FIX  // TODO : joto jaygay role ase .. role gula check dite hobe .. 
export interface IAttachment {
  _id?: Types.ObjectId;
  attachment: string;
  attachmentType: AttachmentType.image | AttachmentType.document 
   | AttachmentType.unknown;

  attachedToType: 
    AttachedToType.lab|
    AttachedToType.user;

  attachedToId?: string;
  uploadedByUserId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttachmentModel extends Model<IAttachment> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IAttachment>>;
}