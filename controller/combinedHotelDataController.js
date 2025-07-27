const hotelDetailsService = require("../service/hotelDetailsService");
const hotelRoomsService = require("../service/hotelRoomsService");

async function getCombinedHotelData(req, res, next) {
  try {
    res.set("Access-Control-Allow-Origin", "http://localhost:5000");
    
    // Call both services concurrently for better performance
    const [hotelDetailsResult, hotelRoomsResult] = await Promise.all([
      hotelDetailsService.getHotelDetails(req),
      hotelRoomsService.getHotelDetails(req)
    ]);

    // Check if both services succeeded
    if (!hotelDetailsResult.success) {
      return res.status(500).json({
        error: "Hotel details fetch failed",
        message: hotelDetailsResult.error,
        details: hotelDetailsResult.details,
      });
    }

    if (!hotelRoomsResult.success) {
      return res.status(500).json({
        error: "Hotel rooms fetch failed",
        message: hotelRoomsResult.error,
        details: hotelRoomsResult.details,
      });
    }

    // Combine the data from both services
    const combinedData = {
      hotelDetails: hotelDetailsResult.data,
      rooms: hotelRoomsResult.data
    };

    res.json(combinedData);

  } catch (error) {
    res.status(500).json({
      error: "Combined hotel data fetch failed",
      message: error.message,
      details: {
        controller: "combinedHotelDataController",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

module.exports = {
  getCombinedHotelData,
};