const mongoose = require('mongoose');

const reqParamsSchema = new mongoose.Schema({
  destination_id: String,
  hotel_id: String,
  checkin: String,
  checkout: String,
  lang: String,
  currency: String,
  guests: String,
  partner_id: { type: Number, default: 1098 }
}, { _id: false });

const hotelResultsSchema = new mongoose.Schema({
  cachedAt: { type: Date, default: Date.now },
  expireAt: { type: Date },
  reqParams: reqParamsSchema,
  data1: mongoose.Schema.Types.Mixed,
  data2: [Object]
});

// unique “one doc per reqParams” (order-agnostic because we index fields individually)
hotelResultsSchema.index({
  'reqParams.destination_id': 1,
  'reqParams.hotel_id': 1,
  'reqParams.checkin': 1,
  'reqParams.checkout': 1,
  'reqParams.lang': 1,
  'reqParams.currency': 1,
  'reqParams.guests': 1,
  'reqParams.partner_id': 1
}, { unique: true });

// TTL auto-delete when now >= expireAt
hotelResultsSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('hotelresultscache', hotelResultsSchema );