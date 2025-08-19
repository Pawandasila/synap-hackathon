import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
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
