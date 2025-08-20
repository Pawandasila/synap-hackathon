import { HTTPSTATUS } from "../config/Https.config.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import { EventModel } from "../models/event.model.js";
import { EventEnrollmentModel } from "../models/event-enrollment.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { createEventValidator, updateEventValidator } from "../validators/event.validators.js";

export const initializeEventTable = async () => {
  try {
    await EventModel();
    await EventEnrollmentModel();
    console.log("✅ Events table initialized successfully");
    console.log("✅ Event Enrollments table initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize events table:", error);
    throw error;
  }
};

export const createEvents = AsyncHandler(async (req, res) => {
  const body = createEventValidator.parse(req.body);

  // Use the authenticated user's ID as the organizer ID
  const organizerID = req.user.userid;

  const {
    name,
    description,
    theme,
    mode,
    startDate,
    endDate,
    submissionDeadline,
    resultDate,
    rules,
    timeline,
    tracks,
    prizes,
    maxTeamSize,
    sponsors,
    isActive = true,
  } = body;

  console.log(body);

  const organizerCheck = `SELECT COUNT(*) as count FROM users WHERE userid = @OrganizerID AND role = 'organizer'`;
  const organizerExists = await executeParameterizedQuery(organizerCheck, {
    OrganizerID: organizerID,
  });

  if (organizerExists.recordset[0].count === 0) {
    return res
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({
        success: false,
        message: "Organizer does not exist or is not an organizer",
      });
  }

  const insertRecord = `
    INSERT INTO events (OrganizerID, Name, Description, Theme, Mode, StartDate, EndDate, SubmissionDeadline, ResultDate, Rules, Timeline, Tracks, Prizes, MaxTeamSize, Sponsors, IsActive) 
    OUTPUT INSERTED.*
    VALUES (@OrganizerID, @Name, @Description, @Theme, @Mode, @StartDate, @EndDate, @SubmissionDeadline, @ResultDate, @Rules, @Timeline, @Tracks, @Prizes, @MaxTeamSize, @Sponsors, @IsActive)
  `;

  const result = await executeParameterizedQuery(insertRecord, {
    OrganizerID: organizerID,
    Name: name,
    Description: description,
    Theme: theme,
    Mode: mode,
    StartDate: startDate,
    EndDate: endDate,
    SubmissionDeadline: submissionDeadline,
    ResultDate: resultDate,
    Rules: rules,
    Timeline: timeline,
    Tracks: tracks,
    Prizes: prizes,
    MaxTeamSize: maxTeamSize,
    Sponsors: sponsors,
    IsActive: isActive,
  });

  return res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Event created successfully",
    data: result.recordset[0],
  });
});

export const getEvents = AsyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100"
        });
    }

    const countQuery = `SELECT COUNT(*) as total FROM events WHERE IsActive = 1`;
    const countResult = await executeParameterizedQuery(countQuery);
    const totalEvents = countResult.recordset[0].total;

    const eventsQuery = `
        SELECT *
        FROM events 
        WHERE IsActive = 1
        ORDER BY StartDate DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
    `;

    const result = await executeParameterizedQuery(eventsQuery, {
        Offset: offset,
        Limit: limit,
    });

    const totalPages = Math.ceil(totalEvents / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Events retrieved successfully",
        data: result.recordset,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalEvents: totalEvents,
            eventsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    });
});

export const getEventById = AsyncHandler(async (req, res) => {
    const {id} = req.params;

    const eventQuery = `
        SELECT *
        FROM events
        WHERE EventID = @EventID AND IsActive = 1
    `;

    const result = await executeParameterizedQuery(eventQuery, { EventID: id });

    if (result.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event retrieved successfully",
        data: result.recordset[0]
    });
})

