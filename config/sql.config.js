import sql from 'mssql';
import { Env } from './env.config.js';

const config = {
  user: Env.SQL_USER,
  password: Env.SQL_PASS,
  server: Env.SQL_SERVER,
  database: Env.SQL_DB,
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true, // Set to true for Azure SQL
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 60000,
  requestTimeout: 60000,
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL DB Connection Failed: ', err.message);
    console.error('Connection details:', {
      server: config.server,
      database: config.database,
      user: config.user
    });
    throw err;
  });

export default poolPromise;