import getEnv from "../utils/getEnv.util.js";


const envConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),

  PORT: getEnv("PORT", "8000"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  MONGO_URI: getEnv("MONGO_URI"),

  JWT_SECRET: getEnv("JWT_SECRET", "secert_jwt"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),

//   JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "secert_jwt_refresh"),
//   JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "7d") as string,

//   GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),

  // CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
  // CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
  // CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),

  SQL_USER: getEnv("SQL_USER"),
  SQL_PASS: getEnv("SQL_PASS"),
  SQL_SERVER: getEnv("SQL_SERVER"),
  SQL_DB: getEnv("SQL_DB"),


  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),
});

export const Env = envConfig();