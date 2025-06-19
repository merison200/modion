import EmailSubscriber from "../models/emailSubscriber.js";
import sendEmail from "../utils/sendEmail.js";

export const subscribeUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json("Email is required");
  }

  try {
    // Prevent duplicates
    const existing = await EmailSubscriber.findOne({ email });
    if (existing) {
      return res.status(409).json("You're already subscribed");
    }

    // Save subscriber
    await EmailSubscriber.create({ email });

    // Send thank-you email
    await sendEmail({
      to: email,
      subject: "Thanks for Subscribing!",
      text: `Hi there,\n\nThanks for subscribing to our website! We'll notify you when we have new updates, promotions, or exciting content.\n\nModion Team`,
    });

    res.status(201).json("Subscription successful!");
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json("Something went wrong");
  }
};