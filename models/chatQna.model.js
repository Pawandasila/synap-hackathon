import mongoose from "mongoose";
import { validateEventExists, validateUserExists } from "../utils/validation.util.js";

const chatQnASchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
      validate: {
        validator: async function(eventId) {
          return await validateEventExists(eventId);
        },
        message: 'Referenced event does not exist in SQL database'
      }
    },
    fromUserId: {
      type: Number,
      required: true,
      validate: {
        validator: async function(fromUserId) {
          return await validateUserExists(fromUserId);
        },
        message: 'Referenced user does not exist in SQL database'
      }
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [
      {
        fromUserId: {
          type: Number,
          required: true,
          validate: {
            validator: async function(fromUserId) {
              return await validateUserExists(fromUserId);
            },
            message: 'Referenced user does not exist in SQL database'
          }
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const ChatQnA = mongoose.model("ChatQnA", chatQnASchema);

export default ChatQnA;
