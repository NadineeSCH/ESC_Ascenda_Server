const combinedHotelDataController = require('../../controller/combinedHotelDataController');
const hotelDetailsService = require('../../service/hotelDetailsService');
const hotelRoomsService = require('../../service/hotelRoomsService');

// Mock the services
jest.mock('../../service/hotelDetailsService');
jest.mock('../../service/hotelRoomsService');

describe('combinedHotelDataController Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Mock request, response, and next
    mockReq = {
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Mock Date to ensure consistent timestamps in tests
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-08-03T10:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validRequestBody = {
    destination_id: "RsBU",
    hotel_id: "jOZC",
    checkin: "2025-10-01",
    checkout: "2025-10-07", 
    currency: "SGD",
    rooms: "2",
    guestsEachRoom: "2"
  };

  const mockHotelDetailsResponse = {
    data: {
      id: "jOZC",
      name: "Park Avenue Rochester",
      address: "31 Rochester Drive",
      rating: 4,
      latitude: 1.3049,
      longitude: 103.788184,
      description: "Hotel description...",
      amenities: { inHouseBar: true, fitnessFacility: true },
      categories: {},
      amenities_ratings: [],
      image_details: { suffix: ".jpg", count: 69 },
      imageCount: 69,
      number_of_images: 69,
      default_image_index: 1,
      hires_image_index: "",
      checkin_time: "3:00 PM"
    }
  };

  const mockRoomsResponse = {
    data: [{
      roomNormalizedDescription: "Superior Double Or Twin Room 1 King Bed",
      free_cancellation: true,
      breakfastInfo: "hotel_detail_room_only",
      additionalInfo: { breakfastInfo: "hotel_detail_room_only" },
      longDesc: "Room description...",
      price: 6721.08,
      image: "https://example.com/room.jpg"
    }]
  };

  describe('Request Validation', () => {

    describe('Empty/Null Body Validation', () => {
      
      test('should return 400 when request body is empty object', async () => {
        mockReq.body = {};

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Empty JSON Body",
          message: "Please provide a proper JSON body",
          details: {
            endpoint: "combinedHotelDataController"
          }
        });
        expect(hotelDetailsService.getHotelDetails).not.toHaveBeenCalled();
        expect(hotelRoomsService.getRoomDetails).not.toHaveBeenCalled();
      });

      test('should return 400 when request body is null', async () => {
        mockReq.body = null;

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Empty JSON Body",
          message: "Please provide a proper JSON body",
          details: {
            endpoint: "combinedHotelDataController"
          }
        });
      });

      test('should return 400 when request body is undefined', async () => {
        mockReq.body = undefined;

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Empty JSON Body",
          message: "Please provide a proper JSON body",
          details: {
            endpoint: "combinedHotelDataController"
          }
        });
      });
    });

    describe('Required Fields Validation', () => {
      const requiredFields = ["hotel_id", "destination_id", "checkin", "checkout", "currency", "guestsEachRoom", "rooms"];

      requiredFields.forEach(field => {
        test(`should return 400 when ${field} is missing`, async () => {
          mockReq.body = { ...validRequestBody };
          delete mockReq.body[field];

          await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            error: `Missing ${field}`,
            message: `Please add ${field} to the JSON body`,
            details: {
              endpoint: "combinedHotelDataController"
            }
          });
          expect(hotelDetailsService.getHotelDetails).not.toHaveBeenCalled();
          expect(hotelRoomsService.getRoomDetails).not.toHaveBeenCalled();
        });

        test(`should return 400 when ${field} is null`, async () => {
          mockReq.body = { ...validRequestBody };
          mockReq.body[field] = null;

          await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            error: `Missing ${field}`,
            message: `Please add ${field} to the JSON body`,
            details: {
              endpoint: "combinedHotelDataController"
            }
          });
        });

        test(`should return 400 when ${field} is empty string`, async () => {
          mockReq.body = { ...validRequestBody };
          mockReq.body[field] = '';

          await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            error: `Missing ${field}`,
            message: `Please add ${field} to the JSON body`,
            details: {
              endpoint: "combinedHotelDataController"
            }
          });
        });

        test(`should not return 400 when ${field} is false`, async () => {
          if (field === 'rooms' || field === 'guestsEachRoom') {
            mockReq.body = { ...validRequestBody };
            mockReq.body[field] = false;

            hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
            hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

            await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

            // Should proceed with service calls since false is a valid value
            expect(mockRes.status).not.toHaveBeenCalledWith(400);
          }
        });
      });
    });

    describe('Date Validation', () => {
      
      test('should return 400 when checkin date is less than 3 days from today', async () => {
        // Use jest.useFakeTimers to mock the current date
        const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);

        mockReq.body = {
          ...validRequestBody,
          checkin: "2025-08-05" // Only 2 days from 2025-08-03
        };

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Invalid checkin date",
          message: "Check-in date must be at least 3 days from today",
          details: {
            endpoint: "combinedHotelDataController",
            timestamp: "2025-08-03T10:00:00.000Z"
          }
        });

        jest.useRealTimers();
      });

      test('should accept checkin date that is exactly 3 days from today', async () => {
        const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);

        mockReq.body = {
          ...validRequestBody,
          checkin: "2025-08-06" // Exactly 3 days from 2025-08-03
        };

        hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
        hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(hotelDetailsService.getHotelDetails).toHaveBeenCalled();

        jest.useRealTimers();
      });

      test('should return 400 when checkout date is before checkin date', async () => {
        mockReq.body = {
          ...validRequestBody,
          checkin: "2025-10-07",
          checkout: "2025-10-05"
        };

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Invalid checkout date",
          message: "Check-out date must be after check-in date",
          details: {
            endpoint: "combinedHotelDataController",
            timestamp: "2025-08-03T10:00:00.000Z"
          }
        });
      });

      test('should return 400 when checkout date equals checkin date', async () => {
        mockReq.body = {
          ...validRequestBody,
          checkin: "2025-10-05",
          checkout: "2025-10-05"
        };

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Invalid checkout date",
          message: "Check-out date must be after check-in date",
          details: {
            endpoint: "combinedHotelDataController",
            timestamp: "2025-08-03T10:00:00.000Z"
          }
        });
      });

      test('should accept valid date range', async () => {
        mockReq.body = {
          ...validRequestBody,
          checkin: "2025-10-05",
          checkout: "2025-10-07"
        };

        hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
        hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(hotelDetailsService.getHotelDetails).toHaveBeenCalled();
        expect(hotelRoomsService.getRoomDetails).toHaveBeenCalled();
      });

      test('should handle invalid date formats gracefully', async () => {
        const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);

        mockReq.body = {
          ...validRequestBody,
          checkin: "invalid-date",
          checkout: "2025-10-07"
        };

        await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

        // Should return 400 for invalid checkin date and NOT continue execution
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: "Invalid checkin date",
          message: "Check-in date must be at least 3 days from today",
          details: {
            endpoint: "combinedHotelDataController",
            timestamp: "2025-08-03T10:00:00.000Z"
          }
        });

        // Services should NOT be called when validation fails
        expect(hotelDetailsService.getHotelDetails).not.toHaveBeenCalled();
        expect(hotelRoomsService.getRoomDetails).not.toHaveBeenCalled();

        jest.useRealTimers();
      });
    });
  });

  describe('Service Integration', () => {

    test('should call both services with correct parameters', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10", // Valid dates
        checkout: "2025-08-15"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(hotelDetailsService.getHotelDetails).toHaveBeenCalledWith("jOZC");
      expect(hotelRoomsService.getRoomDetails).toHaveBeenCalledWith(mockReq.body);
      expect(hotelDetailsService.getHotelDetails).toHaveBeenCalledTimes(1);
      expect(hotelRoomsService.getRoomDetails).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    test('should return combined data on successful service calls', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        hotelDetails: mockHotelDetailsResponse.data,
        rooms: mockRoomsResponse.data
      });
      expect(mockRes.status).not.toHaveBeenCalled(); // Should be 200 by default

      jest.useRealTimers();
    });

    test('should use Promise.all for concurrent service calls', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      let detailsResolve, roomsResolve;
      const detailsPromise = new Promise(resolve => { detailsResolve = resolve; });
      const roomsPromise = new Promise(resolve => { roomsResolve = resolve; });

      hotelDetailsService.getHotelDetails.mockReturnValue(detailsPromise);
      hotelRoomsService.getRoomDetails.mockReturnValue(roomsPromise);

      const controllerPromise = combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      // Resolve both promises
      detailsResolve(mockHotelDetailsResponse);
      roomsResolve(mockRoomsResponse);

      await controllerPromise;

      expect(hotelDetailsService.getHotelDetails).toHaveBeenCalled();
      expect(hotelRoomsService.getRoomDetails).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        hotelDetails: mockHotelDetailsResponse.data,
        rooms: mockRoomsResponse.data
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {

    test('should handle hotelDetailsService error', async () => {
      // Use valid dates to pass validation and reach service calls
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10", // Valid: more than 3 days from 2025-08-03
        checkout: "2025-08-15"  // Valid: after checkin
      };
      
      const error = new Error('Failed to fetch hotel details: HTTP 404: Not Found');
      hotelDetailsService.getHotelDetails.mockRejectedValue(error);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Combined hotel data fetch failed",
        message: 'Failed to fetch hotel details: HTTP 404: Not Found',
        details: {
          controller: "combinedHotelDataController",
          timestamp: "2025-08-03T10:00:00.000Z"
        }
      });

      jest.useRealTimers();
    });

    test('should handle hotelRoomsService error', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      const error = new Error('Failed to fetch room details: Max attempts reached');
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockRejectedValue(error);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Combined hotel data fetch failed",
        message: 'Failed to fetch room details: Max attempts reached',
        details: {
          controller: "combinedHotelDataController",
          timestamp: "2025-08-03T10:00:00.000Z"
        }
      });

      jest.useRealTimers();
    });

    test('should handle both services failing', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      const detailsError = new Error('Details service failed');
      const roomsError = new Error('Rooms service failed');
      
      hotelDetailsService.getHotelDetails.mockRejectedValue(detailsError);
      hotelRoomsService.getRoomDetails.mockRejectedValue(roomsError);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Combined hotel data fetch failed",
        message: 'Details service failed', // Promise.all fails fast
        details: {
          controller: "combinedHotelDataController",
          timestamp: "2025-08-03T10:00:00.000Z"
        }
      });

      jest.useRealTimers();
    });

    test('should handle error without message property', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      const error = { toString: () => 'Custom error' };
      hotelDetailsService.getHotelDetails.mockRejectedValue(error);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Combined hotel data fetch failed",
        message: undefined, // No message property
        details: {
          controller: "combinedHotelDataController",
          timestamp: "2025-08-03T10:00:00.000Z"
        }
      });

      jest.useRealTimers();
    });

    test('should not call next middleware on errors', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      const error = new Error('Service error');
      hotelDetailsService.getHotelDetails.mockRejectedValue(error);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Response Formatting', () => {

    test('should format response with correct structure', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        hotelDetails: mockHotelDetailsResponse.data,
        rooms: mockRoomsResponse.data
      });

      jest.useRealTimers();
    });

    test('should handle null data from services', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue({ data: null });
      hotelRoomsService.getRoomDetails.mockResolvedValue({ data: null });

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        hotelDetails: null,
        rooms: null
      });

      jest.useRealTimers();
    });

    test('should handle empty data from services', async () => {
      const mockCurrentDate = new Date('2025-08-03T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);

      mockReq.body = {
        ...validRequestBody,
        checkin: "2025-08-10",
        checkout: "2025-08-15"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue({ data: {} });
      hotelRoomsService.getRoomDetails.mockResolvedValue({ data: [] });

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        hotelDetails: {},
        rooms: []
      });

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {

    test('should handle very large hotel_id', async () => {
      mockReq.body = {
        ...validRequestBody,
        hotel_id: "a".repeat(1000) // Very long hotel ID
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(hotelDetailsService.getHotelDetails).toHaveBeenCalledWith("a".repeat(1000));
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should handle special characters in request fields', async () => {
      mockReq.body = {
        ...validRequestBody,
        hotel_id: "special-chars-!@#$%",
        destination_id: "dest_123",
        currency: "USD"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(hotelDetailsService.getHotelDetails).toHaveBeenCalledWith("special-chars-!@#$%");
      expect(hotelRoomsService.getRoomDetails).toHaveBeenCalledWith(mockReq.body);
    });

    test('should handle numeric strings for rooms and guests', async () => {
      mockReq.body = {
        ...validRequestBody,
        rooms: "10",
        guestsEachRoom: "4"
      };
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(hotelRoomsService.getRoomDetails).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should not mutate original request body', async () => {
      const originalBody = { ...validRequestBody };
      mockReq.body = originalBody;
      
      hotelDetailsService.getHotelDetails.mockResolvedValue(mockHotelDetailsResponse);
      hotelRoomsService.getRoomDetails.mockResolvedValue(mockRoomsResponse);

      await combinedHotelDataController.getCombinedHotelData(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual(originalBody);
    });
  });
});