export const getEventByOrganizerId = AsyncHandler(async (req, res) => {
    const { organizerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const organizerIdNum = parseInt(organizerId);
    if (isNaN(organizerIdNum) || organizerIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid organizer ID"
        });
    }

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100"
        });
    }

    const organizerCheck = `SELECT COUNT(*) as count FROM users WHERE userid = @OrganizerID AND role = 'organizer'`;
    const organizerExists = await executeParameterizedQuery(organizerCheck, { OrganizerID: organizerIdNum });
    
    if (organizerExists.recordset[0].count === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Organizer not found"
        });
    }

    const countQuery = `SELECT COUNT(*) as total FROM events WHERE OrganizerID = @OrganizerID AND IsActive = 1`;
    const countResult = await executeParameterizedQuery(countQuery, { OrganizerID: organizerIdNum });
    const totalEvents = countResult.recordset[0].total;

    const eventsQuery = `
        SELECT EventID, OrganizerID, Name, Description, Theme, Mode, 
               StartDate, EndDate, SubmissionDeadline, ResultDate, 
               Rules, Timeline, Tracks, Prizes, MaxTeamSize, Sponsors, IsActive, CreatedAt
        FROM events
        WHERE OrganizerID = @OrganizerID AND IsActive = 1
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
    `;

    const result = await executeParameterizedQuery(eventsQuery, { 
        OrganizerID: organizerIdNum,
        Offset: offset,
        Limit: limit
    });

    const totalPages = Math.ceil(totalEvents / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: `Events for organizer ${organizerIdNum} retrieved successfully`,
        data: result.recordset,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalEvents: totalEvents,
            eventsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    });
});


export const updateEvent = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = updateEventValidator.parse(req.body);

    const eventIdNum = parseInt(id);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    const checkEventQuery = `SELECT * FROM events WHERE EventID = @EventID AND IsActive = 1`;
    const eventCheck = await executeParameterizedQuery(checkEventQuery, { EventID: eventIdNum });
    
    if (eventCheck.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    if (req.user.userid !== eventCheck.recordset[0].OrganizerID) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "You can only update your own events"
        });
    }

    // Get existing event data and merge with update data
    const existingEvent = eventCheck.recordset[0];
    const updatedData = {
        Name: body.name ?? existingEvent.Name,
        Description: body.description ?? existingEvent.Description,
        Theme: body.theme ?? existingEvent.Theme,
        Mode: body.mode ?? existingEvent.Mode,
        StartDate: body.startDate ?? existingEvent.StartDate,
        EndDate: body.endDate ?? existingEvent.EndDate,
        SubmissionDeadline: body.submissionDeadline ?? existingEvent.SubmissionDeadline,
        ResultDate: body.resultDate ?? existingEvent.ResultDate,
        Rules: body.rules ?? existingEvent.Rules,
        Timeline: body.timeline ?? existingEvent.Timeline,
        Tracks: body.tracks ?? existingEvent.Tracks,
        Prizes: body.prizes ?? existingEvent.Prizes,
        MaxTeamSize: body.maxTeamSize ?? existingEvent.MaxTeamSize,
        Sponsors: body.sponsors ?? existingEvent.Sponsors,
        IsActive: body.isActive ?? existingEvent.IsActive
    };

    const updateQuery = `
        UPDATE events 
        SET Name = @Name, Description = @Description, Theme = @Theme, Mode = @Mode,
            StartDate = @StartDate, EndDate = @EndDate, SubmissionDeadline = @SubmissionDeadline,
            ResultDate = @ResultDate, Rules = @Rules, Timeline = @Timeline, Tracks = @Tracks,
            Prizes = @Prizes, MaxTeamSize = @MaxTeamSize, Sponsors = @Sponsors, IsActive = @IsActive
        OUTPUT INSERTED.*
        WHERE EventID = @EventID
    `;

    const result = await executeParameterizedQuery(updateQuery, {
        EventID: eventIdNum,
        ...updatedData
    });

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event updated successfully",
        data: result.recordset[0]
    });
});

export const deleteEvent = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const eventIdNum = parseInt(id);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    const checkEventQuery = `SELECT OrganizerID FROM events WHERE EventID = @EventID AND IsActive = 1`;
    const eventCheck = await executeParameterizedQuery(checkEventQuery, { EventID: eventIdNum });
    
    if (eventCheck.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    if (req.user.userid !== eventCheck.recordset[0].OrganizerID) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "You can only delete your own events"
        });
    }

    const deleteQuery = `
        UPDATE events 
        SET IsActive = 0
        WHERE EventID = @EventID
    `;

    await executeParameterizedQuery(deleteQuery, { EventID: eventIdNum });

    // Cancel all enrollments for this event
    const cancelEnrollmentsQuery = `
        UPDATE event_enrollments 
        SET Status = 'Cancelled'
        WHERE EventID = @EventID AND Status = 'Enrolled'
    `;
    
    await executeParameterizedQuery(cancelEnrollmentsQuery, { EventID: eventIdNum });

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event deleted successfully. All enrollments have been cancelled."
    });
});

