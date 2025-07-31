var express = require('express');
var router = express.Router();
const hotelResultsController = require('../controller/hotelResultsController.js');

router.post('/', hotelResultsController.getSearchResults);

module.exports = router;
