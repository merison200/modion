import ContactMessage from "../models/contactMessage.js";
import sendEmail from "../utils/sendEmail.js";

export const contactUs = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json("All fields are required.");
    }

    // Save to DB
    await ContactMessage.create({ name, email, subject, message });

    //Send Email
    await sendEmail({
      to: email,
      subject: "Thanks for Contacting Us",
      text: `Hello ${name},\n\nThank you for reaching out to us regarding "${subject}". We have received your message and will act accordindly.\n\nModion Team`,
    });

    res.status(200).json({ message: "Message received and email sent." });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json("Something went wrong. Try again later.");
  }
};