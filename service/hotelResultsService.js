let utils = require('../utils/utils2.js');
let dto = require('../DTO/DTO.js');
const defaultImg = '1.jpg';

async function processSearchResults(reqParams31, reqParams32, filters, sort) {
    let data1, data2;

    
    try {
        data1 = await utils.ascendaApiCaller(1, reqParams31);
        data2 = await utils.ascendaApiCaller(2, reqParams32);
    } catch (error) {
        throw new Error(`hotelResultsService.processSearchResults failed: ${error.message}`, { cause: error });
    }

    if (!data1?.hotels || !Array.isArray(data1.hotels)) {
        throw new Error("Invalid hotel price list from data1.");
    }

    if (!Array.isArray(data2)) {
        throw new Error("Invalid hotel static info list from data2.");
    }

    const cleanedHotelList = [];

    if (data1.hotels.length === 0) {
        return { data: cleanedHotelList };
    }

    const returnedHotelListMap = new Map();
    for (const hotel of data2) {
        returnedHotelListMap.set(hotel.id, hotel);
    }

    data1.hotels.forEach((hotel) => {
        const cleanedHotel = new dto.HotelResult();
        cleanedHotel.id = utils.safeAssign(hotel.id);
        let price = utils.safeAssign(hotel.price);
        if (price === null) {
            return;
        } else {
            cleanedHotel.price = price;
        }

        const hotelStaticInfo = returnedHotelListMap.get(cleanedHotel.id) || null;
        if (hotelStaticInfo !== null) {
            cleanedHotel.name = utils.safeAssign(hotelStaticInfo.name);
            cleanedHotel.latitude = utils.safeAssign(hotelStaticInfo.latitude);
            cleanedHotel.longitude = utils.safeAssign(hotelStaticInfo.longitude);
            cleanedHotel.description = utils.safeAssign(hotelStaticInfo.description);
            cleanedHotel.address = utils.safeAssign(hotelStaticInfo.address);

            // Assign 2.5 rating if rating = null
            let rating = utils.safeAssign(hotelStaticInfo.rating)
            if (rating === null) {
                cleanedHotel.rating = 2.5;
            } else {
                cleanedHotel.rating = rating;
            }

            cleanedHotel.distance = utils.safeAssign(hotelStaticInfo.distance);
            cleanedHotel.checkinTime = utils.safeAssign(hotelStaticInfo.checkin_time);

            // Checking if deep nested properties do exit
            if (hotelStaticInfo.number_of_images !== 0 && hotelStaticInfo?.image_details?.prefix) {
                cleanedHotel.imageUrl = hotelStaticInfo.image_details.prefix + defaultImg;
            } else {
                cleanedHotel.imageUrl = null;
            }

            // Assign 70 score if score = null
            let score = utils.safeAssign(hotelStaticInfo?.trustyou?.score?.overall);
            if (score === null) {
                cleanedHotel.score = 70;
            } else {
                cleanedHotel.score = score;
            }

        } else {
            // Assign if no details in static hotels
            cleanedHotel.rating = 2.5;
            cleanedHotel.score = 70;
        }

        

        let skip = false;

        if (filters !== null) {
            if (filters.minPrice !== null && cleanedHotel.price < filters.minPrice) {
                skip = true;
            }
            if (filters.maxPrice !== null && cleanedHotel.price > filters.maxPrice) {
                skip = true;
            }
            if (filters.minRating !== null && cleanedHotel.rating < filters.minRating) {
                skip = true;
            }
            if (filters.maxRating !== null && cleanedHotel.rating > filters.maxRating) {
                skip = true;
            }
            if (filters.minScore !== null && cleanedHotel.score < filters.minScore) {
                skip = true;
            }
            if (filters.maxScore !== null && cleanedHotel.score > filters.maxScore) {
                skip = true;
            }
        }

        if (skip) return;

        cleanedHotelList.push(cleanedHotel);
    });
    
    let sortField = null;
    let reverse = false;
    if (sort !== null) {
        sortField = sort.sortVar;
        reverse = sort.reverse;
    } if (sortField !== null && (sortField === 'price' || sortField === 'rating' || sortField === 'score')) {
        cleanedHotelList.sort((a,b) => {
            /*if (a[sortField] == null && b[sortField] == null) return 0;
            if (a[sortField] == null) return 1; // move nulls to the end
            if (b[sortField] == null) return -1;*/
            if (reverse) {
                return b[sortField] - a[sortField];
            } else {
                return a[sortField] - b[sortField];
            }
        })
    }

    return { data: cleanedHotelList };
    
}


module.exports = {
    processSearchResults
}