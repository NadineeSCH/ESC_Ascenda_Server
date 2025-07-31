class ReqParam31 {
    constructor ({ destination_id, checkin, checkout, lang, currency, guests}) {
        this.destination_id = destination_id ?? null;
        this.checkin = checkin ?? null;
        this.checkout = checkout ?? null;
        this.lang = lang ?? null;
        this.currency = currency ?? null;
        this.guests = guests ?? null;
        this.partner_id = 1098
    }
}


class ReqParam32 {
    constructor ({ destination_id }) {
        this.destination_id = destination_id ?? null;
    }
}

class filterParams {
    constructor({ minPrice, maxPrice, minRating, maxRating, minScore, maxScore }) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.minRating = minRating;
        this.maxRating = maxRating;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }
}

class sortParams {
    constructor({ sort_var, reverse }) {
        this.sortVar = sort_var;
        this.reverse = reverse;
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
        this.score = null;
    }
}



module.exports = {
    ReqParam31,
    ReqParam32,
    sortParams,
    filterParams,
    HotelResult
}