export const searchEvents = AsyncHandler(async (req, res) => {
    const { query: searchTerm, mode, theme } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid pagination parameters"
        });
    }

    // Build WHERE conditions
    let whereConditions = ["IsActive = 1"];
    let queryParams = { Offset: offset, Limit: limit };

    // Add search term condition
    if (searchTerm && searchTerm.trim().length >= 2) {
        whereConditions.push("(Name LIKE @searchTerm OR Theme LIKE @searchTerm OR Description LIKE @searchTerm)");
        queryParams.searchTerm = `%${searchTerm.trim()}%`;
    }

    // Add mode filter
    if (mode && (mode === 'Online' || mode === 'Offline')) {
        whereConditions.push("Mode = @mode");
        queryParams.mode = mode;
    }

    // Add theme filter
    if (theme && theme.trim().length > 0) {
        whereConditions.push("Theme LIKE @theme");
        queryParams.theme = `%${theme.trim()}%`;
    }

    const whereClause = whereConditions.join(" AND ");

    // Count total events
    const countQuery = `
        SELECT COUNT(*) as total FROM events 
        WHERE ${whereClause}
    `;
    const countResult = await executeParameterizedQuery(countQuery, queryParams);
    const totalEvents = countResult.recordset[0].total;

    // Search events
    const searchQuery = `
        SELECT EventID, OrganizerID, Name, Description, Theme, Mode, 
               StartDate, EndDate, SubmissionDeadline, ResultDate, 
               Rules, Timeline, Tracks, Prizes, MaxTeamSize, Sponsors, IsActive, CreatedAt
        FROM events 
        WHERE ${whereClause}
        ORDER BY StartDate DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
    `;

    const result = await executeParameterizedQuery(searchQuery, queryParams);

    const totalPages = Math.ceil(totalEvents / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Search completed successfully",
        data: result.recordset,
        filters: {
            query: searchTerm || null,
            mode: mode || null,
            theme: theme || null
        },
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalEvents: totalEvents,
            eventsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    });
});

export const getUpcomingEvents = AsyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid pagination parameters"
        });
    }

    const currentDate = new Date().toISOString();

    const countQuery = `
        SELECT COUNT(*) as total FROM events 
        WHERE StartDate > @currentDate AND IsActive = 1
    `;
    const countResult = await executeParameterizedQuery(countQuery, { currentDate });
    const totalEvents = countResult.recordset[0].total;

    const upcomingQuery = `
        SELECT EventID, OrganizerID, Name, Description, Theme, Mode, 
               StartDate, EndDate, SubmissionDeadline, ResultDate, 
               Rules, Timeline, Tracks, Prizes, MaxTeamSize, Sponsors, IsActive, CreatedAt
        FROM events 
        WHERE StartDate > @currentDate AND IsActive = 1
        ORDER BY StartDate ASC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
    `;

    const result = await executeParameterizedQuery(upcomingQuery, { 
        currentDate,
        Offset: offset,
        Limit: limit
    });

    const totalPages = Math.ceil(totalEvents / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Upcoming events retrieved successfully",
        data: result.recordset,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalEvents: totalEvents,
            eventsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    });
});


