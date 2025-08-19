import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import Submission from "../models/submission.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { validateReferences } from "../utils/validation.util.js";

export const createSubmission = AsyncHandler(async (req, res) => {
  const {
    eventId,
    teamId,
    title,
    description,
    track,
    githubUrl,
    videoUrl,
    docs,
    round = 1,
  } = req.body;

  const userId = req.user.userid;

  if (!eventId || !teamId || !title || !description || !track) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID, team ID, title, description, and track are required",
    });
  }

  const validationErrors = await validateReferences({ eventId, teamId });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  const teamMemberCheck = `
    SELECT COUNT(*) as count FROM team_members 
    WHERE TeamId = @teamId AND UserId = @userId
  `;
  const isMember = await executeParameterizedQuery(teamMemberCheck, {
    teamId,
    userId,
  });

  if (isMember.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not a member of this team",
    });
  }

  const existingSubmission = await Submission.findOne({
    eventId,
    teamId,
    round,
  });

  if (existingSubmission) {
    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: `Team already has a submission for round ${round} of this event`,
    });
  }

  const submission = new Submission({
    eventId,
    teamId,
    title,
    description,
    track,
    githubUrl,
    videoUrl,
    docs: docs || [],
    round,
  });

  await submission.save();

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Submission created successfully",
    data: submission,
  });
});

export const getSubmissionsByEvent = AsyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { round, track } = req.query;

  const validationErrors = await validateReferences({
    eventId: parseInt(eventId),
  });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event not found",
      errors: validationErrors,
    });
  }

  const filter = { eventId: parseInt(eventId) };
  if (round) filter.round = parseInt(round);
  if (track) filter.track = track;

  const submissions = await Submission.find(filter)
    .sort({ submittedAt: -1 })
    .populate("teamId", "teamName", "teams");

  const submissionsWithTeamDetails = await Promise.all(
    submissions.map(async (submission) => {
      const teamQuery = `
        SELECT t.TeamName, t.TeamId, u.name as LeaderName
        FROM teams t
        INNER JOIN team_members tm ON t.TeamId = tm.TeamId
        INNER JOIN users u ON tm.UserId = u.userid
        WHERE t.TeamId = @teamId AND tm.Role = 'Leader'
      `;

      const teamResult = await executeParameterizedQuery(teamQuery, {
        teamId: submission.teamId,
      });

      return {
        ...submission.toObject(),
        teamDetails: teamResult.recordset[0] || null,
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Submissions retrieved successfully",
    data: submissionsWithTeamDetails,
    count: submissionsWithTeamDetails.length,
  });
});

export const getSubmissionsByTeam = AsyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.userid;

  const validationErrors = await validateReferences({
    teamId: parseInt(teamId),
  });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Team not found",
      errors: validationErrors,
    });
  }

  const teamMemberCheck = `
    SELECT COUNT(*) as count FROM team_members 
    WHERE TeamId = @teamId AND UserId = @userId
  `;
  const isMember = await executeParameterizedQuery(teamMemberCheck, {
    teamId,
    userId,
  });

  if (isMember.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not a member of this team",
    });
  }

  const submissions = await Submission.find({ teamId: parseInt(teamId) }).sort({
    submittedAt: -1,
  });

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Team submissions retrieved successfully",
    data: submissions,
    count: submissions.length,
  });
});

export const getSubmissionById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await Submission.findById(id);

  if (!submission) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Submission not found",
    });
  }

  const teamQuery = `
    SELECT t.TeamName, t.TeamId, 
           STRING_AGG(u.name, ', ') as Members,
           (SELECT u2.name FROM users u2 
            INNER JOIN team_members tm2 ON u2.userid = tm2.UserId 
            WHERE tm2.TeamId = t.TeamId AND tm2.Role = 'Leader') as Leader
    FROM teams t
    INNER JOIN team_members tm ON t.TeamId = tm.TeamId
    INNER JOIN users u ON tm.UserId = u.userid
    WHERE t.TeamId = @teamId
    GROUP BY t.TeamName, t.TeamId
  `;

  const teamResult = await executeParameterizedQuery(teamQuery, {
    teamId: submission.teamId,
  });

  const submissionWithDetails = {
    ...submission.toObject(),
    teamDetails: teamResult.recordset[0] || null,
  };

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Submission retrieved successfully",
    data: submissionWithDetails,
  });
});

export const updateSubmission = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;
  const updateData = req.body;

  const submission = await Submission.findById(id);

  if (!submission) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Submission not found",
    });
  }

  const teamMemberCheck = `
    SELECT COUNT(*) as count FROM team_members 
    WHERE TeamId = @teamId AND UserId = @userId
  `;
  const isMember = await executeParameterizedQuery(teamMemberCheck, {
    teamId: submission.teamId,
    userId,
  });

  if (isMember.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to update this submission",
    });
  }

  delete updateData.eventId;
  delete updateData.teamId;
  delete updateData.submittedAt;

  const updatedSubmission = await Submission.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Submission updated successfully",
    data: updatedSubmission,
  });
});

export const deleteSubmission = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;

  const submission = await Submission.findById(id);

  if (!submission) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Submission not found",
    });
  }

  const teamLeaderCheck = `
    SELECT COUNT(*) as count FROM team_members 
    WHERE TeamId = @teamId AND UserId = @userId AND Role = 'Leader'
  `;
  const isLeader = await executeParameterizedQuery(teamLeaderCheck, {
    teamId: submission.teamId,
    userId,
  });

  if (isLeader.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "Only team leaders can delete submissions",
    });
  }

  await Submission.findByIdAndDelete(id);

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Submission deleted successfully",
  });
});

export const getMySubmissions = AsyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const userTeamsQuery = `
    SELECT DISTINCT tm.TeamId FROM team_members tm
    WHERE tm.UserId = @userId
  `;

  const userTeamsResult = await executeParameterizedQuery(userTeamsQuery, {
    userId,
  });
  const teamIds = userTeamsResult.recordset.map((row) => row.TeamId);

  if (teamIds.length === 0) {
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "No submissions found",
      data: [],
      count: 0,
    });
  }

  const submissions = await Submission.find({
    teamId: { $in: teamIds },
  }).sort({ submittedAt: -1 });

  const submissionsWithTeamDetails = await Promise.all(
    submissions.map(async (submission) => {
      const teamQuery = `
        SELECT t.TeamName, t.TeamId
        FROM teams t
        WHERE t.TeamId = @teamId
      `;

      const teamResult = await executeParameterizedQuery(teamQuery, {
        teamId: submission.teamId,
      });

      return {
        ...submission.toObject(),
        teamDetails: teamResult.recordset[0] || null,
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Your submissions retrieved successfully",
    data: submissionsWithTeamDetails,
    count: submissionsWithTeamDetails.length,
  });
});
