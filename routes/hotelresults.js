var express = require('express');
var router = express.Router();
const hotelResultsController = require('../controllers/hotelResultsController.js');

router.get('/', hotelResultsController.getSearchResults);

module.exports = router;

