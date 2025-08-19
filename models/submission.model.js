import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
    },
    teamId: {
      type: Number,
      required: true,
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
