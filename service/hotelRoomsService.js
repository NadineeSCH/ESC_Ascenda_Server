const poller = require("../utils/utils.js").poller;

async function getRoomDetails(req) {
  try {
    //construct target url
    let guestsEachRoom = req.guestsEachRoom;
    let rooms = req.rooms;
    let guests = "";
    for (let i = 0; i < rooms - 1; i++) {
      guests = guests + guestsEachRoom + "|";
    }
    guests += guestsEachRoom;
    const targetUrl = `https://hotelapi.loyalty.dev/api/hotels/${req.hotel_id}/price?destination_id=${req.destination_id}&checkin=${req.checkin}&checkout=${req.checkout}&lang=en_US&currency=${req.currency}&country_code=SG&guests=${guests}&partner_id=1089&landing_page=wl-acme-earn&product_type=earn`;
    let data;

    data = await poller(targetUrl);

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
  getRoomDetails,
};
