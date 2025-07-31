const hotelDetailsService = require("../service/hotelDetailsService");

async function getHotelDetails(req, res, next) {
  try {
    const result = await hotelDetailsService.getHotelDetails(req);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        error: "Hotel details fetch failed",
        message: result.error,
        details: result.details,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Hotel details fetch failed",
      message: error.message,
      details: {
        controller: "hotelDetailsController",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = {
  getHotelDetails,
};