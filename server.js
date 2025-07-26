const express = require("express");
const app = express();
app.use(express.json());
app.listen(3000);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("hello");
});

const hoteldetailsRouter = require("./routes/hotelDetailsRouter");
app.use("/hoteldetails", hoteldetailsRouter);
