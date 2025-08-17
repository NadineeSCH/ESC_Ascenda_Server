const { getRoomDetails } = require("../../service/hotelRoomsService");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelRoomsService Integration test", () => {
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
    fetchMock.resetMocks();
    jest.useRealTimers();
  });

  describe("successful responses", () => {
    it("should return cleaned hotel data with correct structure", async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockPollerResponse));

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

      // Verify the correct URL was called
      const expectedUrl = `https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=SGD&country_code=SG&guests=2&partner_id=1089&landing_page=wl-acme-earn&product_type=earn`;
      expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle room without hero image", async () => {
      const responseWithoutHero = JSON.parse(
        JSON.stringify(mockPollerResponse)
      );
      responseWithoutHero.rooms[0].images = [];
      fetchMock.mockResponseOnce(JSON.stringify(responseWithoutHero));

      const result = await getRoomDetails(mockReq);
      expect(result.data[0].image).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should return error when API request fails", async () => {
      fetchMock.mockReject(new Error("API timeout"));

      await expect(getRoomDetails(mockReq)).rejects.toThrow(new Error("Failed to fetch room details: API timeout"));
      });
    

    it("should handle missing rooms in response", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ completed: true, rooms: [] }));

      const result = await getRoomDetails(mockReq);

      expect(result).toEqual({
        data: []
      });
    });
  });

  describe("polling behavior", () => {
    it("should handle polling until completed is true", async () => {
      jest.useFakeTimers();

      // Mock multiple responses
      fetchMock.mockResponses(
        [JSON.stringify({ completed: false }), { status: 200 }],
        [JSON.stringify({ completed: false }), { status: 200 }],
        [JSON.stringify(mockPollerResponse), { status: 200 }]
      );

      const promise = getRoomDetails(mockReq);

      // Advance timers to trigger polling
      await jest.advanceTimersByTimeAsync(500);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(500);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(500);
      expect(fetchMock).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });
});
