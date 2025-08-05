const mockPriceList = {
  searchCompleted: true,
  completed: true,
  status: "success",
  currency: "SGD",
  hotels: [
    {
      id: "cCrl", // full match with static info, score is null → default to 70
      searchRank: 0.93,
      price_type: "multi",
      free_cancellation: true,
      rooms_available: 100,
      max_cash_payment: 134.83,
      coverted_max_cash_payment: 176.06,
      points: 618,
      bonuses: 0,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: 134.83,
      price: 176.06,
      converted_price: 176.06,
      lowest_converted_price: 176.06,
      market_rates: [{ supplier: "expedia", rate: 155.16 }]
    },
    {
      id: "b7Dw", // match with static info, no images, rating = 0, score = 88
      searchRank: 0.80,
      price_type: "multi",
      free_cancellation: false,
      rooms_available: 12,
      max_cash_payment: 99,
      coverted_max_cash_payment: 120,
      points: 200,
      bonuses: 5,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: 99,
      price: 120,
      converted_price: 120,
      lowest_converted_price: 120,
      market_rates: [{ supplier: "booking", rate: 118.0 }]
    },
    {
    id: "op45", // match with static info, rating = null, score = 90
    searchRank: 0.67,
      price_type: "multi",
      free_cancellation: true,
      rooms_available: 10,
      max_cash_payment: 88,
      coverted_max_cash_payment: 110,
      points: 90,
      bonuses: 5,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: 88,
      price: 110,
      converted_price: 110,
      lowest_converted_price: 110,
      market_rates: [{ supplier: "booking", rate: 908.0 }]
    },
    {
      id: "z999", // in price list only — should show only id and price
      searchRank: 0.70,
      price_type: "multi",
      free_cancellation: true,
      rooms_available: 5,
      max_cash_payment: 300,
      coverted_max_cash_payment: 350,
      points: 100,
      bonuses: 0,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: 300,
      price: 350,
      converted_price: 350,
      lowest_converted_price: 350,
      market_rates: [{ supplier: "agoda", rate: 345.0 }]
    },
    {
      id: "nullStaticInfo", // edge case — all static fields null/missing
      searchRank: 0.5,
      price_type: "multi",
      free_cancellation: false,
      rooms_available: 3,
      max_cash_payment: 80,
      coverted_max_cash_payment: 80,
      points: 100,
      bonuses: 0,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: 80,
      price: 80,
      converted_price: 80,
      lowest_converted_price: 80,
      market_rates: [{ supplier: "agoda", rate: 79.0 }]
    },
    {
      id: "nullPrice", // should be kicked out
      searchRank: 0.5,
      price_type: "multi",
      free_cancellation: false,
      rooms_available: 3,
      max_cash_payment: 80,
      coverted_max_cash_payment: 80,
      points: 100,
      bonuses: 0,
      bonus_programs: [],
      bonus_tiers: [],
      lowest_price: null,
      price: null,
      converted_price: null,
      lowest_converted_price: null,
      market_rates: [{ supplier: "agoda", rate: 79.0 }]
    }
  ]
};

const mockStaticInfoList = [
  {
    id: "cCrl",
    imageCount: 41,
    latitude: 48.740682,
    longitude: 2.361031,
    name: "Mercure Paris Orly Airport",
    address: "12 Avenue Jacqueline Auriol",
    rating: 4,
    distance: 5424.46,
    description: "Fitness center, Wi-Fi, banquet hall",
    checkin_time: "2.00pm",
    number_of_images: 43,
    trustyou: {
      score: {
        overall: null, // triggers default score = 70
        kaligo_overall: 0,
        solo: null,
        couple: null,
        family: null,
        business: null
      }
    },
    image_details: {
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/cCrl/",
      suffix: ".jpg",
      count: 41
    }
  },
  {
    id: "b7Dw",
    latitude: 48.73963,
    longitude: 2.415159,
    name: "Résidence Hera Paris Orly Aéroport",
    address: "11 bis Rue Pompadour",
    rating: 0, // valid rating = 0
    distance: 5424.56,
    description: "Garden view, lounge",
    checkin_time: "3.00pm",
    number_of_images: 0, // imageUrl should be null
    trustyou: {
      score: {
        overall: 88,
        kaligo_overall: 0,
        solo: null,
        couple: null,
        family: null,
        business: null
      }
    },
    image_details: {
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/b7Dw/",
      suffix: ".jpg",
      count: 0
    }
  },
  {
    id: "op45",
    latitude: 130.273,
    longitude: 21.9301,
    name: "Open Air Ski Resort",
    address: "12 34 steet, 12 city",
    rating: null, // triggers default score = 2.5
    distance: 549.56,
    description: "Ski Resort in Antartica",
    checkin_time: "3.00pm",
    number_of_images: 2,
    trustyou: {
      score: {
        overall: 90,
        kaligo_overall: 0,
        solo: null,
        couple: null,
        family: null,
        business: null
      }
    },
    image_details: {
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/op45/",
      suffix: ".jpg",
      count: 0
    }
  },
  {
    id: "extraHtl", // appears only in static info — should be ignored
    latitude: 48.750000,
    longitude: 2.400000,
    name: "Phantom Hotel",
    address: "123 Nowhere Lane",
    rating: 5,
    distance: 6000,
    description: "Invisible to the booking system",
    checkin_time: "12.00pm",
    number_of_images: 10,
    trustyou: {
      score: {
        overall: 95,
        kaligo_overall: 0,
        solo: null,
        couple: null,
        family: null,
        business: null
      }
    },
    image_details: {
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/extraHtl/",
      suffix: ".jpg",
      count: 10
    }
  },
  {
    id: "nullStaticInfo", // edge case — null/undefined fields
    latitude: null,
    longitude: null,
    name: null,
    address: null,
    rating: null, // triggers default rating = 2.5
    distance: null,
    description: null,
    checkin_time: null,
    number_of_images: 5,
    trustyou: null, // triggers default score = 70
    image_details: null // imageUrl should not be assigned
  },
  {
    id: "nullPrice", // this info should not be accessed
    latitude: 7823.123,
    longitude: 903.91,
    name: "Hotel with no Price",
    address: "No Price lane",
    rating: 99,
    distance: 4552,
    description: "Should be kickec out",
    checkin_time: "1.00pm",
    number_of_images: 3,
    trustyou: {
      score: {
        overall: 12,
        kaligo_overall: 0,
        solo: null,
        couple: null,
        family: null,
        business: null
      }
    },
    image_details: {
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/nullPrice/",
      suffix: ".jpg",
      count: 10
    } 
    }
];

module.exports = {mockPriceList, mockStaticInfoList};
