import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import { TeamMemberModel, TeamModel } from "../models/team.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";

export const initializeTeamTable = async () => {
  try {
    await TeamModel();
    await TeamMemberModel();
    console.log("✅ Teams table initialized successfully");
    console.log("✅ Team Members table initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize teams table:", error);
    throw error;
  }
};

export const createTeam = AsyncHandler(async (req, res) => {
  const { teamName, eventId } = req.body;
  const userId = req.user.userid;

  if (!teamName || !eventId) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Team name and event ID are required",
    });
  }

  const eventCheck = `SELECT COUNT(*) as count FROM events WHERE EventID = @eventId AND IsActive = 1`;
  const eventExists = await executeParameterizedQuery(eventCheck, { eventId });

  if (eventExists.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Event not found or inactive",
    });
  }

  const existingTeamCheck = `
        SELECT COUNT(*) as count FROM teams t
        INNER JOIN team_members tm ON t.TeamId = tm.TeamId
        WHERE t.EventId = @eventId AND tm.UserId = @userId
    `;
  const hasTeam = await executeParameterizedQuery(existingTeamCheck, {
    eventId,
    userId,
  });

  if (hasTeam.recordset[0].count > 0) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: "You are already part of a team for this event",
    });
  }

  const teamNameCheck = `SELECT COUNT(*) as count FROM teams WHERE TeamName = @teamName AND EventId = @eventId`;
  const nameExists = await executeParameterizedQuery(teamNameCheck, {
    teamName,
    eventId,
  });

  if (nameExists.recordset[0].count > 0) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: "Team name already exists for this event",
    });
  }

  const createTeamQuery = `
        INSERT INTO teams (TeamName, EventId, CreatedBy)
        OUTPUT INSERTED.*
        VALUES (@teamName, @eventId, @userId)
    `;

  const teamResult = await executeParameterizedQuery(createTeamQuery, {
    teamName,
    eventId,
    userId,
  });
  const newTeam = teamResult.recordset[0];

  const addLeaderQuery = `
        INSERT INTO team_members (TeamId, UserId, Role)
        VALUES (@teamId, @userId, 'Leader')
    `;

  await executeParameterizedQuery(addLeaderQuery, {
    teamId: newTeam.TeamId,
    userId,
  });

  const updateEnrollmentQuery = `
        UPDATE event_enrollments 
        SET TeamID = @teamId
        WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    `;
  
  await executeParameterizedQuery(updateEnrollmentQuery, {
    teamId: newTeam.TeamId,
    eventId,
    userId,
  });

  return res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Team created successfully",
    data: newTeam,
  });
});

export const joinTeam = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.userid;

  const teamIdNum = parseInt(teamId);
  if (isNaN(teamIdNum) || teamIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID",
    });
  }

  const teamCheck = `SELECT EventId, TeamName FROM teams WHERE TeamId = @teamId`;
  const teamExists = await executeParameterizedQuery(teamCheck, {
    teamId: teamIdNum,
  });

  if (teamExists.recordset.length === 0) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Team not found",
    });
  }

  const eventId = teamExists.recordset[0].EventId;

  const existingTeamCheck = `
        SELECT COUNT(*) as count FROM teams t
        INNER JOIN team_members tm ON t.TeamId = tm.TeamId
        WHERE t.EventId = @eventId AND tm.UserId = @userId
    `;
  const hasTeam = await executeParameterizedQuery(existingTeamCheck, {
    eventId,
    userId,
  });

  if (hasTeam.recordset[0].count > 0) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: "You are already part of a team for this event",
    });
  }

  const teamSizeCheck = `
        SELECT COUNT(*) as count FROM team_members WHERE TeamId = @teamId
    `;
  const currentSize = await executeParameterizedQuery(teamSizeCheck, {
    teamId: teamIdNum,
  });

  const maxSizeCheck = `SELECT MaxTeamSize FROM events WHERE EventID = @eventId`;
  const maxSizeResult = await executeParameterizedQuery(maxSizeCheck, {
    eventId,
  });
  const maxTeamSize = maxSizeResult.recordset[0].MaxTeamSize;

  if (maxTeamSize && currentSize.recordset[0].count >= maxTeamSize) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: `Team is full. Maximum team size is ${maxTeamSize}`,
    });
  }

  const joinTeamQuery = `
        INSERT INTO team_members (TeamId, UserId, Role)
        VALUES (@teamId, @userId, 'Member')
    `;

  await executeParameterizedQuery(joinTeamQuery, { teamId: teamIdNum, userId });

  // Update user's enrollment to link with the joined team
  const updateEnrollmentQuery = `
        UPDATE event_enrollments 
        SET TeamID = @teamId
        WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    `;
  
  await executeParameterizedQuery(updateEnrollmentQuery, {
    teamId: teamIdNum,
    eventId,
    userId,
  });

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Successfully joined the team",
  });
});

