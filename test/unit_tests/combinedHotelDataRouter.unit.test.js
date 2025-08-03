const request = require("supertest");
const express = require("express");
const combinedHotelDataRouter = require("../../routes/combinedHotelDataRouter");
const combinedHotelDataController = require("../../controller/combinedHotelDataController");

// Mock the controller
jest.mock("../../controller/combinedHotelDataController", () => ({
  getCombinedHotelData: jest.fn(),
}));

describe("combinedHotelDataRouter Unit Tests", () => {
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
    jest.clearAllMocks();
    validRequestBody.checkin = validCheckinDate;
    validRequestBody.checkout = validCheckoutDate;
  });

  describe("successful responses", () => {
    it("should return combined hotel and room data with correct structure", async () => {
      // Mock successful controller response
      const mockCombinedData = {
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
            additionalInfo: {
              breakfastInfo: "breakfast_included",
              displayFields: {
                surcharges: [{ type: "TaxAndServiceFee", amount: 120.5 }],
              },
            },
            longDesc: "Spacious room with city view and modern amenities",
            price: 2500.75,
            image: "https://example.com/room-hero.jpg",
          },
        ],
      };

      // Mock controller to respond with JSON
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.json(mockCombinedData);
        }
      );

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCombinedData);

      // Verify controller was called with correct parameters
      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
      const [req, res] =
        combinedHotelDataController.getCombinedHotelData.mock.calls[0];
      expect(req.body).toEqual(validRequestBody);
    });

    it("should handle POST requests correctly", async () => {
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle controller errors properly", async () => {
      // Mock controller to return error response
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.status(500).json({
            error: "Combined hotel data fetch failed",
            message: "Service unavailable",
            details: {
              controller: "combinedHotelDataController",
              timestamp: new Date().toISOString(),
            },
          });
        }
      );

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Combined hotel data fetch failed",
        message: "Service unavailable",
        details: expect.objectContaining({
          controller: "combinedHotelDataController",
          timestamp: expect.any(String),
        }),
      });

      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle validation errors from controller", async () => {
      // Mock controller to return validation error
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.status(400).json({
            error: "Missing destination_id",
            message: "Please add destination_id to the JSON body",
            details: {
              endpoint: "combinedHotelDataController",
            },
          });
        }
      );

      const invalidRequestBody = {
        hotel_id: "diH7",
        // Missing required fields
      };

      const response = await request(app).post("/").send(invalidRequestBody);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing destination_id");
      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle date validation errors from controller", async () => {
      // Mock controller to return date validation error
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.status(400).json({
            error: "Invalid checkin date",
            message: "Check-in date must be at least 3 days from today",
            details: {
              endpoint: "combinedHotelDataController",
              timestamp: new Date().toISOString(),
            },
          });
        }
      );

      const invalidDateBody = {
        hotel_id: "diH7",
        destination_id: "456",
        checkin: invalidEarlyCheckinDate,
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

      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle checkout date validation errors from controller", async () => {
      // Mock controller to return checkout validation error
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          res.status(400).json({
            error: "Invalid checkout date",
            message: "Check-out date must be after check-in date",
            details: {
              endpoint: "combinedHotelDataController",
              timestamp: new Date().toISOString(),
            },
          });
        }
      );

      const invalidDateBody = {
        hotel_id: "diH7",
        destination_id: "456",
        checkin: validCheckinDate,
        checkout: invalidCheckoutBeforeCheckinDate,
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

      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed JSON properly", async () => {
      const response = await request(app)
        .post("/")
        .set("Content-Type", "application/json")
        .send('{"malformed": json}');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Bad Request",
        message: "Invalid JSON payload",
      });

      // Controller shouldn't be called for malformed JSON
      expect(
        combinedHotelDataController.getCombinedHotelData
      ).not.toHaveBeenCalled();
    });

    it("should verify request and response objects are passed correctly", async () => {
      combinedHotelDataController.getCombinedHotelData.mockImplementation(
        (req, res) => {
          // Verify req.body contains the expected data
          expect(req.body).toEqual(validRequestBody);
          // Verify res object has expected methods
          expect(typeof res.json).toBe("function");
          expect(typeof res.status).toBe("function");

          res.json({ success: true });
        }
      );

      const response = await request(app).post("/").send(validRequestBody);

      expect(response.status).toBe(200);
      expect(
        combinedHotelDataController.getCombinedHotelData
      ).toHaveBeenCalledTimes(1);
    });
  });
});
