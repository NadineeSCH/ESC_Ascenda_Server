const hotelDetailsController = require('../controller/hotelDetailsController');
const hotelDetailsService = require('../service/hotelDetailsService');

// Mock the service
jest.mock('../service/hotelDetailsService');

describe('Hotel Details Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        hotelId: '123'
      }
    };
    mockRes = {
      set: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHotelDetails', () => {
    it('should return hotel data when service succeeds', async () => {
      const mockServiceResponse = {
        success: true,
        data: {
          id: '123',
          name: 'Test Hotel',
          address: '123 Test Street',
          rating: 4.5
        }
      };

      hotelDetailsService.getHotelDetails.mockResolvedValue(mockServiceResponse);

      await hotelDetailsController.getHotelDetails(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5000');
      expect(mockRes.json).toHaveBeenCalledWith(mockServiceResponse.data);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 500 error when service fails', async () => {
      const mockServiceResponse = {
        success: false,
        error: 'API Error',
        details: {
          endpoint: 'hotelDetailsService',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      };

      hotelDetailsService.getHotelDetails.mockResolvedValue(mockServiceResponse);

      await hotelDetailsController.getHotelDetails(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5000');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Hotel details fetch failed',
        message: 'API Error',
        details: {
          endpoint: 'hotelDetailsService',
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      });
    });

    it('should handle service throwing an exception', async () => {
      const errorMessage = 'Unexpected error';
      hotelDetailsService.getHotelDetails.mockRejectedValue(new Error(errorMessage));

      await hotelDetailsController.getHotelDetails(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Hotel details fetch failed',
        message: errorMessage,
        details: {
          controller: 'hotelDetailsController',
          timestamp: expect.any(String)
        }
      });
    });

    it('should set CORS headers on all responses', async () => {
      const mockServiceResponse = {
        success: true,
        data: { id: '123' }
      };

      hotelDetailsService.getHotelDetails.mockResolvedValue(mockServiceResponse);

      await hotelDetailsController.getHotelDetails(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5000');
    });
  });
});