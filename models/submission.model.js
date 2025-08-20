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
    // Judging fields
    judgingStatus: {
      type: String,
      enum: ['pending', 'in-review', 'judged'],
      default: 'pending'
    },
    judgeId: {
      type: Number, // References users table
      default: null
    },
    scores: {
      innovation: { type: Number, min: 0, max: 10, default: null },
      technical: { type: Number, min: 0, max: 10, default: null },
      presentation: { type: Number, min: 0, max: 10, default: null },
      impact: { type: Number, min: 0, max: 10, default: null },
      overall: { type: Number, min: 0, max: 10, default: null }
    },
    totalScore: {
      type: Number,
      default: null
    },
    judgeComments: {
      type: String,
      trim: true,
      default: ''
    },
    rank: {
      type: Number,
      default: null
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    prize: {
      type: String,
      default: null // "1st Place", "2nd Place", "Best Innovation", etc.
    },
    judgedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
