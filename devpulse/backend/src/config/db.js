const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set. Add it to your environment variables.');
  }

  try {
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      bufferCommands: false,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to MongoMemoryServer for development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, {
          bufferCommands: false,
        });
        console.log(`MongoDB connected to In-Memory Database: ${mongoUri}`);
      } catch (fallbackErr) {
        console.error('Fallback MongoMemoryServer failed:', fallbackErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
}

module.exports = connectDB;
