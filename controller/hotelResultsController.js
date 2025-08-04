let dto = require('../DTO/DTO.js');
const hotelResultsService = require('../service/hotelResultsService.js');

async function getSearchResults(req, res, next) {

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "Empty JSON Body",
            message: "Please provide a proper JSON body",
            details: {
                endpoint: "hotelResultsController",
            }
        });
    }

    // Checking if basic fields are missing
    const requiredFields = ["destination_id", "checkin", "checkout", "lang", "currency", "guestsEachRoom", "rooms", "sort_exist", "filter_exist"]
    for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
            return res.status(400).json({
                error: `Missing ${field}`,
                message: `Please add ${field} to the JSON body`,
                details: {
                    endpoint: "hotelResultsController",
                }
            });
        }
    }

    const checkinDate = new Date(req.body.checkin);
    const checkoutDate = new Date(req.body.checkout);

    // Check if dates are valid
    if (isNaN(checkinDate.getTime())) {
        return res.status(400).json({
            error: "Invalid checkin date",
            message: "Check-in date must be at least 3 days from today",
            details: {
                endpoint: "hotelResultsController",
                timestamp: new Date().toISOString(),
            }
        });
    }

    if (isNaN(checkoutDate.getTime())) {
        return res.status(400).json({
            error: "Invalid checkout date",
            message: "Check-out date must be after check-in date",
            details: {
                endpoint: "hotelResultsController",
                timestamp: new Date().toISOString(),
            }
        });
    }

    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    threeDaysFromNow.setHours(0, 0, 0, 0);

    // Check if checkin date is earlier than 3 days from today
    if (checkinDate < threeDaysFromNow) {
        return res.status(400).json({
            error: "Invalid checkin date",
            message: "Check-in date must be at least 3 days from today",
            details: {
                endpoint: "hotelResultsController",
                timestamp: new Date().toISOString(),
            }
        });
    }

    // Check if checkout date is before checkin date
    if (checkoutDate <= checkinDate) {
        return res.status(400).json({
            error: "Invalid checkout date",
            message: "Check-out date must be after check-in date",
            details: {
                endpoint: "hotelResultsController",
                timestamp: new Date().toISOString(),
            }
        });
    }

    //--------actual processing--------//

    const body = req.body

    const reqParams31 = new dto.ReqParam31({
        destination_id: body.destination_id,
        checkin: body.checkin,
        checkout: body.checkout,
        lang: body.lang,
        currency: body.currency
    });

    let rooms = parseInt(body.rooms);
    let guestsEachRoom = parseInt(body.guestsEachRoom);

    let guests = "";
    for (let i = 0; i < rooms - 1; i++) {
        guests = guests + guestsEachRoom + "|";
    }
    guests += guestsEachRoom; // process guests to the desired format
    reqParams31.guests = guests;

    const reqParams32 = new dto.ReqParam32({ destination_id: req.body.destination_id });

    let sort;
    if (body.sort_exist) {
        sort = new dto.sortParams({ sort_var: body.sort_var, reverse: body.reverse })
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
            reqParams: body,
            data: searchResult.data
        });

    } catch (error) {
        console.error('controller error:', error);
        if (error.cause) {
            console.error('caused by:', error.cause);
        }
        return res.status(500).json({
            error: 'Failed to fetch hotel results.',
            message: error.message,
            details: {
                controller: "hotelResultsController",
                timestamp: new Date().toISOString()
            }
        });
    }
}

module.exports = {
    getSearchResults
}