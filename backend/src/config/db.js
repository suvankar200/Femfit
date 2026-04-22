import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in .env');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // 10s timeout to find server
    socketTimeoutMS: 45000,          // 45s timeout for operations
  });

  isConnected = true;
  console.log(`✅ MongoDB Atlas connected: ${mongoose.connection.host}`);

  // Handle disconnection gracefully
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Reconnecting...');
    isConnected = false;
  });
};
