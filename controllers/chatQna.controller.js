import { AsyncHandler } from "../middlewares/AsyncHandler.middleware.js";
import ChatQnA from "../models/chatQna.model.js";
import { executeParameterizedQuery } from "../utils/sql.util.js";
import { HTTPSTATUS } from "../config/Https.config.js";
import { validateReferences } from "../utils/validation.util.js";

/**
 * Create a new chat/question
 * POST /chat
 */
export const createChatMessage = AsyncHandler(async (req, res) => {
  const { eventId, message } = req.body;
  const fromUserId = req.user.userid;

  // Validate required fields
  if (!eventId || !message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event ID and message are required"
    });
  }

  // Validate references exist in SQL database
  const validationErrors = await validateReferences({ eventId, userId: fromUserId });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors
    });
  }

  // Check if user has access to this event (enrolled or organizer)
  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @fromUserId
      UNION
      SELECT 1 FROM event_enrollments WHERE EventID = @eventId AND UserID = @fromUserId AND Status = 'Enrolled'
    ) as access_check
  `;
  
  const hasAccess = await executeParameterizedQuery(accessCheck, { eventId, fromUserId });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to this event's chat"
    });
  }

  // Create new chat message
  const chatMessage = new ChatQnA({
    eventId,
    fromUserId,
    message
  });

  await chatMessage.save();

  // Get user details for response
  const userQuery = `
    SELECT name, role FROM users WHERE userid = @fromUserId
  `;
  
  const userResult = await executeParameterizedQuery(userQuery, { fromUserId });

  const chatMessageWithUser = {
    ...chatMessage.toObject(),
    userDetails: userResult.recordset[0] || null
  };

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Chat message created successfully",
    data: chatMessageWithUser
  });
});

/**
 * Get chat messages for an event
 * GET /chat/event/:eventId
 */
export const getChatByEvent = AsyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.userid;

  // Validate event exists
  const validationErrors = await validateReferences({ eventId: parseInt(eventId) });
  if (validationErrors.length > 0) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Event not found",
      errors: validationErrors
    });
  }

  // Check if user has access to this event
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
      message: "You don't have access to this event's chat"
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const chatMessages = await ChatQnA.find({ eventId: parseInt(eventId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalMessages = await ChatQnA.countDocuments({ eventId: parseInt(eventId) });

  // Get user details for each message and reply
  const chatMessagesWithDetails = await Promise.all(
    chatMessages.map(async (chat) => {
      // Get main message author details
      const authorQuery = `
        SELECT name, role FROM users WHERE userid = @fromUserId
      `;
      
      const authorResult = await executeParameterizedQuery(authorQuery, { 
        fromUserId: chat.fromUserId 
      });

      // Get reply authors details
      const repliesWithDetails = await Promise.all(
        chat.replies.map(async (reply) => {
          const replyAuthorResult = await executeParameterizedQuery(authorQuery, { 
            fromUserId: reply.fromUserId 
          });

          return {
            ...reply.toObject(),
            userDetails: replyAuthorResult.recordset[0] || null
          };
        })
      );

      return {
        ...chat.toObject(),
        userDetails: authorResult.recordset[0] || null,
        replies: repliesWithDetails
      };
    })
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Chat messages retrieved successfully",
    data: chatMessagesWithDetails.reverse(), // Reverse to show oldest first
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      totalMessages,
      hasNextPage: skip + parseInt(limit) < totalMessages,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

/**
 * Add reply to a chat message
 * POST /chat/:chatId/reply
 */
export const addReplyToChat = AsyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;
  const fromUserId = req.user.userid;

  if (!message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Message is required"
    });
  }

  const chatMessage = await ChatQnA.findById(chatId);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  // Check if user has access to this event
  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @fromUserId
      UNION
      SELECT 1 FROM event_enrollments WHERE EventID = @eventId AND UserID = @fromUserId AND Status = 'Enrolled'
    ) as access_check
  `;
  
  const hasAccess = await executeParameterizedQuery(accessCheck, { 
    eventId: chatMessage.eventId, 
    fromUserId 
  });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to reply in this event's chat"
    });
  }

  // Add reply
  const reply = {
    fromUserId,
    message,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  chatMessage.replies.push(reply);
  await chatMessage.save();

  // Get user details for the reply
  const userQuery = `
    SELECT name, role FROM users WHERE userid = @fromUserId
  `;
  
  const userResult = await executeParameterizedQuery(userQuery, { fromUserId });

  const newReply = chatMessage.replies[chatMessage.replies.length - 1];
  const replyWithUser = {
    ...newReply.toObject(),
    userDetails: userResult.recordset[0] || null
  };

  res.status(HTTPSTATUS.CREATED).json({
    success: true,
    message: "Reply added successfully",
    data: replyWithUser
  });
});

