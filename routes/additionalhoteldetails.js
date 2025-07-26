const express = require("express");
var router = express.Router();
const poller = require("../utils/utils.js").poller;

router.post("/:hotelId", async function (req, res, next){
    res.set("Access-Control-Allow-Origin", "http://localhost:5000");

    // generating target url
    const hotelId = req.params.hotelId;
    const targetUrl = `https://hotelapi.loyalty.dev/api/hotels/${hotelId}`;

    let hotelData = await poller(targetUrl);

    const cleanedAdditionalHotelData = {
      id: hotelData.id,
      name: hotelData.name,
      address: hotelData.address,
      rating: hotelData.rating,
      latitude: hotelData.latitude,
      longitude: hotelData.longitude,
      description: hotelData.description,
      amenities: hotelData.amenities,
      categories: hotelData.categories,
      amenities_ratings: hotelData.amenities_ratings,
      image_details: hotelData.image_details,
      imageCount: hotelData.imageCount,
      number_of_images: hotelData.number_of_images,
      default_image_index: hotelData.default_image_index,
      hires_image_index: hotelData.hires_image_index,
      checkin_time: hotelData.checkin_time,
    };

    res.json(cleanedAdditionalHotelData);

});

module.exports = router;