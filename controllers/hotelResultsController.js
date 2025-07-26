let dto = require('../DTO/DTO.js');
const hotelResultsService = require('../services/hotelResultsService.js');

async function getSearchResults(req, res, next) {
    const reqParams31 = new dto.ReqParam31(req.query);
    const reqParams32 = new dto.ReqParam32({destination_id: req.query.destination_id});
    try {
        const searchResult = await hotelResultsService.processSearchResults(reqParams31, reqParams32, req);
        res.status(200).json({
                reqParams : req.query,
                data: searchResult
            });

    } catch (error) {
        console.error('controller error:', error);
        if (error.cause) {
            console.error('caused by:', error.cause);
        }
        res.status(500).json({
            error: 'Failed to fetch hotel results.',
            message: error.message,
        });
    }
}

module.exports = {
    getSearchResults
}