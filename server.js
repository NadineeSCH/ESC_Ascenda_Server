const express = require("express");
const cors = require("cors");
const app = express();

// Allows frontend on port 3000 to make requests
app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

// Setting backend server to be on port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("hello");
});

console.log("Running from", __dirname);

app.get("/test", (req, res) => {
  res.send("Server is working!");
});

// Individual route imports
const hotelRoomsRouter = require("./routes/hotelRoomsRouter");
const hotelDetailsRouter = require("./routes/hotelDetailsRouter");
const hotelResultsRouter = require("./routes/hotelResultsRouter");

// Combined route import (orchestrator)
const combinedHotelDataRouter = require("./routes/combinedHotelDataRouter");

// Individual endpoints
app.use("/hotelrooms", hotelRoomsRouter);           // For room data only
app.use("/hoteldetails", hotelDetailsRouter);       // For hotel details only

// Combined endpoint (orchestrator)
app.use("/combined-hotel-data", combinedHotelDataRouter);

// Hotel Results endpoint
app.use("/hotelresults", hotelResultsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON payload"
    });
  }
  // Handle other errors
  res.status(500).json({ error: "Internal Server Error" });
});