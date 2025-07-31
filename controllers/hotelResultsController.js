let dto = require('../DTO/DTO.js');
const hotelResultsService = require('../services/hotelResultsService.js');

async function getSearchResults(req, res, next) {
    const body = req.body

    const reqParams31 = new dto.ReqParam31({
        destination_id: body.destination_id, 
        checkin: body.checkin, 
        checkout: body.checkout,
        lang: body.lang,
        currency: body.currency});

        let rooms = parseInt(body.rooms);
        let guestsEachRoom = parseInt(body.guestsEachRoom);
        
        let guests = "";
        for (let i = 0; i < rooms - 1; i++) {
            guests = guests + guestsEachRoom + "|";
        }
        guests += guestsEachRoom; // process guests to the desired format
        reqParams31.guests = guests;
    
    const reqParams32 = new dto.ReqParam32({destination_id: req.body.destination_id});
    
    let sort;
    if (body.sort_exist) {
        sort = new dto.sortParams({sort_var: body.sort_var, reverse: body.reverse})
    } else {
        sort = null;
    }

    let filters;
    if (body.filter_exist) {
        filters = new dto.filterParams(body.filters)
    } else {
        filters = null;
    }
    
    
    try {
        const searchResult = await hotelResultsService.processSearchResults(reqParams31, reqParams32, filters, sort);
        res.status(200).json({
                reqParams : body,
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