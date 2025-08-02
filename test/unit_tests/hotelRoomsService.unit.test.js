const { getRoomDetails } = require("../../service/hotelRoomsService");
const { poller } = require("../../utils/utils");

// Mock only the poller function since it's the only utils function used
jest.mock("../../utils/utils", () => ({
  poller: jest.fn(),
}));

describe("hotelRoomsService - Unit Tests", () => {
  const mockReq = {
    hotel_id: "123",
    destination_id: "456",
    checkin: "2023-01-01",
    checkout: "2023-01-05",
    currency: "SGD",
    guestsEachRoom: 2,
    rooms: 1,
  };

  const mockPollerResponse = {
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
          { hero_image: false, url: "https://example.com/room2.jpg" },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful responses", () => {
    it("should return cleaned hotel data with correct structure", async () => {
      // Mock the poller to return our mock response
      poller.mockResolvedValue(mockPollerResponse);

      const result = await getRoomDetails(mockReq);

      expect(result).toEqual({
        data: [
          {
            roomNormalizedDescription: "Double Room",
            free_cancellation: false,
            breakfastInfo: "hotel_detail_room_only",
            additionalInfo: mockPollerResponse.rooms[0].roomAdditionalInfo,
            longDesc: "Spacious double room with city view",
            price: 4772.05,
            image: "https://example.com/room1.jpg",
          },
        ],
      });

      // Verify poller was called with the correct URL
      const expectedUrl = `https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=SGD&country_code=SG&guests=2&partner_id=1089&landing_page=wl-acme-earn&product_type=earn`;
      expect(poller).toHaveBeenCalledWith(expectedUrl);
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it("should handle room without hero image", async () => {
      const responseWithoutHero = JSON.parse(
        JSON.stringify(mockPollerResponse)
      );
      responseWithoutHero.rooms[0].images = [];
      poller.mockResolvedValue(responseWithoutHero);

      const result = await getRoomDetails(mockReq);
      expect(result.data[0].image).toBeUndefined();
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple rooms in response", async () => {
      const multiRoomResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Single Room",
            free_cancellation: true,
            roomAdditionalInfo: { breakfastInfo: "breakfast_included" },
            long_description: "Cozy single room",
            price: 2500.00,
            images: [{ hero_image: true, url: "https://example.com/single.jpg" }],
          },
          {
            roomNormalizedDescription: "Suite",
            free_cancellation: false,
            roomAdditionalInfo: { breakfastInfo: "no_breakfast" },
            long_description: "Luxury suite",
            price: 8000.00,
            images: [{ hero_image: true, url: "https://example.com/suite.jpg" }],
          }
        ],
      };
      
      poller.mockResolvedValue(multiRoomResponse);

      const result = await getRoomDetails(mockReq);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].roomNormalizedDescription).toBe("Single Room");
      expect(result.data[1].roomNormalizedDescription).toBe("Suite");
      expect(poller).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should propagate error when poller fails", async () => {
      const pollerError = new Error("API timeout");
      poller.mockRejectedValue(pollerError);

      await expect(getRoomDetails(mockReq)).rejects.toThrow("Failed to fetch room details: API timeout");
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it("should handle missing rooms in response", async () => {
      poller.mockResolvedValue({ completed: true, rooms: [] });

      const result = await getRoomDetails(mockReq);

      expect(result).toEqual({
        data: []
      });
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed response from poller", async () => {
      poller.mockResolvedValue({ completed: true, rooms: []}); // Missing rooms property

      const result = await getRoomDetails(mockReq);

      expect(result).toEqual({
        data: []
      });
      expect(poller).toHaveBeenCalledTimes(1);
    });
  });

  describe("data transformation", () => {
    it("should correctly transform room data structure", async () => {
      const customMockResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Test Room",
            free_cancellation: true,
            roomAdditionalInfo: {
              breakfastInfo: "breakfast_included",
              displayFields: { special_check_in_instructions: "something"}
            },
            long_description: "Test description",
            price: 1000.50,
            images: [
              { hero_image: false, url: "https://example.com/img1.jpg" },
              { hero_image: true, url: "https://example.com/hero.jpg" },
            ],
          },
        ],
      };

      poller.mockResolvedValue(customMockResponse);

      const result = await getRoomDetails(mockReq);

      expect(result.data[0]).toEqual({
        roomNormalizedDescription: "Test Room",
        free_cancellation: true,
        breakfastInfo: "breakfast_included",
        additionalInfo: customMockResponse.rooms[0].roomAdditionalInfo,
        longDesc: "Test description",
        price: 1000.50,
        image: "https://example.com/hero.jpg", // Should pick the hero image
      });
    });

    it("should handle rooms with no images", async () => {
      const noImageResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "No Image Room",
            free_cancellation: false,
            roomAdditionalInfo: { breakfastInfo: "no_breakfast" },
            long_description: "Room without images",
            price: 500.00,
            images: [],
          },
        ],
      };

      poller.mockResolvedValue(noImageResponse);

      const result = await getRoomDetails(mockReq);

      expect(result.data[0].image).toBeUndefined();
    });

    it("should handle URL building correctly", async () => {
      poller.mockResolvedValue(mockPollerResponse);

      await getRoomDetails(mockReq);

      // Verify the URL construction logic
      const calledUrl = poller.mock.calls[0][0];
      expect(calledUrl).toContain("hotels/123/price");
      expect(calledUrl).toContain("destination_id=456");
      expect(calledUrl).toContain("checkin=2023-01-01");
      expect(calledUrl).toContain("checkout=2023-01-05");
      expect(calledUrl).toContain("currency=SGD");
      expect(calledUrl).toContain("guests=2");
    });
  });
});
