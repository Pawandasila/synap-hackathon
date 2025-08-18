import { executeParameterizedQuery } from '../utils/sql.util.js';

// Event Enrollments Table - for individual participant enrollments
export const EventEnrollmentModel = async () => {
  const createEnrollmentQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='event_enrollments' AND xtype='U')
    CREATE TABLE event_enrollments (
      EnrollmentID INT IDENTITY(1,1) PRIMARY KEY,
      EventID INT NOT NULL,
      UserID INT NOT NULL,
      EnrollmentDate DATETIME2 DEFAULT GETDATE(),
      Status NVARCHAR(20) CHECK (Status IN ('Enrolled', 'Cancelled', 'Waitlisted')) DEFAULT 'Enrolled',
      TeamID INT NULL, -- Optional: if user later joins a team
      
      FOREIGN KEY (EventID) REFERENCES events(EventID),
      FOREIGN KEY (UserID) REFERENCES users(userid),
      FOREIGN KEY (TeamID) REFERENCES teams(TeamId),
      UNIQUE(EventID, UserID) -- One enrollment per user per event
    )
  `;
  await executeParameterizedQuery(createEnrollmentQuery);
};
