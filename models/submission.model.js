import mongoose from "mongoose";
import { validateEventExists, validateTeamExists } from "../utils/validation.util.js";

const submissionSchema = new mongoose.Schema(
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
    teamId: {
      type: Number,
      required: true,
      validate: {
        validator: async function(teamId) {
          return await validateTeamExists(teamId);
        },
        message: 'Referenced team does not exist in SQL database'
      }
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    track: {
      type: String,
      required: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    docs: [
      {
        type: String,
      },
    ],
    round: {
      type: Number,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
