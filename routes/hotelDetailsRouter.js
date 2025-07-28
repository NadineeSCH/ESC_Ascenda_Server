const express = require("express");
var router = express.Router();
const hotelDetailsController = require("../controller/hotelDetailsController");

router.post("/", (req, res, next) => {
  hotelDetailsController.getHotelDetails(req, res, next);
});

module.exports = router;