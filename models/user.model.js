import { executeParameterizedQuery } from '../utils/sql.util.js';

export const UserModel = async () => {
  const createTableQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      userid INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      email NVARCHAR(255) UNIQUE NOT NULL,
      password NVARCHAR(255) NOT NULL,
      authprovider NVARCHAR(50) CHECK (authprovider IN ('email', 'google', 'github')) NOT NULL,
      role NVARCHAR(50) CHECK (role IN ('participant', 'organizer', 'judge')) NOT NULL,
      createdat DATETIME2 DEFAULT GETDATE()
    )
  `;
  
  return await executeParameterizedQuery(createTableQuery);
};
