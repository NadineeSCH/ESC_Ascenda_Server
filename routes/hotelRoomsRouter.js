const express = require("express");
var router = express.Router();
const hotelRoomsController = require("../controller/hotelRoomsController")

router.post("/", hotelRoomsController.getRoomDetails);

module.exports = router;
