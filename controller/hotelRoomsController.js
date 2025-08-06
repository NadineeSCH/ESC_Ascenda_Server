const hotelRoomsService = require("../service/hotelRoomsService");

async function getRoomDetails(req, res, next) {
  
  // Date validation
  try {
    const checkinDate = new Date(req.body.checkin);
    const checkoutDate = new Date(req.body.checkout);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    // Check if checkin date is earlier than 3 days from today
    if (checkinDate < threeDaysFromNow) {
      return res.status(400).json({
        error: "Invalid checkin date",
        message: "Check-in date must be at least 3 days from today",
        details: {
          endpoint: "getRoomDetails",
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
          endpoint: "getRoomDetails",
          timestamp: new Date().toISOString(),
        }
      });
    }
  } catch (dateError) {
    return res.status(400).json({
      error: "Invalid date format",
      message: "Please provide valid checkin and checkout dates",
      details: {
        endpoint: "getRoomDetails",
        timestamp: new Date().toISOString(),
      }
    });
  }
  
  try {
    res.set("Access-Control-Allow-Origin", "http://localhost:5001");
    const result = await hotelRoomsService.getRoomDetails(req.body);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        error: "Service layer failed",
        message: result.error,
        details: result.details,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Controller layer failed",
      message: error.message,
      details: {
        endpoint: "getRoomDetails",
        timestamp: new Date().toISOString(),
      }
    });
  }
}

module.exports = {
  getRoomDetails,
};