import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions } from '../../types/paginate';
import { Model, Mongoose } from 'mongoose';

export class GenericService<  ModelType , InterfaceType> {
  model: ModelType | any;  // TODO : any add korar pore check korte hobe .. 

  constructor(model: ModelType ) {
    this.model = model;
  }

  async create(data:InterfaceType) : Promise<InterfaceType> {
    // | null
    // console.log('req.body from generic create 🧪🧪', data);    
    return await this.model.create(data);
  }

  async getAll() {
    return await this.model.find({isDeleted : false}).select('-__v');
  }
  
  async getAllWithPagination(
    filters: any, // Partial<INotification> // FixMe : fix type
    options: PaginateOptions
  ) {

    console.log('filters from generic service 🧪🧪', filters);
    console.log('options from generic service 🧪🧪', options);

    const result = await this.model.paginate(filters, options);

    /*
    const result = await this.model.paginate(
       filters, // ISSUE :  may be issue thakte pare .. Test korte hobe .. 
      { ...filters, isDeleted : false },
      options);
    */
    return result;
  }

  async getById(id: string) : Promise<InterfaceType | null> {
    const object = await this.model.findById(id);
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  async updateById(id: string, data: InterfaceType) {
    const object = await this.model.findById(id).select('-__v');
    if (!object) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No Object Found');
      //   return null;
    }

    return await this.model.findByIdAndUpdate(id, data, { new: true }).select('-__v');
  }

  async deleteById(id: string) {
    return await this.model.findByIdAndDelete(id).select('-__v');
  }

  // TODO :  eta kothao call kora hoy nai ba eta niye kaj kora hoy nai .. 
  async aggregate(pipeline: any[]) {
    return await this.model.aggregate(pipeline);
  }

  async softDeleteById(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }
}
