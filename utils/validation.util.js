import { executeParameterizedQuery } from './sql.util.js';

export const validateUserExists = async (userId) => {
  const query = `SELECT COUNT(*) as count FROM users WHERE userid = @userId`;
  const result = await executeParameterizedQuery(query, { userId });
  return result.recordset[0].count > 0;
};

export const validateEventExists = async (eventId) => {
  const query = `SELECT COUNT(*) as count FROM events WHERE eventid = @eventId`;
  const result = await executeParameterizedQuery(query, { eventId });
  return result.recordset[0].count > 0;
};

export const validateTeamExists = async (teamId) => {
  const query = `SELECT COUNT(*) as count FROM teams WHERE teamid = @teamId`;
  const result = await executeParameterizedQuery(query, { teamId });
  return result.recordset[0].count > 0;
};

export const validateReferences = async (data) => {
  const errors = [];
  
  if (data.userId && !(await validateUserExists(data.userId))) {
    errors.push(`User with ID ${data.userId} does not exist`);
  }
  
  if (data.eventId && !(await validateEventExists(data.eventId))) {
    errors.push(`Event with ID ${data.eventId} does not exist`);
  }
  
  if (data.teamId && !(await validateTeamExists(data.teamId))) {
    errors.push(`Team with ID ${data.teamId} does not exist`);
  }
  
  return errors;
};
