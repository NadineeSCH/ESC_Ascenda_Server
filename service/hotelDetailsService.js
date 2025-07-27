const poller = require("../utils/utils.js").poller;

async function getHotelDetails(req) {
  try {
    // construct target URL for room details
    let guestsEachRoom = req.body.guestsEachRoom;
    let rooms = req.body.rooms;
    let guests = "";
    for (let i = 0; i < rooms - 1; i++) {
      guests = guests + guestsEachRoom + "|";
    }
    guests += guestsEachRoom;
    const roomUrl = `https://hotelapi.loyalty.dev/api/hotels/${req.body.hotelId}/price?destination_id=${req.body.destinationId}&checkin=${req.body.checkin}&checkout=${req.body.checkout}&lang=en_US&currency=${req.body.currency}&country_code=SG&guests=${guests}&partner_id=1`;

    // construct target URL for additional hotel details
    const hotelUrl = `https://hotelapi.loyalty.dev/api/hotels/${req.body.hotelId}`;

    let roomData, hotelData;
    try {
      // Fetch both APIs concurrently for better performance
      [roomData, hotelData] = await Promise.all([
        poller(roomUrl),
        poller(hotelUrl)
      ]);
    } catch (error) {
      throw new Error(`Failed to fetch from external API: ${error.message}`);
    }
    
    let cleanedJson = [];

    for (const room of data.rooms) {
      const cleanedRoom = {
        roomNormalizedDescription: room.roomNormalizedDescription,
        free_cancellation: room.free_cancellation,
        breakfastInfo: room.roomAdditionalInfo?.breakfastInfo, // Using optional chaining
        additionalInfo: room.roomAdditionalInfo,
        longDesc: room.long_description,
        price: room.price,
      };

      // Find hero image
      const heroImage = room.images?.find((image) => image.hero_image === true);
      if (heroImage) {
        cleanedRoom.image = heroImage.url;
      }

      cleanedJson.push(cleanedRoom);
    }

    return { success: true, data: cleanedJson };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: {
        endpoint: "hotelDetailsService",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = {
  getHotelDetails,
};
