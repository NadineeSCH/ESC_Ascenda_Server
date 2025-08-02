const hotelDetailsService = require('../../service/hotelDetailsService');

global.fetch = jest.fn();

describe('hotelDetailsService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getHotelDetails', () => {
    const mockHotelData = {
      id: 'jOZC',
      name: 'Park Avenue Rochester',
      address: '31 Rochester Drive',
      rating: 4,
      latitude: 1.3049,
      longitude: 103.788184,
      description: "Don't miss out on recreational opportunities including an outdoor pool and a fitness center. This hotel also features complimentary wireless internet access, concierge services, and a banquet hall.",
      amenities: {
        inHouseBar: true,
        fitnessFacility: true,
        inHouseDining: true,
        dryCleaning: true,
        outdoorPool: true,
        nonSmokingRooms: true,
        continentalBreakfast: true,
        airportTransportation: true
      },
      categories: {},
      amenities_ratings: [],
      image_details: {
        suffix: ".jpg",
        count: 69,
        prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/jOZC/"
      },
      imageCount: 69,
      number_of_images: 69,
      default_image_index: 1,
      hires_image_index: "",
      checkin_time: "3:00 PM",
      extra_field: 'should_be_filtered_out'
    };

    it('should fetch and return cleaned hotel data successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHotelData
      });

      const result = await hotelDetailsService.getHotelDetails('jOZC');

      expect(fetch).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/jOZC');
      expect(result.data).toEqual({
        id: 'jOZC',
        name: 'Park Avenue Rochester',
        address: '31 Rochester Drive',
        rating: 4,
        latitude: 1.3049,
        longitude: 103.788184,
        description: "Don't miss out on recreational opportunities including an outdoor pool and a fitness center. This hotel also features complimentary wireless internet access, concierge services, and a banquet hall.",
        amenities: {
          inHouseBar: true,
          fitnessFacility: true,
          inHouseDining: true,
          dryCleaning: true,
          outdoorPool: true,
          nonSmokingRooms: true,
          continentalBreakfast: true,
          airportTransportation: true
        },
        categories: {},
        amenities_ratings: [],
        image_details: {
          suffix: ".jpg",
          count: 69,
          prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/jOZC/"
        },
        imageCount: 69,
        number_of_images: 69,
        default_image_index: 1,
        hires_image_index: "",
        checkin_time: "3:00 PM"
      });
      // Verify extra fields are filtered out
      expect(result.data.extra_field).toBeUndefined();
    });

    it('should throw error when HTTP response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(hotelDetailsService.getHotelDetails('nonexistent'))
        .rejects.toThrow('Failed to fetch hotel details: HTTP 404: Not Found');
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(hotelDetailsService.getHotelDetails('jOZC'))
        .rejects.toThrow('Failed to fetch hotel details: Network error');
    });

    it('should throw error when JSON parsing fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(hotelDetailsService.getHotelDetails('jOZC'))
        .rejects.toThrow('Failed to fetch hotel details: Invalid JSON');
    });

    it('should handle empty amenities object', async () => {
      const mockDataWithEmptyAmenities = {
        ...mockHotelData,
        amenities: {},
        categories: {}
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataWithEmptyAmenities
      });

      const result = await hotelDetailsService.getHotelDetails('jOZC');
      expect(result.data.amenities).toEqual({});
      expect(result.data.categories).toEqual({});
    });

    it('should handle empty hires_image_index as string', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHotelData
      });

      const result = await hotelDetailsService.getHotelDetails('jOZC');
      expect(result.data.hires_image_index).toBe("");
    });
  });
});