export const leaveTeam = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.userid;

  const teamIdNum = parseInt(teamId);
  if (isNaN(teamIdNum) || teamIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID",
    });
  }

  const memberCheck = `SELECT Role FROM team_members WHERE TeamId = @teamId AND UserId = @userId`;
  const memberExists = await executeParameterizedQuery(memberCheck, {
    teamId: teamIdNum,
    userId,
  });

  if (memberExists.recordset.length === 0) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "You are not a member of this team",
    });
  }

  const userRole = memberExists.recordset[0].Role;

  if (userRole === "Leader") {
    const otherMembersCheck = `
            SELECT COUNT(*) as count FROM team_members 
            WHERE TeamId = @teamId AND UserId != @userId
        `;
    const otherMembers = await executeParameterizedQuery(otherMembersCheck, {
      teamId: teamIdNum,
      userId,
    });

    if (otherMembers.recordset[0].count > 0) {
      return res.status(HTTPSTATUS.CONFLICT).json({
        success: false,
        message:
          "Team leader cannot leave while there are other members. Transfer leadership or remove all members first.",
      });
    }
  }

  const leaveQuery = `DELETE FROM team_members WHERE TeamId = @teamId AND UserId = @userId`;
  await executeParameterizedQuery(leaveQuery, { teamId: teamIdNum, userId });

  // Get event ID to update enrollment
  const getEventQuery = `SELECT EventId FROM teams WHERE TeamId = @teamId`;
  const eventResult = await executeParameterizedQuery(getEventQuery, { teamId: teamIdNum });
  
  if (eventResult.recordset.length > 0) {
    const eventId = eventResult.recordset[0].EventId;
    
    // Remove team association from enrollment
    const updateEnrollmentQuery = `
          UPDATE event_enrollments 
          SET TeamID = NULL
          WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
      `;
    
    await executeParameterizedQuery(updateEnrollmentQuery, {
      eventId,
      userId,
    });
  }

  if (userRole === "Leader") {
    // Update all team members' enrollments before deleting team
    if (eventResult.recordset.length > 0) {
      const eventId = eventResult.recordset[0].EventId;
      
      const updateAllEnrollmentsQuery = `
            UPDATE event_enrollments 
            SET TeamID = NULL
            WHERE TeamID = @teamId AND Status = 'Enrolled'
        `;
      
      await executeParameterizedQuery(updateAllEnrollmentsQuery, { teamId: teamIdNum });
    }

    const deleteTeamQuery = `DELETE FROM teams WHERE TeamId = @teamId`;
    await executeParameterizedQuery(deleteTeamQuery, { teamId: teamIdNum });

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Team disbanded as leader left",
    });
  }

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Successfully left the team",
  });
});

export const getTeamById = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const teamIdNum = parseInt(teamId);
  if (isNaN(teamIdNum) || teamIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID",
    });
  }

  const teamQuery = `
        SELECT 
            t.TeamId,
            t.TeamName,
            t.EventId,
            t.CreatedBy,
            t.CreatedAt,
            e.Name as EventName,
            e.MaxTeamSize
        FROM teams t
        INNER JOIN events e ON t.EventId = e.EventID
        WHERE t.TeamId = @teamId
    `;

  const teamResult = await executeParameterizedQuery(teamQuery, {
    teamId: teamIdNum,
  });

  if (teamResult.recordset.length === 0) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Team not found",
    });
  }

  const team = teamResult.recordset[0];

  const membersQuery = `
        SELECT 
            tm.Role,
            u.userid,
            u.name,
            u.email
        FROM team_members tm
        INNER JOIN users u ON tm.UserId = u.userid
        WHERE tm.TeamId = @teamId
        ORDER BY 
            CASE WHEN tm.Role = 'Leader' THEN 1 ELSE 2 END,
            u.name
    `;

  const membersResult = await executeParameterizedQuery(membersQuery, {
    teamId: teamIdNum,
  });

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Team details retrieved successfully",
    data: {
      ...team,
      members: membersResult.recordset,
      memberCount: membersResult.recordset.length,
    },
  });
});

