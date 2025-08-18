import mongoose from "mongoose";
import { Env } from "./env.config.js";

const DatabaseConnect = async () => {
  try {
    await mongoose.connect(Env.MONGO_URI);

    console.log(`Database connected successfully`);
  } catch (error) {
    console.error("Database connection failed:", error);
    
    // More specific error handling
    if (error instanceof mongoose.Error) {
      console.error("Mongoose error details:", error.message);
    }
    
    if (Env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log("Retrying database connection in 5 seconds...");
      setTimeout(() => DatabaseConnect(), 5000);
    }
  }
};

export default DatabaseConnect;