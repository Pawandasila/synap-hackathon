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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isImportant: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
