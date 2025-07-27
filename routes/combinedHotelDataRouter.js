const express = require("express");
var router = express.Router();
const combinedHotelDataController = require("../controller/combinedHotelDataController");

router.post("/", combinedHotelDataController.getCombinedHotelData);

module.exports = router;