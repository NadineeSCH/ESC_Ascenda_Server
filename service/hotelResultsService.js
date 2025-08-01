let utils = require('../utils/utils.js');
let dto = require('../DTO/DTO.js');
const defaultImg = '1.jpg';

async function processSearchResults(reqParams31, reqParams32, filters, sort) {
    try {
        const data1 = await utils.ascendaApiCaller(1, reqParams31);
        const data2 = await utils.ascendaApiCaller(2, reqParams32);

        if (!data1?.hotels || !Array.isArray(data1.hotels)) {
            throw new Error("Invalid hotel price list from data1.");
        }

        if (!Array.isArray(data2)) {
            throw new Error("Invalid hotel static info list from data2.");
        }

        const cleanedHotelList = [];

        if (data1.hotels.length === 0) {
            return cleanedHotelList;
        }

        const returnedHotelListMap = new Map();
        for (const hotel of data2) {
            returnedHotelListMap.set(hotel.id, hotel);
        }

        data1.hotels.forEach((hotel) => {
            const cleanedHotel = new dto.HotelResult();
            cleanedHotel.id = utils.safeAssign(hotel.id);
            cleanedHotel.price = utils.safeAssign(hotel.price)

            const hotelStaticInfo = returnedHotelListMap.get(cleanedHotel.id) || null;
            if (hotelStaticInfo !== null) {
                cleanedHotel.name = utils.safeAssign(hotelStaticInfo.name);
                cleanedHotel.latitude = utils.safeAssign(hotelStaticInfo.latitude);
                cleanedHotel.longitude = utils.safeAssign(hotelStaticInfo.longitude);
                cleanedHotel.description = utils.safeAssign(hotelStaticInfo.description);
                cleanedHotel.address = utils.safeAssign(hotelStaticInfo.address);
                // Assign 2.5 rating if rating = null
                if (utils.safeAssign(hotelStaticInfo.rating) === null) {
                    cleanedHotel.rating = 2.5;
                } else {
                    cleanedHotel.rating = hotelStaticInfo.rating;
                }
                cleanedHotel.distance = utils.safeAssign(hotelStaticInfo.distance);
                cleanedHotel.checkinTime = utils.safeAssign(hotelStaticInfo.checkin_time);
                if (hotelStaticInfo.number_of_images !== 0) {
                    cleanedHotel.imageUrl = hotelStaticInfo.image_details.prefix + defaultImg;
                } else {
                    cleanedHotel.imageUrl = null;
                }
                let score = utils.safeAssign(hotelStaticInfo.trustyou.score.overall);
                // Assign 70 score if score = null
                if (score === null) {
                    cleanedHotel.score = 70;
                } else {
                    cleanedHotel.score = score;
                }
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
                if (a[sortField] == null && b[sortField] == null) return 0;
                if (a[sortField] == null) return 1; // move nulls to the end
                if (b[sortField] == null) return -1;
                if (reverse) {
                    return b[sortField] - a[sortField];
                } else {
                    return a[sortField] - b[sortField];
                }
            })
        }

        return cleanedHotelList;
    } catch (error) {
        throw new Error(`hotelResultsService.processSearchResults failed: ${error.message}`, { cause: error });
    }
}


module.exports = {
    processSearchResults
}