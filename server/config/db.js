import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/job_portal';
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    try {
      await mongoose.connect(process.env.MONGODB_URI, options);

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        // MongoDB disconnected
      });

      mongoose.connection.on('reconnected', () => {
        // MongoDB reconnected
      });

      return true;
    } catch (mongoError) {
      if (mongoError.code === 'ECONNREFUSED') {
        console.error('❌ MongoDB server is not running!');
      }

      global.inMemoryData = {
        jobs: [],
        companies: [],
        users: [],
        applications: []
      };

      return false;
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);

    global.inMemoryData = {
      jobs: [],
      companies: [],
      users: [],
      applications: []
    };

    return false;
  }
};

export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const getDBStatus = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    usingInMemory: !mongoose.connection.readyState === 1 && global.inMemoryData
  };
};

export default connectDB;
