import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
    },
    authorId: {
      type: Number,
      required: true,
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
