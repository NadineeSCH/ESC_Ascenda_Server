const hotelDetailsService = require("../service/hotelDetailsService");
const hotelRoomsService = require("../service/hotelRoomsService");

async function getCombinedHotelData(req, res, next) {
  // Checks if JSON body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Empty JSON Body",
      message: "Please provide a proper JSON body",
      details: {
        endpoint: "combinedHotelDataController",
      }
    });
  }

  // Checks if JSON request is invalid for hotelDetailsService and hotelRoomsService
  const requiredFields = ["hotel_id", "destination_id", "checkin", "checkout", "currency", "guestsEachRoom", "rooms"]
  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === ''){
      return res.status(400).json({
        error: `Missing ${field}`,
        message: `Please add ${field} to the JSON body`,
        details: {
          endpoint: "combinedHotelDataController",
        }
      });
    }
  }

  const checkinDate = new Date(req.body.checkin);
  const checkoutDate = new Date(req.body.checkout);
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
  threeDaysFromNow.setHours(0, 0, 0, 0);
    
  // Check if checkin date is earlier than 3 days from today
  if (checkinDate < threeDaysFromNow) {
    return res.status(400).json({
      error: "Invalid checkin date",
      message: "Check-in date must be at least 3 days from today",
      details: {
        endpoint: "combinedHotelDataController",
        timestamp: new Date().toISOString(),
      }
    });
  }
    
  // Check if checkout date is before checkin date
  if (checkoutDate <= checkinDate) {
    return res.status(400).json({
      error: "Invalid checkout date",
      message: "Check-out date must be after check-in date",
      details: {
        endpoint: "combinedHotelDataController",
        timestamp: new Date().toISOString(),
      }
    });
  }

  let hotelDetailsResult, hotelRoomsResult;
  try {
    // Call both services concurrently for better performance
    [hotelDetailsResult, hotelRoomsResult] = await Promise.all([
      hotelDetailsService.getHotelDetails(req.body.hotel_id),
      hotelRoomsService.getRoomDetails(req.body)
    ]);

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
  // Combine the data from both services
  const combinedData = {
    hotelDetails: hotelDetailsResult.data,
    rooms: hotelRoomsResult.data
  };

  res.json(combinedData);
}

module.exports = {
  getCombinedHotelData,
};