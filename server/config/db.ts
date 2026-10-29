import mongoose from "mongoose";

const DEFAULT_URI = "mongodb+srv://ubhideep79_db_user:ubhideep79_db_password@cluster0.sieqopd.mongodb.net/waste-not?retryWrites=true&w=majority";

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.error("[Database] MongoDB connection error:", error.message);
    // Throw so caller knows, but allow retries
    throw error;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
