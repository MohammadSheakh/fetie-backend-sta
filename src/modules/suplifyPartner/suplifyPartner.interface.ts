import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { SuplifyPartnerCategory } from './suplifyPartner.constant';

export interface ISuplifyPartner {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  category?:  SuplifyPartnerCategory.gym | 
  SuplifyPartnerCategory.healthStore | SuplifyPartnerCategory.wellnessCenter ; // Enum for task status
  partnerName?: string; // Optional field, user assignment
  attachments: Types.ObjectId[]; // Array of ObjectId references to Attachment
  description: string; // Required field for task description
  location : {
    locationName : string;
    latitude: string;
    longitude: string;
  }
  isDeleted : boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISuplifyPartnerModel extends Model<ISuplifyPartner> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISuplifyPartner>>;
}