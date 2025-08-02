const { getHotelDetails } = require("../../service/hotelDetailsService");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelDetailsService", () => {
  const mockReq = {
    body: {
      hotelId: "diH7"
    }
  };

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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe("successful responses", () => {
    it("should return cleaned hotel data with correct structure", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      const result = await getHotelDetails(mockReq);

      expect(result).toEqual({
        success: true,
        data: mockApiResponse
      });

      // Verify the correct URL was called
      const expectedUrl = `https://hotelapi.loyalty.dev/api/hotels/diH7`;
      expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle extra fields in API response", async () => {
      const responseWithExtraFields = {
        ...mockApiResponse,
        extraField1: "should be ignored",
        extraField2: { nested: "data" }
      };

      fetchMock.mockResponseOnce(JSON.stringify(responseWithExtraFields));

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('extraField1');
      expect(result.data).not.toHaveProperty('extraField2');
      expect(Object.keys(result.data)).toHaveLength(16); // Only the expected fields
    });
  });

  describe("error handling", () => {
    it("should return error when API request fails", async () => {
      fetchMock.mockReject(new Error("Network timeout"));

      const result = await getHotelDetails(mockReq);

      expect(result).toEqual({
        success: false,
        error: "Failed to fetch from external API: Network timeout",
        details: expect.objectContaining({
          endpoint: "hotelDetailsService",
          timestamp: expect.any(String)
        })
      });
    });

    it("should handle HTTP error responses", async () => {
      fetchMock.mockResponseOnce("Not Found", { status: 404 });

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(false);
      expect(result.error).toContain("HTTP 404");
    });

    it("should handle invalid JSON responses", async () => {
      fetchMock.mockResponseOnce("invalid json response");

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to fetch from external API");
    });

    it("should handle missing hotelId", async () => {
      const reqWithoutHotelId = { body: {} };

      const result = await getHotelDetails(reqWithoutHotelId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle null/undefined request body", async () => {
      const reqWithNullBody = { body: null };

      const result = await getHotelDetails(reqWithNullBody);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("data cleaning and transformation", () => {
    it("should preserve null values for optional fields", async () => {
      const responseWithNulls = {
        id: "diH7",
        name: "Hotel Name",
        rating: null,
        amenities: null,
        description: null
      };

      fetchMock.mockResponseOnce(JSON.stringify(responseWithNulls));

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("diH7");
      expect(result.data.rating).toBeNull();
      expect(result.data.amenities).toBeNull();
    });
  });

  describe("URL construction", () => {
    it("should construct correct API URL with hotelId", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse));

      await getHotelDetails({ body: { hotelId: "test123" } });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://hotelapi.loyalty.dev/api/hotels/test123"
      );
    });
  });
});