import { executeParameterizedQuery } from '../utils/sql.util.js';

export const TeamModel = async () => {
  const createTeamQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='teams' AND xtype='U')
    CREATE TABLE teams (
      TeamId INT IDENTITY(1,1) PRIMARY KEY,
      TeamName NVARCHAR(255) NOT NULL,
      EventId INT NOT NULL,
      CreatedBy INT NOT NULL,
      CreatedAt DATETIME2 DEFAULT GETDATE(),

      FOREIGN KEY (EventId) REFERENCES events(EventID),
      FOREIGN KEY (CreatedBy) REFERENCES users(userid)
    )
  `;
  await executeParameterizedQuery(createTeamQuery);
};


export const TeamMemberModel = async () => {
    const createTeamMemberQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='team_members' AND xtype='U')
    CREATE TABLE team_members (
      MemberId INT IDENTITY(1,1) PRIMARY KEY,
      TeamId INT NOT NULL,
      UserId INT NOT NULL,
      Role NVARCHAR(50) CHECK (Role IN ('Leader', 'Member')),

      FOREIGN KEY (TeamId) REFERENCES teams(TeamId),
      FOREIGN KEY (UserId) REFERENCES users(userid)
    )
  `;
  await executeParameterizedQuery(createTeamMemberQuery);
};