export const getTeamsByEvent = AsyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const eventIdNum = parseInt(eventId);
  if (isNaN(eventIdNum) || eventIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid event ID",
    });
  }

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid pagination parameters",
    });
  }

  const countQuery = `SELECT COUNT(*) as total FROM teams WHERE EventId = @eventId`;
  const countResult = await executeParameterizedQuery(countQuery, {
    eventId: eventIdNum,
  });
  const totalTeams = countResult.recordset[0].total;

  const teamsQuery = `
        SELECT 
            t.TeamId,
            t.TeamName,
            t.CreatedBy,
            t.CreatedAt,
            COUNT(tm.MemberId) as MemberCount,
            u.name as CreatedByName,
            u.email as CreatedByEmail
        FROM teams t
        LEFT JOIN team_members tm ON t.TeamId = tm.TeamId
        INNER JOIN users u ON t.CreatedBy = u.userid
        WHERE t.EventId = @eventId
        GROUP BY t.TeamId, t.TeamName, t.CreatedBy, t.CreatedAt, u.name, u.email
        ORDER BY t.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
    `;

  const teamsResult = await executeParameterizedQuery(teamsQuery, {
    eventId: eventIdNum,
    offset,
    limit,
  });

  const teamsWithMembers = await Promise.all(
    teamsResult.recordset.map(async (team) => {
      const membersQuery = `
        SELECT 
          tm.Role,
          u.userid,
          u.name,
          u.email
        FROM team_members tm
        INNER JOIN users u ON tm.UserId = u.userid
        WHERE tm.TeamId = @teamId
        ORDER BY 
          CASE WHEN tm.Role = 'Leader' THEN 1 ELSE 2 END,
          u.name
      `;

      const membersResult = await executeParameterizedQuery(membersQuery, {
        teamId: team.TeamId,
      });

      return {
        ...team,
        members: membersResult.recordset,
        memberDetails: {
          total: membersResult.recordset.length,
          leaders: membersResult.recordset.filter((m) => m.Role === "Leader")
            .length,
          members: membersResult.recordset.filter((m) => m.Role === "Member")
            .length,
        },
      };
    })
  );

  const totalPages = Math.ceil(totalTeams / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Teams retrieved successfully",
    data: teamsWithMembers,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalTeams: totalTeams,
      teamsPerPage: limit,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  });
});

export const getUserTeams = AsyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const userTeamsQuery = `
        SELECT 
            t.TeamId,
            t.TeamName,
            t.EventId,
            t.CreatedAt,
            tm.Role,
            e.Name as EventName,
            e.StartDate,
            e.EndDate,
            e.MaxTeamSize,
            COUNT(tm2.MemberId) as MemberCount
        FROM teams t
        INNER JOIN team_members tm ON t.TeamId = tm.TeamId
        INNER JOIN events e ON t.EventId = e.EventID
        LEFT JOIN team_members tm2 ON t.TeamId = tm2.TeamId
        WHERE tm.UserId = @userId AND e.IsActive = 1
        GROUP BY t.TeamId, t.TeamName, t.EventId, t.CreatedAt, tm.Role, e.Name, e.StartDate, e.EndDate, e.MaxTeamSize
        ORDER BY t.CreatedAt DESC
    `;

  const teamsResult = await executeParameterizedQuery(userTeamsQuery, {
    userId,
  });

  const teamsWithMembers = await Promise.all(
    teamsResult.recordset.map(async (team) => {
      const membersQuery = `
        SELECT 
          tm.Role,
          u.userid,
          u.name,
          u.email
        FROM team_members tm
        INNER JOIN users u ON tm.UserId = u.userid
        WHERE tm.TeamId = @teamId
        ORDER BY 
          CASE WHEN tm.Role = 'Leader' THEN 1 ELSE 2 END,
          u.name
      `;

      const membersResult = await executeParameterizedQuery(membersQuery, {
        teamId: team.TeamId,
      });

      return {
        ...team,
        members: membersResult.recordset,
        memberDetails: {
          total: membersResult.recordset.length,
          leaders: membersResult.recordset.filter((m) => m.Role === "Leader")
            .length,
          members: membersResult.recordset.filter((m) => m.Role === "Member")
            .length,
        },
      };
    })
  );

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "User teams retrieved successfully",
    data: teamsWithMembers,
  });
});

