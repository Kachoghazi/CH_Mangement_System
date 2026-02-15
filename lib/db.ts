import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: 'ch-management-system',
      bufferCommands: true,
      maxPoolSize: 10,
    };
    mongoose
      .connect(MONGO_URI, opts)
      .then((mongoose) => {
        cached.conn = mongoose.connection;
        console.log('MongoDB connected successfully');
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}
