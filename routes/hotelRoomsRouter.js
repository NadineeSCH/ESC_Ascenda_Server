const express = require("express");
var router = express.Router();
const roomDetailsController = require("../controller/hotelRoomsController")

router.post("/", roomDetailsController.getRoomDetails);

module.exports = router;