export const updateTeam = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { teamName } = req.body;
  const userId = req.user.userid;

  const teamIdNum = parseInt(teamId);
  if (isNaN(teamIdNum) || teamIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID",
    });
  }

  if (!teamName || teamName.trim() === "") {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Team name is required",
    });
  }

  const leaderCheck = `
        SELECT Role FROM team_members 
        WHERE TeamId = @teamId AND UserId = @userId AND Role = 'Leader'
    `;
  const isLeader = await executeParameterizedQuery(leaderCheck, {
    teamId: teamIdNum,
    userId,
  });

  if (isLeader.recordset.length === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "Only team leader can update team details",
    });
  }

  const teamNameCheck = `
        SELECT t1.TeamId, t1.EventId 
        FROM teams t1
        INNER JOIN teams t2 ON t1.EventId = t2.EventId
        WHERE t1.TeamName = @teamName AND t2.TeamId = @teamId AND t1.TeamId != @teamId
    `;
  const nameExists = await executeParameterizedQuery(teamNameCheck, {
    teamName,
    teamId: teamIdNum,
  });

  if (nameExists.recordset.length > 0) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: "Team name already exists for this event",
    });
  }

  const updateQuery = `
        UPDATE teams 
        SET TeamName = @teamName 
        OUTPUT INSERTED.*
        WHERE TeamId = @teamId
    `;

  const result = await executeParameterizedQuery(updateQuery, {
    teamName,
    teamId: teamIdNum,
  });

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Team updated successfully",
    data: result.recordset[0],
  });
});

export const removeMember = AsyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;
  const userId = req.user.userid;

  const teamIdNum = parseInt(teamId);
  const memberIdNum = parseInt(memberId);

  if (
    isNaN(teamIdNum) ||
    teamIdNum <= 0 ||
    isNaN(memberIdNum) ||
    memberIdNum <= 0
  ) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID or member ID",
    });
  }

  const leaderCheck = `
        SELECT Role FROM team_members 
        WHERE TeamId = @teamId AND UserId = @userId AND Role = 'Leader'
    `;
  const isLeader = await executeParameterizedQuery(leaderCheck, {
    teamId: teamIdNum,
    userId,
  });

  if (isLeader.recordset.length === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "Only team leader can remove members",
    });
  }

  const memberCheck = `
        SELECT Role FROM team_members 
        WHERE TeamId = @teamId AND UserId = @memberId
    `;
  const memberExists = await executeParameterizedQuery(memberCheck, {
    teamId: teamIdNum,
    memberId: memberIdNum,
  });

  if (memberExists.recordset.length === 0) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Member not found in team",
    });
  }

  if (memberExists.recordset[0].Role === "Leader") {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "Cannot remove team leader",
    });
  }

  const removeQuery = `DELETE FROM team_members WHERE TeamId = @teamId AND UserId = @memberId`;
  await executeParameterizedQuery(removeQuery, {
    teamId: teamIdNum,
    memberId: memberIdNum,
  });

  // Update removed member's enrollment to remove team association
  const getEventQuery = `SELECT EventId FROM teams WHERE TeamId = @teamId`;
  const eventResult = await executeParameterizedQuery(getEventQuery, { teamId: teamIdNum });
  
  if (eventResult.recordset.length > 0) {
    const eventId = eventResult.recordset[0].EventId;
    
    const updateEnrollmentQuery = `
          UPDATE event_enrollments 
          SET TeamID = NULL
          WHERE EventID = @eventId AND UserID = @memberId AND Status = 'Enrolled'
      `;
    
    await executeParameterizedQuery(updateEnrollmentQuery, {
      eventId,
      memberId: memberIdNum,
    });
  }

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Member removed successfully",
  });
});

export const deleteTeam = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.userid;

  const teamIdNum = parseInt(teamId);
  if (isNaN(teamIdNum) || teamIdNum <= 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid team ID",
    });
  }

  const leaderCheck = `
        SELECT Role FROM team_members 
        WHERE TeamId = @teamId AND UserId = @userId AND Role = 'Leader'
    `;
  const isLeader = await executeParameterizedQuery(leaderCheck, {
    teamId: teamIdNum,
    userId,
  });

  if (isLeader.recordset.length === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "Only team leader can delete the team",
    });
  }

  const deleteMembersQuery = `DELETE FROM team_members WHERE TeamId = @teamId`;
  await executeParameterizedQuery(deleteMembersQuery, { teamId: teamIdNum });

  const deleteTeamQuery = `DELETE FROM teams WHERE TeamId = @teamId`;
  await executeParameterizedQuery(deleteTeamQuery, { teamId: teamIdNum });

  return res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Team deleted successfully",
  });
});
