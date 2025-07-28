class ReqParam31 {
    constructor ({ destination_id, checkin, checkout, lang, currency, guests, partner_id }) {
        this.destination_id = destination_id ?? null;
        this.checkin = checkin ?? null;
        this.checkout = checkout ?? null;
        this.lang = lang ?? null;
        this.currency = currency ?? null;
        this.guests = guests ?? null;
        this.partner_id = partner_id ?? null;
    }
}

class ReqParam32 {
    constructor ({ destination_id }) {
        this.destination_id = destination_id ?? null;
    }
}

class ReqParam33 {
    constructor ({ hotel_id, destination_id, checkin, checkout, lang, currency, guests, partner_id }) {
        this.hotel_id = hotel_id ?? null
        this.destination_id = destination_id ?? null;
        this.checkin = checkin ?? null;
        this.checkout = checkout ?? null;
        this.lang = lang ?? null;
        this.currency = currency ?? null;
        this.guests = guests ?? null;
        this.partner_id = partner_id ?? null;
    }
}

class ReqParam34 {
    constructor ({ hotel_id }) {
        this.hotel_id = hotel_id ?? null
    }
}

class HotelResult {
    constructor() {
        this.id = null;
        this.price = null;
        this.name = null;
        this.latitude = null;
        this.longitude = null;
        this.description = null;
        this.address = null;
        this.rating = null;
        this.distance = null;
        this.checkinTime = null;
        this.imageUrl = null;
    }
}


/*class SearchResult {
    constructor() {
        this.hotelList = [];
    }
}*/


module.exports = {
    ReqParam31,
    ReqParam32,
    HotelResult,
    //SearchResult
}