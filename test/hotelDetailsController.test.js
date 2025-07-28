const { getHotelDetails } = require("../controller/hotelDetailsController");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelDetailsController Integration Tests (with real service)", () => {
  let mockRequest, mockResponse, mockNext;

  beforeEach(() => {
    fetchMock.resetMocks();
    
    mockRequest = {
      body: {
        hotelId: "diH7"
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
    it("should return hotel details with correct structure", async () => {
      const mockApiResponse = {
        id: "diH7",
        name: "Grand Plaza Hotel",
        address: "123 Main Street, City Center",
        rating: 4.5,
        latitude: 1.3521,
        longitude: 103.8198,
        description: "Luxury hotel in the heart of the city",
        amenities: ["wifi", "pool", "gym"],
        categories: ["luxury", "business"],
        amenities_ratings: { wifi: 4.2, pool: 4.8 },
        image_details: [{ url: "https://example.com/hotel.jpg" }],
        imageCount: 10,
        number_of_images: 10,
        default_image_index: 0,
        hires_image_index: 1,
        checkin_time: "15:00"
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      await getHotelDetails(mockRequest, mockResponse, mockNext);

      // Verify controller set CORS headers
      expect(mockResponse.set).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin", 
        "http://localhost:5000"
      );

      // Verify response matches cleaned data structure
      expect(mockResponse.json).toHaveBeenCalledWith(mockApiResponse);
    });

    it("should handle partial hotel data", async () => {
      const partialApiResponse = {
        id: "diH7",
        name: "Basic Hotel",
        address: "456 Side Street"
        // Missing optional fields like rating, amenities, etc.
      };

      fetchMock.mockResponseOnce(JSON.stringify(partialApiResponse));

      await getHotelDetails(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        id: "diH7",
        name: "Basic Hotel",
        address: "456 Side Street",
        rating: undefined,
        latitude: undefined,
        longitude: undefined,
        description: undefined,
        amenities: undefined,
        categories: undefined,
        amenities_ratings: undefined,
        image_details: undefined,
        imageCount: undefined,
        number_of_images: undefined,
        default_image_index: undefined,
        hires_image_index: undefined,
        checkin_time: undefined
      });
    });
  });

  describe("error handling", () => {
    it("should return 500 when API request fails", async () => {
      fetchMock.mockReject(new Error("Network error"));

      await getHotelDetails(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Hotel details fetch failed",
        message: "Failed to fetch from external API: Network error",
        details: expect.objectContaining({
          endpoint: "hotelDetailsService",
          timestamp: expect.any(String)
        })
      });
    });

    it("should handle service returning success: false", async () => {
      // Mock service to return an error response
      fetchMock.mockResponseOnce("", { status: 500 });

      await getHotelDetails(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Hotel details fetch failed",
          message: expect.any(String)
        })
      );
    });

    // Removed artificial controller exception test to maintain integration test focus
  });

  describe("data validation", () => {
    it("should handle missing hotelId", async () => {
      const invalidRequest = {
        body: {}
      };

      await getHotelDetails(invalidRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it("should handle null/undefined request body", async () => {
      const invalidRequest = {
        body: null
      };

      await getHotelDetails(invalidRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Hotel details fetch failed",
        message: "Cannot read properties of null (reading 'hotelId')",
        details: {
          endpoint: "hotelDetailsService",
          timestamp: expect.any(String)
        }
      });
    });
  });
});