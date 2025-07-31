var express = require('express');
var router = express.Router();
const hotelResultsController = require('../controllers/hotelResultsController.js');

router.post('/', hotelResultsController.getSearchResults);

module.exports = router;

