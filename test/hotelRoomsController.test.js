const { getRoomDetails } = require("../controller/hotelRoomsController");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelDetailsController Integration Tests (with real service)", () => {
  let mockRequest, mockResponse, mockNext;

  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useRealTimers();

    mockRequest = {
      body: {
        hotelId: "123",
        destinationId: "456",
        checkin: "2023-11-01",
        checkout: "2023-11-05",
        currency: "SGD",
        guestsEachRoom: 2,
        rooms: 1,
      },
    };

    mockResponse = {
      set: jest.fn().mockReturnThis(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("successful responses", () => {
    it("should return formatted room data with correct structure", async () => {
      const mockApiResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Double Room",
            free_cancellation: false,
            roomAdditionalInfo: {
              breakfastInfo: "hotel_detail_room_only",
              displayFields: {
                surcharges: [{ type: "TaxAndServiceFee", amount: 476.67 }],
              },
            },
            long_description: "Spacious double room with city view",
            price: 4772.05,
            images: [
              { hero_image: true, url: "https://example.com/room1.jpg" },
            ],
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      await getRoomDetails(mockRequest, mockResponse, mockNext);

      // Verify controller set CORS headers
      expect(mockResponse.set).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:5000"
      );

      // Verify transformed response
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          roomNormalizedDescription: "Double Room",
          free_cancellation: false,
          breakfastInfo: "hotel_detail_room_only",
          additionalInfo: mockApiResponse.rooms[0].roomAdditionalInfo,
          longDesc: "Spacious double room with city view",
          price: 4772.05,
          image: "https://example.com/room1.jpg",
        },
      ]);
    });
  });

  describe("error handling", () => {
    it("should return 500 when API request fails", async () => {
      fetchMock.mockReject(new Error("API timeout"));

      await getRoomDetails(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Hotel data fetch failed",
        message: "Failed to fetch from external API: API timeout",
        details: expect.objectContaining({
          endpoint: "hotelDetailsService",
        }),
      });
    });
  });

  describe("data validation", () => {
    it("should handle missing required fields", async () => {
      const invalidRequest = {
        body: {
          /* missing required fields */
        },
      };

      await getRoomDetails(invalidRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Hotel data fetch failed",
          details: expect.objectContaining({
            endpoint: "hotelDetailsService",
          }),
        })
      );
    });
  });
});