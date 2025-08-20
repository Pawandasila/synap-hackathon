import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import Announcement from "../models/announcement.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { validateReferences } from "../utils/validation.util.js";

/**
 * Create a new announcement
 * POST /announcements
 * Organizers only
 */
export const createAnnouncement = AsyncHandler(async (req, res) => {
  const { eventId, title, message, priority = 'medium', isImportant = false } = req.body;
  const authorId = req.user.userid;

  // Validate required fields
  if (!eventId || !title || !message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID, title, and message are required"
    });
  }

  // Validate references exist in SQL database
  const validationErrors = await validateReferences({ eventId, userId: authorId });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors
    });
  }

  // Check if user is organizer of the event
  const organizerCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @authorId
  `;
  const isOrganizer = await executeParameterizedQuery(organizerCheck, { eventId, authorId });

  if (isOrganizer.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to create announcements for this event"
    });
  }

  // Create new announcement
  const announcement = new Announcement({
    eventId,
    authorId,
    title,
    message,
    priority,
    isImportant
  });

  await announcement.save();

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Announcement created successfully",
    data: announcement
  });
});

/**
 * Get announcements for an event
 * GET /announcements/event/:eventId
 */
export const getAnnouncementsByEvent = AsyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { important } = req.query; // Filter by importance

  // Validate event exists
  const validationErrors = await validateReferences({ eventId: parseInt(eventId) });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event not found",
      errors: validationErrors
    });
  }

  // Check if user has access to this event (enrolled or organizer)
  const userId = req.user.userid;
  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
      UNION
      SELECT 1 FROM event_enrollments WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    ) as access_check
  `;
  
  const hasAccess = await executeParameterizedQuery(accessCheck, { eventId, userId });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to this event's announcements"
    });
  }

  // Build filter
  const filter = { eventId: parseInt(eventId) };
  if (important === 'true') filter.isImportant = true;
  if (important === 'false') filter.isImportant = false;

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 });

  // Get author details for each announcement
  const announcementsWithAuthor = await Promise.all(
    announcements.map(async (announcement) => {
      const authorQuery = `
        SELECT name, role FROM users WHERE userid = @authorId
      `;
      
      const authorResult = await executeParameterizedQuery(authorQuery, { 
        authorId: announcement.authorId 
      });

      return {
        ...announcement.toObject(),
        author: authorResult.recordset[0] || null
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcements retrieved successfully",
    data: announcementsWithAuthor,
    count: announcementsWithAuthor.length
  });
});

/**
 * Get announcement by ID
 * GET /announcements/:id
 */
export const getAnnouncementById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Announcement not found"
    });
  }

  // Check if user has access to this event
  const userId = req.user.userid;
  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
      UNION
      SELECT 1 FROM event_enrollments WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    ) as access_check
  `;
  
  const hasAccess = await executeParameterizedQuery(accessCheck, { 
    eventId: announcement.eventId, 
    userId 
  });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to this announcement"
    });
  }

  // Get author details
  const authorQuery = `
    SELECT name, role FROM users WHERE userid = @authorId
  `;
  
  const authorResult = await executeParameterizedQuery(authorQuery, { 
    authorId: announcement.authorId 
  });

  const announcementWithAuthor = {
    ...announcement.toObject(),
    author: authorResult.recordset[0] || null
  };

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcement retrieved successfully",
    data: announcementWithAuthor
  });
});

/**
 * Update announcement
 * PATCH /announcements/:id
 * Organizers only
 */
export const updateAnnouncement = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;
  const updateData = req.body;

  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Announcement not found"
    });
  }

  // Check if user is the author or organizer of the event
  const authCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @userId
  `;
  const isAuthorized = await executeParameterizedQuery(authCheck, { 
    eventId: announcement.eventId, 
    userId 
  });

  if (isAuthorized.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to update this announcement"
    });
  }

  // Remove fields that shouldn't be updated
  delete updateData.eventId;
  delete updateData.authorId;

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcement updated successfully",
    data: updatedAnnouncement
  });
});

/**
 * Delete announcement
 * DELETE /announcements/:id
 * Organizers only
 */
export const deleteAnnouncement = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;

  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Announcement not found"
    });
  }

  // Check if user is the author or organizer of the event
  const authCheck = `
    SELECT COUNT(*) as count FROM events 
    WHERE EventID = @eventId AND OrganizerID = @userId
  `;
  const isAuthorized = await executeParameterizedQuery(authCheck, { 
    eventId: announcement.eventId, 
    userId 
  });

  if (isAuthorized.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to delete this announcement"
    });
  }

  await Announcement.findByIdAndDelete(id);

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcement deleted successfully"
  });
});

/**
 * Get important announcements for user's enrolled events
 * GET /announcements/my-important
 */
