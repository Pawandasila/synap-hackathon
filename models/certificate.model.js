import mongoose from "mongoose";
import { validateEventExists, validateUserExists } from "../utils/validation.util.js";

const certificateSchema = new mongoose.Schema(
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
    userId: {
      type: Number,
      required: true,
      validate: {
        validator: async function(userId) {
          return await validateUserExists(userId);
        },
        message: 'Referenced user does not exist in SQL database'
      }
    },
    certificateUrl: {
      type: String,
      required: true,
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
