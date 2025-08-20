import mongoose from "mongoose";
import { validateUserExists, validateEventExists } from "../utils/validation.util.js";

const announcementSchema = new mongoose.Schema(
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
    authorId: {
      type: Number,
      required: true,
      validate: {
        validator: async function(authorId) {
          return await validateUserExists(authorId);
        },
        message: 'Referenced user does not exist in SQL database'
      }
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