export const enrollToEvent = AsyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.userid;

    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    const eventCheck = `
        SELECT EventID, Name, StartDate, EndDate, IsActive 
        FROM events 
        WHERE EventID = @eventId AND IsActive = 1
    `;
    const eventExists = await executeParameterizedQuery(eventCheck, { eventId: eventIdNum });
    
    if (eventExists.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found or inactive"
        });
    }

    const event = eventExists.recordset[0];
    const currentDate = new Date();
    const eventStartDate = new Date(event.StartDate);

    if (currentDate >= eventStartDate) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Cannot enroll to an event that has already started"
        });
    }

    const enrollmentCheck = `
        SELECT EnrollmentID, Status 
        FROM event_enrollments 
        WHERE EventID = @eventId AND UserID = @userId
    `;
    const existingEnrollment = await executeParameterizedQuery(enrollmentCheck, { eventId: eventIdNum, userId });
    
    if (existingEnrollment.recordset.length > 0) {
        const status = existingEnrollment.recordset[0].Status;
        if (status === 'Enrolled') {
            return res.status(HTTPSTATUS.CONFLICT).json({
                success: false,
                message: "You are already enrolled in this event"
            });
        } else if (status === 'Cancelled') {
            const reEnrollQuery = `
                UPDATE event_enrollments 
                SET Status = 'Enrolled', EnrollmentDate = GETDATE()
                WHERE EventID = @eventId AND UserID = @userId
            `;
            await executeParameterizedQuery(reEnrollQuery, { eventId: eventIdNum, userId });
            
            return res.status(HTTPSTATUS.OK).json({
                success: true,
                message: "Successfully re-enrolled to the event"
            });
        }
    }

    const enrollQuery = `
        INSERT INTO event_enrollments (EventID, UserID, Status)
        OUTPUT INSERTED.*
        VALUES (@eventId, @userId, 'Enrolled')
    `;
    
    const result = await executeParameterizedQuery(enrollQuery, { eventId: eventIdNum, userId });

    return res.status(HTTPSTATUS.CREATED).json({
        success: true,
        message: "Successfully enrolled to the event",
        data: {
            enrollmentId: result.recordset[0].EnrollmentID,
            eventName: event.Name,
            enrollmentDate: result.recordset[0].EnrollmentDate
        }
    });
});

// Cancel Event Enrollment
export const cancelEnrollment = AsyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.userid;

    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    // Check if user is enrolled
    const enrollmentCheck = `
        SELECT EnrollmentID, Status 
        FROM event_enrollments 
        WHERE EventID = @eventId AND UserID = @userId
    `;
    const enrollment = await executeParameterizedQuery(enrollmentCheck, { eventId: eventIdNum, userId });
    
    if (enrollment.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "You are not enrolled in this event"
        });
    }

    if (enrollment.recordset[0].Status === 'Cancelled') {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Enrollment is already cancelled"
        });
    }

    // Check if event has started
    const eventCheck = `SELECT StartDate FROM events WHERE EventID = @eventId`;
    const eventData = await executeParameterizedQuery(eventCheck, { eventId: eventIdNum });
    
    if (eventData.recordset.length > 0) {
        const eventStartDate = new Date(eventData.recordset[0].StartDate);
        const currentDate = new Date();
        
        if (currentDate >= eventStartDate) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Cannot cancel enrollment for an event that has already started"
            });
        }
    }

    // Cancel enrollment
    const cancelQuery = `
        UPDATE event_enrollments 
        SET Status = 'Cancelled'
        WHERE EventID = @eventId AND UserID = @userId
    `;
    
    await executeParameterizedQuery(cancelQuery, { eventId: eventIdNum, userId });

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event enrollment cancelled successfully"
    });
});

// Get User's Enrollments
export const getUserEnrollments = AsyncHandler(async (req, res) => {
    const userId = req.user.userid;
    const status = req.query.status || 'Enrolled'; // Default to enrolled

    const validStatuses = ['Enrolled', 'Cancelled', 'Waitlisted'];
    if (!validStatuses.includes(status)) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid status. Must be one of: Enrolled, Cancelled, Waitlisted"
        });
    }

    const enrollmentsQuery = `
        SELECT 
            ee.EnrollmentID,
            ee.EventID,
            ee.EnrollmentDate,
            ee.Status,
            ee.TeamID,
            e.Name as EventName,
            e.Description,
            e.Theme,
            e.Mode,
            e.StartDate,
            e.EndDate,
            e.SubmissionDeadline,
            e.MaxTeamSize,
            t.TeamName
        FROM event_enrollments ee
        INNER JOIN events e ON ee.EventID = e.EventID
        LEFT JOIN teams t ON ee.TeamID = t.TeamId
        WHERE ee.UserID = @userId AND ee.Status = @status AND e.IsActive = 1
        ORDER BY ee.EnrollmentDate DESC
    `;

    const result = await executeParameterizedQuery(enrollmentsQuery, { userId, status });

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "User enrollments retrieved successfully",
        data: result.recordset,
        count: result.recordset.length
    });
});

