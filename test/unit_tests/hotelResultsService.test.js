jest.mock('../../utils/utils2.js', () => {
    const actual = jest.requireActual('../../utils/utils2.js');

    return {
        safeAssign: actual.safeAssign,           // use the real function
        ascendaApiCaller: jest.fn()              // mock this only
    };
});

const { processSearchResults } = require('../../service/hotelResultsService');
const { ascendaApiCaller, safeAssign } = require('../../utils/utils2.js');
const mockApis = require('../mocks/hotel3132ApiMocks.js');
const mockSuccessResp31 = mockApis.mockPriceList;
const mockSuccessResp32 = mockApis.mockStaticInfoList;

beforeEach(() => {
    jest.clearAllMocks();
})

const mockReqParam31 = {
    destination_id : "RsBU",
    checkin : "10-08-2025",
    checkout : "11-08-2025",
    lang : "en_US",
    currency : "SGD",
    guests : "2|2",
    partner_id : 1098
    };

const mockReqParam32 = {
    destination_id : "RsBU"
};

const priceFilters = {
    minPrice: 100,
    maxPrice: 200,
    minRating: null,
    maxRating: null,
    minScore: null,
    maxScore: null
};

const ratingFilters = {
    minPrice: null,
    maxPrice: null,
    minRating: 1,
    maxRating: 4
};

const scoreFilters = {
    minPrice: null,
    maxPrice: null,
    minScore: 75,
    maxScore: 90
};

const allFilters = {
    minPrice: 100,
    maxPrice: 200,
    minRating: 1,
    maxRating: 4,
    minScore: 75,
    maxScore: 90
}

const sortingFilters = {
    minPrice: 100,
    maxPrice: 400,
    minRating: 0,
    maxRating: 2.5,
    minScore: 80,
    maxScore: 100
}

const defaultImg = '1.jpg'



describe("hotelResultsService Sucessful API response tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe("Data Cleanup and Handling", () => {
        
        // also a general test
        test("Returned object has data field", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);
            expect(result.data).toBeDefined();
        });

        //broad structure level test
        test("hotel in data1 should have the appropriate fields", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const expectedHotels = ["cCrl", "b7Dw", "op45", "nullStaticInfo", "z999"];
            const fields = [
                "id", "price", "name", "latitude", "longitude",
                "description", "address", "rating", "distance",
                "checkinTime", "imageUrl", "score"
            ];

            for (const id of expectedHotels) {
                const hotel = result.data.find(h => h.id === id);
                expect(hotel).toBeDefined();

                for (const field of fields) {
                    expect(hotel).toHaveProperty(field);
                }
            }
        });
        
        test("fully matched hotels in data 1 should have non-null static fields", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const expectedNonNullFields = [
                "name", "latitude", "longitude",
                "description", "address", "checkinTime"
            ];

            const hotelsToCheck = ["cCrl", "b7Dw", "op45"]; // all have full static info

            for (const id of hotelsToCheck) {
                const hotel = result.data.find(h => h.id === id);
                expect(hotel).toBeDefined();
                for (const field of expectedNonNullFields) {
                    expect(hotel[field]).not.toBeNull();
                }
            }
        });
        
        test("hotel in data 1 and not in data 2 should only have id, price, score and rating", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const hotel = result.data.find(h => h.id === 'z999');
            
            expect(hotel).toMatchObject({ id: "z999", price: 350, score: 70, rating: 2.5 });
            expect(hotel.name).toBeNull();
            expect(hotel.latitude).toBeNull();
            expect(hotel.longitude).toBeNull();
            expect(hotel.description).toBeNull();
            expect(hotel.address).toBeNull();
            expect(hotel.distance).toBeNull();
            expect(hotel.checkinTime).toBeNull();
            expect(hotel.imageUrl).toBeNull();
        });

        test("hotel in data 2 but not in data 1 should not be in final result", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            expect(result.data.find(h => h.id === 'extraHtl')).toBeUndefined();
        });

        test("hotel that has no price should not be included", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            expect(result.data.find((h) => h.id === 'nullPrice')).toBeUndefined();
        });

        test("hotel that has no rating has default rating of 2.5", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const hotelRatings = result.data.filter((h) => ["op45", "z999", 'nullStaticInfo'].includes(h.id)).map((h) => h.rating);
            expect(hotelRatings).toEqual([2.5, 2.5, 2.5]);
        });

        test("hotel that has no score has default score of 70", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const hotel = result.data.find((h) => h.id === "cCrl")
            expect(hotel.score).toBe(70);
        });

        test("hotel that has no images should have image_url === null", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const hotel = result.data.find((h) => h.id === "b7Dw")
            expect(hotel.imageUrl).toBeNull();
        });

        test("hotel that has images should have image_url === prefix + defaultImg", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const orgHotel1 = mockSuccessResp32.find((h) => h.id === 'op45');
            const orgHotel2 = mockSuccessResp32.find((h) => h.id === 'cCrl');

            const orgHotel1ImgUrl = orgHotel1.image_details.prefix + defaultImg;
            const orgHotel2ImgUrl = orgHotel2.image_details.prefix + defaultImg;

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const hotel1 = result.data.find((h) => h.id === "op45")
            expect(hotel1.imageUrl).toBe(orgHotel1ImgUrl);

            const hotel2 = result.data.find((h) => h.id === 'cCrl');
            expect(hotel2.imageUrl).toBe(orgHotel2ImgUrl);
        });
        
    });

    describe("Purely Filtering tests", () => {

        test("Does not apply filter when filter = null", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['cCrl', 'b7Dw', 'op45', 'z999', 'nullStaticInfo']);
        });

        test("Price Filtering", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, priceFilters, null);

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['cCrl', 'b7Dw', 'op45']);
        });

        test("Rating Filtering", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, ratingFilters, null);

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['cCrl', 'op45', 'z999', 'nullStaticInfo']);
        });

        test("Score Filtering", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, scoreFilters, null);

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['b7Dw', 'op45']);
        });

        test("All three filters at once", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, allFilters, null);
            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['op45']);
        })
    });

    describe("Purely Sorting tests", () => {

            // Hotel prices:
            // nullStaticInfo = 80
            // op45 = 110
            // b7Dw = 120
            // cCrl = 176.06
            // z999 = 350

            // Ratings:
            // b7Dw = 0
            // op45 = 2.5 (default)
            // z999 = 2.5 (default)
            // nullStaticInfo = 2.5 (default)
            // cCrl = 4

            // Scores:
            // cCrl = 70 (default)
            // z999 = 70 (default)
            // nullStaticInfo = 70 (default)
            // b7Dw = 88
            // op45 = 90

        test("Does not apply sort when sort = null", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['cCrl', 'b7Dw', 'op45', 'z999', 'nullStaticInfo']);
        });

        test("Does not apply sort when sort_var is not price, rating or score", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);
            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "random",
                reverse: true
            });

            const resultIds = result.data.map((h) => h.id)
            expect(resultIds).toEqual(['cCrl', 'b7Dw', 'op45', 'z999', 'nullStaticInfo']);
        });

        test("Sort by price ascending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "price",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["nullStaticInfo", "op45", "b7Dw", "cCrl", "z999"]);
        });

        test("Sort by price descending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "price",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["z999", "cCrl", "b7Dw", "op45", "nullStaticInfo"]);
        });


        test("Sort by rating ascending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "rating",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45", "z999", "nullStaticInfo", "cCrl"]);

        });


        test("Sort by rating descending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "rating",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["cCrl", "op45", "z999", "nullStaticInfo", "b7Dw"]);
        });


        test("Sort by score ascending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "score",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["cCrl", "z999", "nullStaticInfo", "b7Dw", "op45"]);

        });

        test("Sort by score descending", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
                sortVar: "score",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw", "cCrl", "z999", "nullStaticInfo"]);
        });

    });

    describe("All Filters + Sorting Tests", () => {
        test("All Filters applied and then sort by Price", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "price",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });
        
        test("All Filters applied and then sort by Price with reverse", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "price",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });

        test("All Filters applied and then sort by Score", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "score",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });

        test("All Filters applied and then sort by Score with reverse", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "score",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });

        test("All Filters applied and then sort by Rating", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "rating",
                reverse: false
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });

        test("All Filters applied and then sort by Rating with reverse", async () => {
            ascendaApiCaller
                .mockResolvedValueOnce(mockSuccessResp31)
                .mockResolvedValueOnce(mockSuccessResp32);

            const result = await processSearchResults(mockReqParam31, mockReqParam32, sortingFilters, {
                sortVar: "rating",
                reverse: true
            });

            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });

    });        
})

