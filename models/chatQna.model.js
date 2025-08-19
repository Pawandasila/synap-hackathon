import mongoose from "mongoose";

const chatQnASchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
    },
    fromUserId: {
      type: Number,
      required: true,
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
