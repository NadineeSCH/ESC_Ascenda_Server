const express = require("express");
var router = express.Router();
const hotelRoomsController = require("../controller/hotelRoomsController")

console.log("in hotelroomsrouter");

router.post("/", hotelRoomsController.getRoomDetails);

module.exports = router;
