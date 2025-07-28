const request = require("supertest");
const express = require("express");
const hotelRoomsRouter = require("../routes/hotelRoomsRouter");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelRoomsRouter Integration Tests", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", hotelRoomsRouter);

    // Error handling middleware
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid JSON payload",
        });
      }
      // Handle other errors
      res.status(500).json({ error: "Internal Server Error" });
    });
  });

  beforeEach(() => {
    fetchMock.resetMocks();
    //jest.useRealTimers();
  });

  const validRequestBody = {
    hotelId: "123",
    destinationId: "456",
    checkin: "2023-11-01",
    checkout: "2023-11-05",
    currency: "SGD",
    guestsEachRoom: 2,
    rooms: 1,
  };

  describe("successful responses", () => {
    it("should return room data with correct structure", async () => {
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

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5000"
      );
      expect(response.body).toEqual([
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

      const response = await request(app)
        .post("/")
        .send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Hotel data fetch failed",
        message: "Failed to fetch from external API: API timeout",
        details: expect.objectContaining({
          endpoint: "hotelDetailsService"
        })
      });
    });

    it("should return 400 for invalid JSON", async () => {
      // Create a raw request with invalid JSON
      const invalidJson = '{"malformed": json}';

      const response = await request(app)
        .post("/")
        .set("Content-Type", "application/json")
        .send(invalidJson);

      // Express's default JSON parser returns 400 for invalid JSON
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.any(String),
        message: expect.stringContaining("JSON"),
      });
    });

    it("should handle missing required fields", async () => {
      const response = await request(app).post("/").send({}); // Missing required fields

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});