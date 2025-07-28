const request = require("supertest");
const express = require("express");
const hotelDetailsRouter = require("../routes/hotelDetailsRouter");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

describe("hotelDetailsRouter Integration Tests", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", hotelDetailsRouter);

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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const validRequestBody = {
    hotelId: "diH7"
  };

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

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5000"
      );
      expect(response.body).toEqual({
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
      });
    });
  });

  describe("error handling", () => {
    it("should return 500 when API request fails", async () => {
      fetchMock.mockReject(new Error("API timeout"));

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Hotel details fetch failed",
        message: "Failed to fetch from external API: API timeout",
        details: expect.objectContaining({
          endpoint: "hotelDetailsService",
          timestamp: expect.any(String)
        })
      });
    });

    it("should return 400 for invalid JSON", async () => {
      const invalidJson = '{"malformed": json}';

      const response = await request(app)
        .post("/")
        .set("Content-Type", "application/json")
        .send(invalidJson);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.any(String),
        message: expect.stringContaining("JSON"),
      });
    });

    it("should handle missing hotelId", async () => {
      const response = await request(app).post("/").send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it("should handle HTTP error responses", async () => {
      fetchMock.mockResponseOnce("", { status: 404 });

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("HTTP 404");
    });
  });
});