import { model, Schema } from 'mongoose';
import paginate from '../../common/plugins/paginate';
import { IFertie, IFertieModel } from './fertie.interface';


const fertieSchema = new Schema<IFertie>(
  {
    
  },
  { timestamps: true }
);

fertieSchema.plugin(paginate);

fertieSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  // this.renewalFee = this.initialFee
  
  next();
});

// Use transform to rename _id to _projectId
fertieSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._fertieId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

export const Fertie = model<IFertie, IFertieModel>(
  'Fertie',
  fertieSchema
);