// Get Event Enrollments (for organizers)
export const getEventEnrollments = AsyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'Enrolled';

    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid pagination parameters"
        });
    }

    const organizerCheck = `
        SELECT OrganizerID FROM events WHERE EventID = @eventId
    `;
    const event = await executeParameterizedQuery(organizerCheck, { eventId: eventIdNum });
    
    if (event.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    if (event.recordset[0].OrganizerID !== req.user.userid) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "Only event organizer can view enrollments"
        });
    }

    const countQuery = `
        SELECT COUNT(*) as total 
        FROM event_enrollments 
        WHERE EventID = @eventId AND Status = @status
    `;
    const countResult = await executeParameterizedQuery(countQuery, { eventId: eventIdNum, status });
    const totalEnrollments = countResult.recordset[0].total;

    const enrollmentsQuery = `
        SELECT 
            ee.EnrollmentID,
            ee.EnrollmentDate,
            ee.Status,
            ee.TeamID,
            ee.EventID,
            u.userid,
            u.name,
            u.email,
            t.TeamName,
            e.name as EventName,
            e.startDate as EventStartDate,
            e.endDate as EventEndDate
        FROM event_enrollments ee
        INNER JOIN users u ON ee.UserID = u.userid
        INNER JOIN events e ON ee.EventID = e.EventID
        LEFT JOIN teams t ON ee.TeamID = t.TeamId
        WHERE ee.EventID = @eventId AND ee.Status = @status
        ORDER BY ee.EnrollmentDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
    `;

    const result = await executeParameterizedQuery(enrollmentsQuery, { 
        eventId: eventIdNum, 
        status,
        offset, 
        limit 
    });

    const totalPages = Math.ceil(totalEnrollments / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event enrollments retrieved successfully",
        data: result.recordset,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalEnrollments: totalEnrollments,
            enrollmentsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    });
});

// Get Enrollment Statistics (for organizers)
export const getEnrollmentStats = AsyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    const organizerCheck = `
        SELECT OrganizerID, Name FROM events WHERE EventID = @eventId
    `;
    const event = await executeParameterizedQuery(organizerCheck, { eventId: eventIdNum });
    
    if (event.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    if (event.recordset[0].OrganizerID !== req.user.userid) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "Only event organizer can view enrollment statistics"
        });
    }

    // Get enrollment statistics
    const statsQuery = `
        SELECT 
            Status,
            COUNT(*) as Count
        FROM event_enrollments 
        WHERE EventID = @eventId
        GROUP BY Status
    `;
    const statsResult = await executeParameterizedQuery(statsQuery, { eventId: eventIdNum });

    // Get team statistics
    const teamStatsQuery = `
        SELECT 
            COUNT(DISTINCT t.TeamId) as TotalTeams,
            AVG(CAST(team_counts.MemberCount as FLOAT)) as AvgTeamSize
        FROM teams t
        INNER JOIN (
            SELECT TeamId, COUNT(*) as MemberCount
            FROM team_members
            GROUP BY TeamId
        ) team_counts ON t.TeamId = team_counts.TeamId
        WHERE t.EventId = @eventId
    `;
    const teamStatsResult = await executeParameterizedQuery(teamStatsQuery, { eventId: eventIdNum });

    // Format statistics
    const stats = {};
    statsResult.recordset.forEach(row => {
        stats[row.Status.toLowerCase()] = row.Count;
    });

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Enrollment statistics retrieved successfully",
        data: {
            eventName: event.recordset[0].Name,
            enrollmentStats: {
                enrolled: stats.enrolled || 0,
                cancelled: stats.cancelled || 0,
                waitlisted: stats.waitlisted || 0,
                total: Object.values(stats).reduce((sum, count) => sum + count, 0)
            },
            teamStats: {
                totalTeams: teamStatsResult.recordset[0]?.TotalTeams || 0,
                averageTeamSize: Math.round((teamStatsResult.recordset[0]?.AvgTeamSize || 0) * 100) / 100
            }
        }
    });
});

