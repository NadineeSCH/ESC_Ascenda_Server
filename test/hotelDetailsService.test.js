const { getHotelDetails } = require('../service/hotelDetailsService');
const { poller } = require('../utils/utils');

// Mock the utils module
jest.mock('../utils/utils', () => ({
  poller: jest.fn()
}));

describe('Hotel Details Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHotelDetails', () => {
    it('should return cleaned hotel data on successful API call', async () => {
      const mockHotelData = {
        id: '123',
        name: 'Test Hotel',
        address: '123 Test Street',
        rating: 4.5,
        latitude: 1.234,
        longitude: 5.678,
        description: 'A beautiful test hotel',
        amenities: ['WiFi', 'Pool', 'Gym'],
        categories: ['Business', 'Leisure'],
        amenities_ratings: {
          wifi: 4.5,
          pool: 4.0,
          gym: 4.2
        },
        image_details: [
          { url: 'image1.jpg', caption: 'Lobby' },
          { url: 'image2.jpg', caption: 'Room' }
        ],
        imageCount: 15,
        number_of_images: 15,
        default_image_index: 0,
        hires_image_index: 5,
        checkin_time: '15:00'
      };

      poller.mockResolvedValue(mockHotelData);

      const mockReq = {
        body: {
          hotelId: '123'
        }
      };

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        name: 'Test Hotel',
        address: '123 Test Street',
        rating: 4.5,
        latitude: 1.234,
        longitude: 5.678,
        description: 'A beautiful test hotel',
        amenities: ['WiFi', 'Pool', 'Gym'],
        categories: ['Business', 'Leisure'],
        amenities_ratings: {
          wifi: 4.5,
          pool: 4.0,
          gym: 4.2
        },
        image_details: [
          { url: 'image1.jpg', caption: 'Lobby' },
          { url: 'image2.jpg', caption: 'Room' }
        ],
        imageCount: 15,
        number_of_images: 15,
        default_image_index: 0,
        hires_image_index: 5,
        checkin_time: '15:00'
      });

      // Verify the correct URL was called
      expect(poller).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/123');
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      poller.mockRejectedValue(new Error(errorMessage));

      const mockReq = {
        body: {
          hotelId: '123'
        }
      };

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(false);
      expect(result.error).toBe(`Failed to fetch from external API: ${errorMessage}`);
      expect(result.details).toEqual({
        endpoint: 'hotelDetailsService',
        timestamp: expect.any(String)
      });
    });

    it('should handle missing hotelId', async () => {
      const mockReq = {
        body: {}
      };

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch from external API');
    });

    it('should handle partial hotel data', async () => {
      const mockHotelData = {
        id: '123',
        name: 'Minimal Hotel',
        // Missing some optional fields
      };

      poller.mockResolvedValue(mockHotelData);

      const mockReq = {
        body: {
          hotelId: '123'
        }
      };

      const result = await getHotelDetails(mockReq);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123');
      expect(result.data.name).toBe('Minimal Hotel');
      expect(result.data.amenities).toBeUndefined();
    });
  });
});