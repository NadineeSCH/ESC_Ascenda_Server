const poller = require("../utils/utils.js").poller;

async function getRoomDetails(req) {
  try {
    //construct target url
          // Check if checkout date is before checkin date
    // try {
    //   if (checkoutDate <= checkinDate) {
    //     return res.status(400).json({
    //       error: "Invalid checkout date",
    //       message: "Check-out date must be after check-in date",
    //       details: {
    //         endpoint: "getRoomDetails",
    //         timestamp: new Date().toISOString(),
    //       }
    //     });
    //   }
    // } catch (dateError) {
    //   return res.status(400).json({
    //     error: "Invalid date format",
    //     message: "Please provide valid checkin and checkout dates",
    //     details: {
    //       endpoint: "getRoomDetails",
    //       timestamp: new Date().toISOString(),
    //     }
    //   });
    // }
    let guestsEachRoom = req.body.guestsEachRoom;
    let rooms = req.body.rooms;
    let guests = "";
    for (let i = 0; i < rooms - 1; i++) {
      guests = guests + guestsEachRoom + "|";
    }
    guests += guestsEachRoom;
    const targetUrl = `https://hotelapi.loyalty.dev/api/hotels/${req.body.hotelId}/price?destination_id=${req.body.destinationId}&checkin=${req.body.checkin}&checkout=${req.body.checkout}&lang=en_US&currency=${req.body.currency}&country_code=SG&guests=${guests}&partner_id=1089&landing_page=wl-acme-earn&product_type=earn`;
    
    let data;
    try {
      data = await poller(targetUrl);
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
        endpoint: "roomDetailsService",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = {
  getRoomDetails,
};