// Update Team Association in Enrollment
export const updateEnrollmentTeam = AsyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { teamId } = req.body;
    const userId = req.user.userid;

    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum) || eventIdNum <= 0) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid event ID"
        });
    }

    // Check if user is enrolled in the event
    const enrollmentCheck = `
        SELECT EnrollmentID, Status 
        FROM event_enrollments 
        WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    `;
    const enrollment = await executeParameterizedQuery(enrollmentCheck, { eventId: eventIdNum, userId });
    
    if (enrollment.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "You are not enrolled in this event"
        });
    }

    // If teamId is provided, verify the team exists and user is a member
    if (teamId) {
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum) || teamIdNum <= 0) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid team ID"
            });
        }

        const teamMemberCheck = `
            SELECT tm.TeamId 
            FROM team_members tm
            INNER JOIN teams t ON tm.TeamId = t.TeamId
            WHERE tm.UserId = @userId AND t.TeamId = @teamId AND t.EventId = @eventId
        `;
        const teamMember = await executeParameterizedQuery(teamMemberCheck, { 
            userId, 
            teamId: teamIdNum, 
            eventId: eventIdNum 
        });
        
        if (teamMember.recordset.length === 0) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "You are not a member of this team or team doesn't belong to this event"
            });
        }
    }

    // Update the enrollment with team association
    const updateQuery = `
        UPDATE event_enrollments 
        SET TeamID = @teamId
        WHERE EventID = @eventId AND UserID = @userId
    `;
    
    await executeParameterizedQuery(updateQuery, { 
        teamId: teamId || null, 
        eventId: eventIdNum, 
        userId 
    });

    const message = teamId 
        ? "Team association updated successfully" 
        : "Team association removed successfully";

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: message
    });
});

export const getEventForParticipant = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userid;

    // Get basic event details
    const eventQuery = `
        SELECT *
        FROM events
        WHERE EventID = @EventID AND IsActive = 1
    `;

    const eventResult = await executeParameterizedQuery(eventQuery, { EventID: id });

    if (eventResult.recordset.length === 0) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Event not found"
        });
    }

    const event = eventResult.recordset[0];

    // Check if user is enrolled in this event through team membership
    const enrollmentQuery = `
        SELECT 
            t.TeamId,
            t.TeamName,
            t.CreatedAt as TeamCreatedAt,
            tm.Role,
            ee.EnrollmentDate
        FROM event_enrollments ee
        INNER JOIN teams t ON ee.TeamID = t.TeamId
        INNER JOIN team_members tm ON t.TeamId = tm.TeamId AND tm.UserId = @UserId
        WHERE ee.EventID = @EventID AND ee.UserID = @UserId
    `;

    const enrollmentResult = await executeParameterizedQuery(enrollmentQuery, { 
        EventID: id, 
        UserId: userId 
    });

    let enrollmentData = null;
    let teamDetails = null;

    if (enrollmentResult.recordset.length > 0) {
        const enrollment = enrollmentResult.recordset[0];
        
        // Get full team member details
        const teamMembersQuery = `
            SELECT 
                u.userid,
                u.name,
                u.email,
                tm.Role
            FROM team_members tm
            INNER JOIN users u ON tm.UserId = u.userid
            WHERE tm.TeamId = @TeamId
            ORDER BY 
                CASE WHEN tm.Role = 'Leader' THEN 1 ELSE 2 END,
                u.name
        `;

        const teamMembersResult = await executeParameterizedQuery(teamMembersQuery, { 
            TeamId: enrollment.TeamId 
        });

        teamDetails = {
            TeamId: enrollment.TeamId,
            TeamName: enrollment.TeamName,
            EventId: parseInt(id),
            CreatedAt: enrollment.TeamCreatedAt,
            members: teamMembersResult.recordset
        };

        enrollmentData = {
            isEnrolled: true,
            enrolledAt: enrollment.EnrollmentDate,
            userRole: enrollment.Role,
            team: teamDetails
        };
    } else {
        enrollmentData = {
            isEnrolled: false,
            enrolledAt: null,
            userRole: null,
            team: null
        };
    }

    return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Event details retrieved successfully",
        data: {
            event: event,
            enrollment: enrollmentData
        }
    });
});
