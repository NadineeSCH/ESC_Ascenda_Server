const express = require("express");
var router = express.Router();
const hotelDetailsController = require("../controller/hotelDetailsController")

router.post("/", hotelDetailsController.getHotelDetails);

module.exports = router;
