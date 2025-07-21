const express = require("express");
var router = express.Router();
const poller = require("../utils/utils.js").poller;

router.get("/", async function (req, res, next) {
  res.set("Access-Control-Allow-Origin", "http://localhost:5000");

  //construct target url
  let guestsEachRoom = req.query.guestsEachRoom;
  let rooms = req.query.rooms;
  let guests = "";
  for (let i = 0; i < rooms - 1; i++) {
    guests = guests + guestsEachRoom[i] + "|";
  }
  guests += guestsEachRoom;
  //const targetUrl = `https://hotelapi.loyalty.dev/api/hotels/${req.body.hotelId}/price?destination_id=${req.body.destinationId}&checkin=${req.body.checkin}&checkout=${req.body.checkout}&lang=${req.body.lang}&currency=${req.body.currency}&country_code=SG&guests=${guests}&partner_id=1`;
  
  //dummy to test polling
  const targetUrl =
    "https://hotelapi.loyalty.dev/api/hotels/diH7/price?destination_id=WD0M&checkin=2025-10-11&checkout=2025-10-17&lang=en_US&currency=SGD&country_code=SG&guests=2&partner_id=1";
  let data = await poller(targetUrl);

  res.json(data);
});

module.exports = router;
