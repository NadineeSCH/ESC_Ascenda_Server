const express = require("express");
var router = express.Router();
const poller = require("../utils/utils.js").poller;

router.post("/", async function (req, res, next) {
  res.set("Access-Control-Allow-Origin", "http://localhost:5000");

  try {
    const { destinationId, checkin, checkout, guests } = req.body;

    // Step 1: Get hotels for the destination
    const hotelsUrl = `https://hotelapi.loyalty.dev/api/hotels?destination_id=${destinationId}`;
    
    let hotelsResponse;
    try {
      const response = await fetch(hotelsUrl);
      hotelsResponse = await response.json();
    } catch (error) {
      console.error("Error fetching hotels:", error);
      return res.status(500).json({ error: "Failed to fetch hotels" });
    }

    // Step 2: Get pricing for all hotels
    const pricesUrl = `https://hotelapi.loyalty.dev/api/hotels/prices?destination_id=${destinationId}&checkin=${checkin}&checkout=${checkout}&lang=en_US&currency=SGD&country_code=SG&guests=${guests}&partner_id=1`;
    
    let pricesData;
    try {
      pricesData = await poller(pricesUrl);
    } catch (error) {
      console.error("Error fetching prices:", error);
      return res.status(500).json({ error: "Failed to fetch hotel prices" });
    }

    // Step 3: Combine hotel details with pricing
    const hotelsWithPrices = [];
    
    if (hotelsResponse && Array.isArray(hotelsResponse)) {
      for (const hotel of hotelsResponse) {
        // Find price for this hotel
        const priceInfo = pricesData.hotels?.find(p => p.id === hotel.id);
        
        const hotelWithPrice = {
          id: hotel.id,
          name: hotel.name,
          rating: hotel.rating,
          address: hotel.address,
          description: hotel.description,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          categories: hotel.categories,
          amenities: hotel.amenities,
          image_details: hotel.image_details,
          price: priceInfo ? priceInfo.price : null,
          searchRank: priceInfo ? priceInfo.searchRank : null,
          market_rates: priceInfo ? priceInfo.market_rates : null
        };
        
        hotelsWithPrices.push(hotelWithPrice);
      }
    }

    // Sort by search rank if available, otherwise by price
    hotelsWithPrices.sort((a, b) => {
      if (a.searchRank && b.searchRank) {
        return a.searchRank - b.searchRank;
      }
      if (a.price && b.price) {
        return a.price - b.price;
      }
      return 0;
    });

    res.json(hotelsWithPrices);

  } catch (error) {
    console.error("Error in search hotels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;