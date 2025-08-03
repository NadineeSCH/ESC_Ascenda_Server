const request = require("supertest");
const express = require("express");
const combinedHotelDataRouter = require("../../routes/combinedHotelDataRouter");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("combinedHotelDataRouter Integration Tests", () => {
  let app;
  let validCheckinDate;
  let validCheckoutDate;
  let invalidEarlyCheckinDate;
  let invalidCheckoutBeforeCheckinDate;

  beforeAll(() => {
    // Calculate dynamic dates based on today
    const today = new Date();

    // Valid checkin: 4 days from today (ensures it's > 3 days)
    const validCheckin = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    validCheckinDate = validCheckin.toISOString().split("T")[0];

    // Valid checkout: 7 days from today
    const validCheckout = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    validCheckoutDate = validCheckout.toISOString().split("T")[0];

    // Invalid checkin: 2 days from today (< 3 days, should fail)
    const invalidCheckin = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    invalidEarlyCheckinDate = invalidCheckin.toISOString().split("T")[0];

    // Invalid checkout: before checkin date
    const invalidCheckout = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    invalidCheckoutBeforeCheckinDate = invalidCheckout
      .toISOString()
      .split("T")[0];

    app = express();
    app.use(express.json());
    app.use("/", combinedHotelDataRouter);

    // Error handling middleware
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid JSON payload",
        });
      }
      res.status(500).json({ error: "Internal Server Error" });
    });
  });

  const validRequestBody = {
    hotel_id: "diH7",
    destination_id: "456",
    checkin: "", // Will be set dynamically in beforeAll
    checkout: "", // Will be set dynamically in beforeAll
    currency: "SGD",
    guestsEachRoom: 2,
    rooms: 1,
  };

  // Update the request body with dynamic dates before each test
  beforeEach(() => {
    fetchMock.resetMocks();
    validRequestBody.checkin = validCheckinDate;
    validRequestBody.checkout = validCheckoutDate;
  });

  describe("successful responses", () => {
    it("should return combined hotel and room data with correct structure", async () => {
      // Mock hotel details API response
      const mockHotelDetailsResponse = {
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
        checkin_time: "15:00",
      };

      // Mock hotel rooms API response (polling response)
      const mockRoomsResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Deluxe Double Room",
            free_cancellation: true,
            roomAdditionalInfo: {
              breakfastInfo: "breakfast_included",
              displayFields: {
                surcharges: [{ type: "TaxAndServiceFee", amount: 120.5 }],
              },
            },
            long_description:
              "Spacious room with city view and modern amenities",
            price: 2500.75,
            images: [
              { hero_image: true, url: "https://example.com/room-hero.jpg" },
              { hero_image: false, url: "https://example.com/room-alt.jpg" },
            ],
          },
        ],
      };

      // Mock both API calls
      fetchMock.mockResponses(
        // First call: Hotel details API
        [JSON.stringify(mockHotelDetailsResponse), { status: 200 }],
        // Second call: Hotel rooms API (polling)
        [JSON.stringify(mockRoomsResponse), { status: 200 }]
      );

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hotelDetails: {
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
          checkin_time: "15:00",
        },
        rooms: [
          {
            roomNormalizedDescription: "Deluxe Double Room",
            free_cancellation: true,
            breakfastInfo: "breakfast_included",
            additionalInfo: mockRoomsResponse.rooms[0].roomAdditionalInfo,
            longDesc: "Spacious room with city view and modern amenities",
            price: 2500.75,
            image: "https://example.com/room-hero.jpg",
          },
        ],
      });

      // Verify both APIs were called
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Verify hotel details API call
      const hotelDetailsCall = fetchMock.mock.calls[0][0];
      expect(hotelDetailsCall).toContain("hotels/diH7");
      expect(hotelDetailsCall).not.toContain("price");

      // Verify rooms API call
      const roomsCall = fetchMock.mock.calls[1][0];
      expect(roomsCall).toContain("hotels/diH7/price");
      expect(roomsCall).toContain("destination_id=456");
      expect(roomsCall).toContain(`checkin=${validCheckinDate}`);
      expect(roomsCall).toContain(`checkout=${validCheckoutDate}`);
    });
  });

  describe("error handling", () => {
    it("should handle when one API fails", async () => {
      // Mock hotel details API to succeed
      const mockHotelDetailsResponse = {
        id: "diH7",
        name: "Test Hotel",
        address: "Test Address",
        rating: 4.0,
        latitude: 1.0,
        longitude: 103.0,
        description: "Test description",
        amenities: [],
        categories: [],
        amenities_ratings: {},
        image_details: [],
        imageCount: 0,
        number_of_images: 0,
        default_image_index: 0,
        hires_image_index: 0,
        checkin_time: "14:00",
      };

      // Mock responses: first succeeds, second fails
      fetchMock.mockResponses([
        JSON.stringify(mockHotelDetailsResponse),
        { status: 200 },
      ]);
      fetchMock.mockReject(new Error("Rooms API timeout"));

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Combined hotel data fetch failed",
        message: "Failed to fetch room details: Rooms API timeout",
        details: expect.objectContaining({
          controller: "combinedHotelDataController",
          timestamp: expect.any(String),
        }),
      });
    });

    it("should validate required fields", async () => {
      const invalidRequestBody = {
        hotel_id: "diH7",
        // Missing required fields
      };

      const response = await request(app).post("/").send(invalidRequestBody);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing");
    });

    it("should validate date constraints", async () => {
      const invalidDateBody = {
        hotel_id: "diH7",
        destination_id: "456",
        checkin: invalidEarlyCheckinDate, // Less than 3 days from today
        checkout: validCheckoutDate,
        currency: "SGD",
        guestsEachRoom: 2,
        rooms: 1,
      };

      const response = await request(app).post("/").send(invalidDateBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid checkin date",
        message: "Check-in date must be at least 3 days from today",
        details: expect.objectContaining({
          endpoint: "combinedHotelDataController",
          timestamp: expect.any(String),
        }),
      });
    });

    it("should validate checkout after checkin", async () => {
      const invalidDateBody = {
        hotel_id: "diH7",
        destination_id: "456",
        checkin: validCheckinDate, // Valid checkin date
        checkout: invalidCheckoutBeforeCheckinDate, // Before checkin
        currency: "SGD",
        guestsEachRoom: 2,
        rooms: 1,
      };

      const response = await request(app).post("/").send(invalidDateBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid checkout date",
        message: "Check-out date must be after check-in date",
        details: expect.objectContaining({
          endpoint: "combinedHotelDataController",
          timestamp: expect.any(String),
        }),
      });
    });
  });
});
