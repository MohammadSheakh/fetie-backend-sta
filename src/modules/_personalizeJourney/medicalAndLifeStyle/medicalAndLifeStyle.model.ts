import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IMedicalAndLifeStyle, IMedicalAndLifeStyleModel } from './medicalAndLifeStyle.interface';

const medicalAndLifeStyleSchema = new Schema<IMedicalAndLifeStyle>(
  {
    medicalConditionsOrSergeriesDetails : {
      type : String,
      required : [true, 'medicalConditionsOrSergeriesDetails is required'],
    },
    medicationAndSuplimentsDetails : {
      type : String,
      required : [true, 'medicationAndSuplimentsDetails is required'],
    },
    anyHistoryOfStdOrPelvicInfection: {
      type : Boolean,
      required : [true, 'anyHistoryOfStdOrPelvicInfection is required'],
      default : false
    },
    doYouSmokeDrink : {
      type : Boolean,
      required : [true, 'doYouSmokeDrink is required'],
      default : false
    },
    anyFamilyHealthConditionLegacy : {
      type : String,
      required : [true, 'anyFamilyHealthConditionLegacy is required'],
    },
    wantToSharePartnersHeathInfo : {
      type : String,
      required : [true, 'wantToSharePartnersHeathInfo is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

medicalAndLifeStyleSchema.plugin(paginate);

medicalAndLifeStyleSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
medicalAndLifeStyleSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._medicalAndLifeStyleId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const MedicalAndLifeStyle = model<IMedicalAndLifeStyle, IMedicalAndLifeStyleModel>(
  'MedicalAndLifeStyle',
  medicalAndLifeStyleSchema
);
