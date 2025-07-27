const express = require("express");
const app = express();
app.use(express.json());
app.listen(3000);

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

// Combined route import (orchestrator)
const combinedHotelDataRouter = require("./routes/combinedHotelDataRouter");

// Individual endpoints
app.use("/hotelrooms", hotelRoomsRouter);           // For room data only
app.use("/hoteldetails", hotelDetailsRouter);       // For hotel details only

// Combined endpoint (orchestrator)
app.use("/combined-hotel-data", combinedHotelDataRouter);