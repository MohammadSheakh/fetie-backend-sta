import { config } from './index';
import mongoose from 'mongoose';

const connectToDb = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.database.mongoUrl as string,{
        serverSelectionTimeoutMS: 30000,  // increase server selection timeout
        socketTimeoutMS: 45000,  // increase socket timeout
    });
  }
};

export default connectToDb;