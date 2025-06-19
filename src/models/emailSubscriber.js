import mongoose from "mongoose";

const emailSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

const EmailSubscriber = mongoose.model("EmailSubscriber", emailSubscriberSchema);
export default EmailSubscriber;

