import express from "express";
import {
  createChatMessage,
  getChatByEvent,
  addReplyToChat,
  getChatById,
  updateChatMessage,
  deleteChatMessage,
  updateChatReply,
  deleteChatReply
} from "../controllers/chatQna.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createChatMessageWithValidation,
  addReplyWithValidation,
  updateChatMessageWithValidation,
  getChatWithValidation,
  getChatByEventWithValidation,
  deleteChatWithValidation,
  updateReplyWithValidation,
  deleteReplyWithValidation
} from "../validators/chatQna.validators.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new chat message
router.post("/", 
  validate(createChatMessageWithValidation), 
  createChatMessage
);

// Get chat messages by event with pagination
router.get("/event/:eventId", 
  validate(getChatByEventWithValidation), 
  getChatByEvent
);

// Get specific chat message by ID
router.get("/:id", 
  validate(getChatWithValidation), 
  getChatById
);

// Update chat message
router.patch("/:id", 
  validate(updateChatMessageWithValidation), 
  updateChatMessage
);

// Delete chat message
router.delete("/:id", 
  validate(deleteChatWithValidation), 
  deleteChatMessage
);

// Add reply to chat message
router.post("/:chatId/reply", 
  validate(addReplyWithValidation), 
  addReplyToChat
);

// Update reply in chat message
router.patch("/:chatId/reply/:replyId", 
  validate(updateReplyWithValidation), 
  updateChatReply
);

// Delete reply from chat message
router.delete("/:chatId/reply/:replyId", 
  validate(deleteReplyWithValidation), 
  deleteChatReply
);

export default router;