describe("hotelResultsService Defensive tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test("throws if ascendaApiCaller throws error", async () => {
        ascendaApiCaller.mockImplementationOnce(() => {
            throw new Error("API failed");
        });

        await expect(processSearchResults(mockReqParam31, mockReqParam32, null, null))
            .rejects
            .toThrow("hotelResultsService.processSearchResults failed: API failed");
    });

    test("throws if data1 is null", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(mockSuccessResp32);

        await expect(processSearchResults(mockReqParam31, mockReqParam32, null, null))
            .rejects
            .toThrow("Invalid hotel price list from data1.");
    });

    test("throws if data1.hotels is not an array", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce({ hotels: "not-an-array" })
            .mockResolvedValueOnce(mockSuccessResp32);

        await expect(processSearchResults(mockReqParam31, mockReqParam32, null, null))
            .rejects
            .toThrow("Invalid hotel price list from data1.");
    });

    test("throws if data2 is not an array", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce(mockSuccessResp31)
            .mockResolvedValueOnce("not-an-array");

        await expect(processSearchResults(mockReqParam31, mockReqParam32, null, null))
            .rejects
            .toThrow("Invalid hotel static info list from data2.");
    });

    test("returns empty list if data1.hotels is empty", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce({ hotels: [] })
            .mockResolvedValueOnce(mockSuccessResp32);

        const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);
        expect(result).toEqual({ data: [] });
    });

    test("still returns hotels with defaults if data2 is empty", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce(mockSuccessResp31)
            .mockResolvedValueOnce([]);

        const result = await processSearchResults(mockReqParam31, mockReqParam32, null, null);
        expect(result.data.length).toBe(mockSuccessResp31.hotels.length - 1); //because no price hotel should be kicked out
        for (const hotel of result.data) {
            expect(hotel).toHaveProperty("id");
            expect(hotel).toHaveProperty("price");
            expect(hotel.rating).toBe(2.5);
            expect(hotel.score).toBe(70);
        }
    });

    test("sort defaults to ascending when reverse is undefined", async () => {
        ascendaApiCaller
            .mockResolvedValueOnce(mockSuccessResp31)
            .mockResolvedValueOnce(mockSuccessResp32);

        const result = await processSearchResults(mockReqParam31, mockReqParam32, null, {
            sortVar: "price"
        });

        const ids = result.data.map(h => h.id);
        expect(ids).toEqual(["nullStaticInfo", "op45", "b7Dw", "cCrl", "z999"]);
    });


})