export const getMyImportantAnnouncements = AsyncHandler(async (req, res) => {
  const userId = req.user.userid;

  // Get user's enrolled events
  const enrolledEventsQuery = `
    SELECT DISTINCT EventID FROM event_enrollments 
    WHERE UserID = @userId AND Status = 'Enrolled'
  `;
  
  const enrolledEventsResult = await executeParameterizedQuery(enrolledEventsQuery, { userId });
  const eventIds = enrolledEventsResult.recordset.map(row => row.EventID);

  if (eventIds.length === 0) {
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "No important announcements found",
      data: [],
      count: 0
    });
  }

  const announcements = await Announcement.find({ 
    eventId: { $in: eventIds },
    isImportant: true
  }).sort({ createdAt: -1 });

  // Get event and author details for each announcement
  const announcementsWithDetails = await Promise.all(
    announcements.map(async (announcement) => {
      const detailsQuery = `
        SELECT e.Name as EventName, u.name as AuthorName
        FROM events e
        INNER JOIN users u ON e.OrganizerID = u.userid
        WHERE e.EventID = @eventId
      `;
      
      const detailsResult = await executeParameterizedQuery(detailsQuery, { 
        eventId: announcement.eventId 
      });

      return {
        ...announcement.toObject(),
        eventName: detailsResult.recordset[0]?.EventName || null,
        authorName: detailsResult.recordset[0]?.AuthorName || null
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Important announcements retrieved successfully",
    data: announcementsWithDetails,
    count: announcementsWithDetails.length
  });
});

/**
 * Get all announcements for organizer
 * GET /announcements
 * Organizers only - returns all announcements for events they organize
 */
export const getAllAnnouncementsForOrganizer = AsyncHandler(async (req, res) => {
  const organizerId = req.user.userid;
  const { page = 1, limit = 10, eventId, priority, important } = req.query;

  // Get all events organized by this user
  const eventsQuery = `
    SELECT EventID FROM events 
    WHERE OrganizerID = @organizerId AND IsActive = 1
  `;
  const eventsResult = await executeParameterizedQuery(eventsQuery, { organizerId });
  const eventIds = eventsResult.recordset.map(row => row.EventID);

  if (eventIds.length === 0) {
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "No events found for this organizer",
      data: [],
      count: 0,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        totalCount: 0,
        limit: parseInt(limit)
      }
    });
  }

  // Build filter conditions
  let filter = { eventId: { $in: eventIds } };
  
  if (eventId && !isNaN(parseInt(eventId))) {
    filter.eventId = parseInt(eventId);
  }
  
  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    filter.priority = priority;
  }
  
  if (important === 'true') {
    filter.isImportant = true;
  } else if (important === 'false') {
    filter.isImportant = false;
  }

  // Get total count for pagination
  const totalCount = await Announcement.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  // Get announcements with pagination
  const announcements = await Announcement
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get event and author details for each announcement
  const announcementsWithDetails = await Promise.all(
    announcements.map(async (announcement) => {
      // Get event details
      const eventQuery = `
        SELECT Name as EventName FROM events 
        WHERE EventID = @eventId
      `;
      const eventResult = await executeParameterizedQuery(eventQuery, { 
        eventId: announcement.eventId 
      });

      // Get author details
      const authorQuery = `
        SELECT name as AuthorName FROM users 
        WHERE userid = @authorId
      `;
      const authorResult = await executeParameterizedQuery(authorQuery, { 
        authorId: announcement.authorId 
      });

      return {
        ...announcement,
        eventName: eventResult.recordset[0]?.EventName || null,
        authorName: authorResult.recordset[0]?.AuthorName || null
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcements retrieved successfully",
    data: announcementsWithDetails,
    count: announcementsWithDetails.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      limit: parseInt(limit)
    }
  });
});

/**
 * Get all announcements for participant
 * GET /announcements/my-all
 * Participants only - returns all announcements from events they're enrolled in
 */
export const getAllAnnouncementsForParticipant = AsyncHandler(async (req, res) => {
  const participantId = req.user.userid;
  const { page = 1, limit = 10, priority, important } = req.query;

  // Get all events the participant is enrolled in
  const enrollmentsQuery = `
    SELECT DISTINCT EventID FROM event_enrollments 
    WHERE UserID = @participantId AND Status = 'Enrolled'
  `;
  const enrollmentsResult = await executeParameterizedQuery(enrollmentsQuery, { participantId });
  const eventIds = enrollmentsResult.recordset.map(row => row.EventID);

  if (eventIds.length === 0) {
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "No enrolled events found for this participant",
      data: [],
      count: 0,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        totalCount: 0,
        limit: parseInt(limit)
      }
    });
  }

  // Build filter conditions
  let filter = { eventId: { $in: eventIds } };
  
  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    filter.priority = priority;
  }
  
  if (important === 'true') {
    filter.isImportant = true;
  } else if (important === 'false') {
    filter.isImportant = false;
  }

  // Get total count for pagination
  const totalCount = await Announcement.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  // Get announcements with pagination
  const announcements = await Announcement
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get event and author details for each announcement
  const announcementsWithDetails = await Promise.all(
    announcements.map(async (announcement) => {
      // Get event details
      const eventQuery = `
        SELECT Name as EventName FROM events 
        WHERE EventID = @eventId
      `;
      const eventResult = await executeParameterizedQuery(eventQuery, { 
        eventId: announcement.eventId 
      });

      // Get author details
      const authorQuery = `
        SELECT name as AuthorName FROM users 
        WHERE userid = @authorId
      `;
      const authorResult = await executeParameterizedQuery(authorQuery, { 
        authorId: announcement.authorId 
      });

      return {
        ...announcement,
        eventName: eventResult.recordset[0]?.EventName || null,
        authorName: authorResult.recordset[0]?.AuthorName || null
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Announcements retrieved successfully",
    data: announcementsWithDetails,
    count: announcementsWithDetails.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      limit: parseInt(limit)
    }
  });
});
