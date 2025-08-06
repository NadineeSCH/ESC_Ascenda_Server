require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Helmet can be enabled if needed
// app.use(helmet.hsts({
//   maxAge: 31536000, 
//   includeSubDomains: true, 
//   preload: true 
// }));

// Apply rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true,
});
app.use("/api/auth/login", authLimiter);

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many payment requests. Try again later.",
});
app.use("/api/payments", paymentLimiter);

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many profile requests",
});
app.use("/api/profile", profileLimiter);

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // frontend CORS
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// View engine
app.set("view engine", "ejs");

// Routes: basic pages
app.get("/", (req, res) => {
  res.render("hello");
});

app.get("/test", (req, res) => {
  res.send("Server is working!");
});

console.log("Running from", __dirname);

// Auth & payments
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);

// Hotel APIs
const hotelRoomsRouter = require("./routes/hotelRoomsRouter");
const hotelDetailsRouter = require("./routes/hotelDetailsRouter");
const hotelResultsRouter = require("./routes/hotelResultsRouter");
const combinedHotelDataRouter = require("./routes/combinedHotelDataRouter");

app.use("/hotelrooms", hotelRoomsRouter);
app.use("/hoteldetails", hotelDetailsRouter);
app.use("/combined-hotel-data", combinedHotelDataRouter);
app.use("/hotelresults", hotelResultsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON payload",
    });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
