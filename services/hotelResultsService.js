let utils = require('../utils/utils.js');
let dto = require('../DTO/DTO.js');
const defaultImg = '1.jpg';

async function processSearchResults(reqParams31, reqParams32) {
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
            cleanedHotel.price = utils.safeAssign(hotel.price);

            const hotelStaticInfo = returnedHotelListMap.get(cleanedHotel.id) || null;
            if (hotelStaticInfo !== null) {
                cleanedHotel.name = utils.safeAssign(hotelStaticInfo.name);
                cleanedHotel.latitude = utils.safeAssign(hotelStaticInfo.latitude);
                cleanedHotel.longitude = utils.safeAssign(hotelStaticInfo.longitude);
                cleanedHotel.description = utils.safeAssign(hotelStaticInfo.description);
                cleanedHotel.address = utils.safeAssign(hotelStaticInfo.address);
                cleanedHotel.rating = utils.safeAssign(hotelStaticInfo.rating);
                cleanedHotel.distance = utils.safeAssign(hotelStaticInfo.distance);
                cleanedHotel.checkinTime = utils.safeAssign(hotelStaticInfo.checkin_time);
                if (hotelStaticInfo.number_of_images !== 0) {
                    cleanedHotel.imageUrl = hotelStaticInfo.image_details.prefix + defaultImg;
                } else {
                    cleanedHotel.imageUrl = '';
                }
            }

            cleanedHotelList.push(cleanedHotel);
        });

        return cleanedHotelList;
    } catch (error) {
        throw new Error(`hotelResultsService.processSearchResults failed: ${error.message}`, { cause: error });
    }
}


module.exports = {
    processSearchResults
}