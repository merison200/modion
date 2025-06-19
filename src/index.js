import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routers/authRoutes.js";
import articleRoutes from "./routers/articleRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import subscribeRoutes from "./routers/subsribeRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS setup
app.use(
  cors({
    origin: ['https://modion.vercel.app', 'http://localhost:5173'],
    credentials: true,
  })
);

// Connect to DB
await connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api", contactRoutes);
app.use("/api", subscribeRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
