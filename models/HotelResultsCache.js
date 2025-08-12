const mongoose = require('mongoose');

const filterSchema = new mongoose.Schema({
  minPrice: Number,
  maxPrice: Number,
  minRating: Number,
  maxRating: Number,
  minScore: Number,
  maxScore: Number
}, { _id: false });

const reqParamsSchema = new mongoose.Schema({
  destination_id: String,
  hotel_id: String,
  checkin: String,
  checkout: String,
  lang: String,
  currency: String,
  rooms: String,
  guestsEachRoom: String,
  filter_exist: Boolean,
  filters: filterSchema,
  sort_exist: Boolean,
  sort_var: String,
  reverse: Boolean
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  id: String,
  price: Number,
  name: String,
  latitude: Number,
  longitude: Number,
  description: String,
  address: String,
  rating: Number,
  distance: Number,
  checkinTime: String,
  imageUrl: String,
  score: Number
}, { _id: false });

const hotelResultsSchema = new mongoose.Schema({
  cachedAt: { type: Date, default: Date.now },  // optional timestamp for caching
  reqParams: reqParamsSchema,
  data: [hotelSchema] // array of hotels
  
});

module.exports = mongoose.model('HotelResultsCache', hotelResultsSchema, 'hotelresultscache');
