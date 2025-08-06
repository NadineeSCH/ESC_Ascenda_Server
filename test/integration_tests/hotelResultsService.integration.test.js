
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

const { processSearchResults } = require("../../service/hotelResultsService.js");
const { mockPriceList, mockStaticInfoList } = require("../mocks/hotel3132ApiMocks.js");

const reqParams31 = {
  destination_id: "test_dest",
  checkin: "2025-09-01",
  checkout: "2025-09-05",
  lang: "en",
  currency: "SGD",
  guests: "2|2"
};

const reqParams32 = {
  destination_id: "test_dest"
};

const defaultImg = "1.jpg";

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
});

describe("processSearchResults integration test (black-box)", () => {

    describe("Basic Functional Tests", () => {

        test("returns hotel data when both API responses are valid", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            expect(result.data.length).toBeGreaterThan(0);
        });

        test("excludes hotels with null prices", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            const ids = result.data.map(h => h.id);
            expect(ids).not.toContain("nullPrice");
        });

        test("excludes hotels not in the price list", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            const ids = result.data.map(h => h.id);
            expect(ids).not.toContain("extraHtl");
        });

        test("hotel with missing static info should only have id, price, score, rating", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            const h = result.data.find(h => h.id === "z999");
            expect(h).toMatchObject({
                id: "z999",
                price: 350,
                rating: 2.5,
                score: 70
            });
            expect(h.name).toBeNull();
            expect(h.latitude).toBeNull();
            expect(h.longitude).toBeNull();
            expect(h.description).toBeNull();
            expect(h.address).toBeNull();
            expect(h.distance).toBeNull();
            expect(h.checkinTime).toBeNull();
            expect(h.imageUrl).toBeNull();
        });


        test("adds default values for rating, score, image URL when missing", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            const hotel = result.data.find(h => h.id === "nullStaticInfo");
            expect(hotel.rating).toBe(2.5);
            expect(hotel.score).toBe(70);
            expect(hotel.imageUrl).toBeNull();
        });
    });

    describe("Filtering Behavior", () => {

        test("filters by minPrice and maxPrice", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, {
                minPrice: 100, maxPrice: 200, minRating: null, maxRating: null, minScore: null, maxScore: null
            }, null);
            expect(result.data.every(h => h.price >= 100 && h.price <= 200)).toBe(true);
        });

        test("filters by minRating and maxRating", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, {
                minPrice: null, maxPrice: null, minRating: 2, maxRating: 4, minScore: null, maxScore: null
            }, null);
            expect(result.data.every(h => h.rating >= 2 && h.rating <= 4)).toBe(true);
        });

        test("filters by minScore and maxScore", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, {
                minPrice: null, maxPrice: null, minRating: null, maxRating: null, minScore: 70, maxScore: 90
            }, null);
            expect(result.data.every(h => h.score >= 70 && h.score <= 90)).toBe(true);
        });

        test("filters by all criteria at once", async () => {
            const allFilters = {
                minPrice: 100,
                maxPrice: 200,
                minRating: 1,
                maxRating: 4,
                minScore: 75,
                maxScore: 90
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, allFilters, null);
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45"]);
        });
    });

    describe("Sorting Behaviour", () => {

        test("sorts by price ascending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, { sortVar: "price", reverse: false });
            const prices = result.data.map(h => h.price);
            expect(prices).toEqual([...prices].sort((a, b) => a - b));
        });

        test("sorts by price descending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, {
                sortVar: "price",
                reverse: true
            });
            const prices = result.data.map(h => h.price);
            expect(prices).toEqual([...prices].sort((a, b) => b - a));
        });

        test("sorts by rating ascending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );

            let result = await processSearchResults(reqParams31, reqParams32, null, {
                sortVar: "rating",
                reverse: false
            });
            let ratings = result.data.map(h => h.rating);
            expect(ratings).toEqual([...ratings].sort((a, b) => a - b));
        });

        test("sorts by rating descending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            result = await processSearchResults(reqParams31, reqParams32, null, {
                sortVar: "rating",
                reverse: true
            });
            ratings = result.data.map(h => h.rating);
            expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
        });

        test("sorts by score ascending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, {
                sortVar: "score",
                reverse: false
            });
            const scores = result.data.map(h => h.score);
            expect(scores).toEqual([...scores].sort((a, b) => a - b));
        });

        test("sorts by score descending", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, { sortVar: "score", reverse: true });
            const scores = result.data.map(h => h.score);
            expect(scores).toEqual([...scores].sort((a, b) => b - a));
        });
    });
    

    describe('Filters + Sorting', () => {

        test("filters + sort by score + ascending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "score",
                reverse: false
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });

        test("filters + sort by score + descending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "score",
                reverse: true
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });

        test("filters + sort by rating + ascending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "rating",
                reverse: false
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });

        test("filters + sort by rating + descending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "rating",
                reverse: true
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });

        test("filters + sort by price + ascending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "price",
                reverse: false
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["op45", "b7Dw"]);
        });

        test("filters + sort by price + descending", async () => {
            const filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            };
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, filters, {
                sortVar: "price",
                reverse: true
            });
            const ids = result.data.map(h => h.id);
            expect(ids).toEqual(["b7Dw", "op45"]);
        });


    });

    describe("Defensive Tests/Error Handling", () => {

        test("throws if poller fails", async () => {
            fetchMock.mockResponse(JSON.stringify({ completed: false }), { status: 200 });
            await expect(processSearchResults(reqParams31, reqParams32, null, null))
                .rejects.toThrow("hotelResultsService.processSearchResults failed");
        }, 15000);

        test("throws if static info API returns invalid JSON", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                ["not-json", { status: 200 }]
            );
            await expect(processSearchResults(reqParams31, reqParams32, null, null))
                .rejects.toThrow("hotelResultsService.processSearchResults failed");
        });

        test("throws if data1 = null", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({completed: true, hotels: null}), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            await expect(processSearchResults(reqParams31, reqParams32, null, null))
                .rejects.toThrow("Invalid hotel price list from data1.");
        });

        test("throws if data1 = 'not-an-array'", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({completed: true, hotels: "not-an-array" }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            await expect(processSearchResults(reqParams31, reqParams32, null, null))
                .rejects.toThrow("Invalid hotel price list from data1.");
        });

        test("returns empty list if data1 = { hotels: [] }", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({completed: true, hotels: [] }), { status: 200 }],
                [JSON.stringify(mockStaticInfoList), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            expect(result).toEqual({ data: [] });
        });

        test("throws if data2 is not an array", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify("not-an-array"), { status: 200 }]
            );
            await expect(processSearchResults(reqParams31, reqParams32, null, null))
                .rejects.toThrow("Invalid hotel static info list from data2.");
        });

        test("works if data2 is empty array", async () => {
            fetchMock.mockResponses(
                [JSON.stringify({ completed: true, ...mockPriceList }), { status: 200 }],
                [JSON.stringify([]), { status: 200 }]
            );
            const result = await processSearchResults(reqParams31, reqParams32, null, null);
            expect(result.data.length).toBe(mockPriceList.hotels.length - 1); // excludes nullPrice
            for (const h of result.data) {
                expect(h.rating).toBe(2.5);
                expect(h.score).toBe(70);
            }
        });
    });



});
