import { executeParameterizedQuery } from '../utils/sql.util.js';

export const EventModel = async () => {
  const createEventQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='events' AND xtype='U')
    CREATE TABLE events (
      EventID INT IDENTITY(1,1) PRIMARY KEY,
      OrganizerID INT NOT NULL,
      Name NVARCHAR(255) NOT NULL,
      Description NVARCHAR(MAX),
      Theme NVARCHAR(255),
      Mode NVARCHAR(50) CHECK (Mode IN ('Online', 'Offline')),
      StartDate DATETIME2 NOT NULL,
      EndDate DATETIME2 NOT NULL,
      SubmissionDeadline DATETIME2,
      ResultDate DATETIME2,
      Rules NVARCHAR(MAX),
      Timeline NVARCHAR(MAX),
      Tracks NVARCHAR(MAX),
      Prizes NVARCHAR(MAX),
      MaxTeamSize INT,
      Sponsors NVARCHAR(MAX),
      IsActive BIT DEFAULT 1,
      CreatedAt DATETIME2 DEFAULT GETDATE(),
      
      FOREIGN KEY (OrganizerID) REFERENCES users(userid)
    )
  `;
  await executeParameterizedQuery(createEventQuery);
};
