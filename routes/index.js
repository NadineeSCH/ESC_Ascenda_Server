const express = require('express');
const router = express.Router();

// import and attach route modules
const hotelResultsRoutes = require('./hotelresults');
router.use('/hotelresults', hotelResultsRoutes);

module.exports = router;

