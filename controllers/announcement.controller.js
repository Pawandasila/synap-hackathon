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
  const { eventId, message, isImportant = true } = req.body;
  const authorId = req.user.userid;

  // Validate required fields
  if (!eventId || !message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID and message are required"
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
    message,
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
