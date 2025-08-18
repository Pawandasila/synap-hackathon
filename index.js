import "dotenv/config";
import express from "express";

import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { Env } from "./config/env.config.js";
import { AsyncHandler } from "./middlewares/AsyncHandler.middleware.js";
import { HTTPSTATUS } from "./config/Https.config.js";
import { ErrorHandler } from "./middlewares/ErrorHandler.middleware.js";
import DatabaseConnect from "./config/database.config.js";
import poolPromise from "./config/sql.config.js";
// import UserRoute from "./routes/user.routes.js";

const app = express();

const BASE_PATH = Env.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000', 
      Env.FRONTEND_ORIGIN
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(helmet({
    crossOriginResourcePolicy: false
}));


app.get(
  "/",
  AsyncHandler(async (req, res, next) => {
    const date = new Date();
    
    try {
      // Get the connection pool
      const pool = await poolPromise;
      
      // Query to get all tables in the database
      const tablesQuery = `
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME,
          TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;
      
      const tablesResult = await pool.request().query(tablesQuery);
      
      // Query to get database info
      const dbInfoQuery = `
        SELECT 
          DB_NAME() as DatabaseName,
          @@VERSION as SQLServerVersion,
          GETDATE() as CurrentTime
      `;
      
      const dbInfoResult = await pool.request().query(dbInfoQuery);

      res.status(HTTPSTATUS.OK).json({
        message: "Azure SQL Database Connection Test",
        status: "✅ Connected Successfully",
        date,
        databaseInfo: dbInfoResult.recordset[0],
        tables: {
          count: tablesResult.recordset.length,
          list: tablesResult.recordset
        }
      });
    } catch (error) {
      console.error('Database connection test failed:', error);
      
      res.status(HTTPSTATUS.OK).json({
        message: "Azure SQL Database Connection Test",
        status: "❌ Connection Failed",
        date,
        error: {
          message: error.message,
          code: error.code || 'Unknown'
        },
        fallback: "Hello World - Database connection unavailable"
      });
    }
  })
);

// app.use(`${BASE_PATH}/v1/users`, UserRoute);
// app.use(`${BASE_PATH}/v1/users`, UserRoute);

app.use(ErrorHandler);

// Initialize database connection
const initializeApp = async () => {
  try {
    await DatabaseConnect();
    await poolPromise;
    console.log(`Database connected in ${Env.NODE_ENV} mode.`);
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

app.listen(Env.PORT, async () => {
  await initializeApp();
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});


export default app;