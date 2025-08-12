let dto = require('../DTO/DTO.js');
const hotelResultsService = require('../service/hotelResultsService.js');
const HotelResponse = require('../models/HotelResultsCache'); 


async function getSearchResults(req, res, next) {

    let body = req.body;

    if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({
            error: "Empty JSON Body",
            message: "Please provide a proper JSON body",
            details: {
                endpoint: "hotelResultsController",
            }
        });
    }

    const requiredFields = {
        destination_id: 'string',
        checkin: 'string',
        checkout: 'string',
        lang: 'string',
        currency: 'string',
        guestsEachRoom: ['string', 'number'],
        rooms: ['string', 'number'],
        sort_exist: 'boolean',
        filter_exist: 'boolean'
    };

    for (const [field, expectedType] of Object.entries(requiredFields)) {
        const value = body[field];

        const isMissing = value === undefined || value === null || value === '';
        const isInvalidType = Array.isArray(expectedType)
            ? !expectedType.includes(typeof value)
            : typeof value !== expectedType;

        if (isMissing || isInvalidType) {
            return res.status(400).json({
                error: `Invalid or missing ${field}`,
                message: `Field ${field} must be of type ${expectedType}`,
                details: {
                    endpoint: "hotelResultsController",
                    actualType: typeof value,
                    received: value
                }
            });
        }
    }

    const checkinDate = new Date(body.checkin);
    const checkoutDate = new Date(body.checkout);

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


    // optional: validate sort params if present
    let sort;
    if (body.sort_exist) {
        const { sort_var, reverse } = body;
        if (typeof sort_var !== 'string' || (typeof reverse !== 'number' && typeof reverse !== 'boolean')) {
            return res.status(400).json({
                error: "Invalid sort parameters",
                message: "If sort_exist is true, sort_var must be string and reverse must be number or boolean",
                details: {
                    endpoint: "hotelResultsController"
                }
            });
        } 
        if (['price', 'rating', 'score'].includes(sort_var) === false) {
            return res.status(400).json({
                error: "Invalid sort_var parameter",
                message: "sort_var is not 'price', 'rating' or 'score'",
                details: {
                    endpoint: "hotelResultsController"
                }
            });
        }

        sort = new dto.sortParams({ sort_var: sort_var, reverse: reverse })

    } else {
        sort = null;
    }


    let filters;
    // optional: validate filter params if present
    if (body.filter_exist) {
        const filters_body = body.filters;

        if (typeof filters_body !== 'object' || filters_body === null) {
            return res.status(400).json({
                error: "Missing or invalid filters",
                message: "If filter_exist is true, filters must be an object",
                details: {
                    endpoint: "hotelResultsController"
                }
            });
        }

        const numericFields = ["minPrice", "maxPrice", "minRating", "maxRating", "minScore", "maxScore"];
        for (const key of numericFields) {
            const val = filters_body[key];
            if (val !== null && typeof val !== "number") {
                return res.status(400).json({
                    error: `Invalid type for filters.${key}`,
                    message: `filters.${key} must be a number or null`,
                    details: {
                        endpoint: "hotelResultsController",
                        received: val
                    }
                });
            }
        }

        filters = new dto.filterParams(filters_body)
    } else {
        filters = null;
    }

    // Check cache database before sending request
    // HotelResponse.findOne({
    // "reqParams.destination_id": destination_id,
    // "reqParams.checkin": checkin,
    // "reqParams.checkout": checkout,
    // "reqParams.lang": lang,
    // "reqParams.currency": currency,
    // "reqParams.guestsEachRoom": guestsEachRoom,
    // "reqParams.rooms": rooms,
    // // you can also check filters and sorting if needed
    // }).then(cachedResult => {
    //     if (cachedResult) {
    //     // Return cached data to frontend
    //     res.json(cachedResult);
    //     } else {
    //     continue;
    //     }
    // }).catch(err => {
    //     console.error("DB query error:", err);
    //     res.status(500).json({ error: "Caching DB error" });
    // });

    //--------ReqParams31 and ReqParams32 processing--------//

    // Create cache query object matching your schema structure
    const cacheQuery = {
        "reqParams.destination_id": body.destination_id,
        "reqParams.checkin": body.checkin,
        "reqParams.checkout": body.checkout,
        "reqParams.lang": body.lang,
        "reqParams.currency": body.currency,
        "reqParams.guestsEachRoom": String(guestsEachRoom),
        "reqParams.rooms": String(rooms),
        "reqParams.filter_exist": body.filter_exist,
        "reqParams.sort_exist": body.sort_exist
    };
// Add sort parameters to cache query if they exist
    if (body.sort_exist && sort) {
        cacheQuery["reqParams.sort_var"] = sort.sort_var;
        cacheQuery["reqParams.reverse"] = sort.reverse;
    }

    // Add filter parameters to cache query if they exist
    if (body.filter_exist && filters) {
        // Check for specific filter values
        if (filters.minPrice !== null && filters.minPrice !== undefined) {
            cacheQuery["reqParams.filters.minPrice"] = filters.minPrice;
        }
        if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
            cacheQuery["reqParams.filters.maxPrice"] = filters.maxPrice;
        }
        if (filters.minRating !== null && filters.minRating !== undefined) {
            cacheQuery["reqParams.filters.minRating"] = filters.minRating;
        }
        if (filters.maxRating !== null && filters.maxRating !== undefined) {
            cacheQuery["reqParams.filters.maxRating"] = filters.maxRating;
        }
        if (filters.minScore !== null && filters.minScore !== undefined) {
            cacheQuery["reqParams.filters.minScore"] = filters.minScore;
        }
        if (filters.maxScore !== null && filters.maxScore !== undefined) {
            cacheQuery["reqParams.filters.maxScore"] = filters.maxScore;
        }
    }

    // Check cache database first
    const cachedResult = await HotelResponse.findOne(cacheQuery);

    if (cachedResult) {
        console.log('Cache hit - returning cached data');
        return res.status(200).json({
            reqParams: body,
            data: cachedResult.data,
        });
    }

    // Cache miss
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

    const reqParams32 = new dto.ReqParam32({ destination_id: body.destination_id });

    try {
        const searchResult = await hotelResultsService.processSearchResults(reqParams31, reqParams32, filters, sort);
        res.status(200).json({
            reqParams: body,
            data: searchResult.data
        });
        // Save results to cache after successful service call
        const cacheData = new HotelResponse({
            reqParams: {
                destination_id: body.destination_id,
                checkin: body.checkin,
                checkout: body.checkout,
                lang: body.lang,
                currency: body.currency,
                rooms: String(rooms),
                guestsEachRoom: String(guestsEachRoom),
                filter_exist: body.filter_exist,
                filters: body.filter_exist ? filters : undefined,
                sort_exist: body.sort_exist,
                sort_var: body.sort_exist && sort ? sort.sort_var : undefined,
                reverse: body.sort_exist && sort ? sort.reverse : undefined
            },
            data: searchResult.data
            // cachedAt is automatically set by schema default
        });
        // Save to cache (fire and forget - don't wait for it to complete)
        cacheData.save().catch(error => {
            console.error('Failed to save to cache:', error);
            // Don't fail the request if caching fails
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