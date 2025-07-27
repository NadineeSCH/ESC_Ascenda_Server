const hotelDetailsService = require("../service/hotelRoomsService");

async function getHotelDetails(req, res, next) {
  try {
    res.set("Access-Control-Allow-Origin", "http://localhost:5000");
    const result = await hotelDetailsService.getHotelDetails(req);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        error: "Hotel data fetch failed",
        message: result.error,
        details: result.details,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Hotel data fetch failed",
      message: result.error,
      details: result.details,
    });
  }
}

module.exports = {
  getHotelDetails,
};