/**
 * Get chat message by ID
 * GET /chat/:id
 */
export const getChatById = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;

  const chatMessage = await ChatQnA.findById(id);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  // Check if user has access to this event
  const accessCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
      UNION
      SELECT 1 FROM event_enrollments WHERE EventID = @eventId AND UserID = @userId AND Status = 'Enrolled'
    ) as access_check
  `;
  
  const hasAccess = await executeParameterizedQuery(accessCheck, { 
    eventId: chatMessage.eventId, 
    userId 
  });

  if (hasAccess.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You don't have access to this chat message"
    });
  }

  // Get user details for main message and replies
  const authorQuery = `
    SELECT name, role FROM users WHERE userid = @fromUserId
  `;
  
  const authorResult = await executeParameterizedQuery(authorQuery, { 
    fromUserId: chatMessage.fromUserId 
  });

  const repliesWithDetails = await Promise.all(
    chatMessage.replies.map(async (reply) => {
      const replyAuthorResult = await executeParameterizedQuery(authorQuery, { 
        fromUserId: reply.fromUserId 
      });

      return {
        ...reply.toObject(),
        userDetails: replyAuthorResult.recordset[0] || null
      };
    })
  );

  const chatMessageWithDetails = {
    ...chatMessage.toObject(),
    userDetails: authorResult.recordset[0] || null,
    replies: repliesWithDetails
  };

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Chat message retrieved successfully",
    data: chatMessageWithDetails
  });
});

/**
 * Update chat message
 * PATCH /chat/:id
 * Only message author can update
 */
export const updateChatMessage = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.userid;

  if (!message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Message is required"
    });
  }

  const chatMessage = await ChatQnA.findById(id);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  // Check if user is the author
  if (chatMessage.fromUserId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You can only update your own messages"
    });
  }

  const updatedChat = await ChatQnA.findByIdAndUpdate(
    id,
    { message },
    { new: true, runValidators: true }
  );

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Chat message updated successfully",
    data: updatedChat
  });
});

/**
 * Delete chat message
 * DELETE /chat/:id
 * Only message author or event organizer can delete
 */
export const deleteChatMessage = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userid;

  const chatMessage = await ChatQnA.findById(id);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  // Check if user is the author or event organizer
  const authCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 WHERE @userId = @fromUserId
      UNION
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
    ) as auth_check
  `;
  
  const isAuthorized = await executeParameterizedQuery(authCheck, { 
    userId, 
    fromUserId: chatMessage.fromUserId,
    eventId: chatMessage.eventId 
  });

  if (isAuthorized.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to delete this message"
    });
  }

  await ChatQnA.findByIdAndDelete(id);

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Chat message deleted successfully"
  });
});

/**
 * Update reply in a chat message
 * PATCH /chat/:chatId/reply/:replyId
 */
export const updateChatReply = AsyncHandler(async (req, res) => {
  const { chatId, replyId } = req.params;
  const { message } = req.body;
  const userId = req.user.userid;

  if (!message) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Message is required"
    });
  }

  const chatMessage = await ChatQnA.findById(chatId);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  const reply = chatMessage.replies.id(replyId);

  if (!reply) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Reply not found"
    });
  }

  // Check if user is the reply author
  if (reply.fromUserId !== userId) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You can only update your own replies"
    });
  }

  reply.message = message;
  reply.updatedAt = new Date();

  await chatMessage.save();

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Reply updated successfully",
    data: reply
  });
});

/**
 * Delete reply from a chat message
 * DELETE /chat/:chatId/reply/:replyId
 */
export const deleteChatReply = AsyncHandler(async (req, res) => {
  const { chatId, replyId } = req.params;
  const userId = req.user.userid;

  const chatMessage = await ChatQnA.findById(chatId);

  if (!chatMessage) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Chat message not found"
    });
  }

  const reply = chatMessage.replies.id(replyId);

  if (!reply) {
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: "Reply not found"
    });
  }

  // Check if user is the reply author or event organizer
  const authCheck = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 WHERE @userId = @fromUserId
      UNION
      SELECT 1 FROM events WHERE EventID = @eventId AND OrganizerID = @userId
    ) as auth_check
  `;
  
  const isAuthorized = await executeParameterizedQuery(authCheck, { 
    userId, 
    fromUserId: reply.fromUserId,
    eventId: chatMessage.eventId 
  });

  if (isAuthorized.recordset[0].count === 0) {
    return res.status(HTTPSTATUS.FORBIDDEN).json({
      success: false,
      message: "You are not authorized to delete this reply"
    });
  }

  chatMessage.replies.pull(replyId);
  await chatMessage.save();

  res.status(HTTPSTATUS.OK).json({
    success: true,
    message: "Reply deleted successfully"
  });
});
