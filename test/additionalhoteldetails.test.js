const request = require('supertest');
const express = require('express');
const additionalhoteldetailsRouter = require('../routes/additionalhoteldetails');

// Mock the utils module
jest.mock('../utils/utils.js', () => ({
  poller: jest.fn()
}));

const { poller } = require('../utils/utils.js');

// Create test app
const app = express();
app.use(express.json());
app.use('/additionalhoteldetails', additionalhoteldetailsRouter);

describe('Additional Hotel Details API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /additionalhoteldetails/:hotelId', () => {
    const mockHotelData = {
      id: "diH7",
      name: "The Fullerton Hotel Singapore",
      address: "1 Fullerton Square",
      rating: 5,
      latitude: 1.28624,
      longitude: 103.852889,
      description: "Pamper yourself with a visit to the spa...",
      amenities: {
        airConditioning: true,
        businessCenter: true,
        clothingIron: true,
        dataPorts: true
      },
      categories: {
        overall: {
          name: "Overall",
          score: 90,
          popularity: 5
        },
        business_hotel: {
          name: "Business Hotel",
          score: 97,
          popularity: 2.9867220735786
        }
      },
      amenities_ratings: [
        {
          name: "Location",
          score: 96
        },
        {
          name: "Service",
          score: 91
        }
      ],
      image_details: {
        suffix: ".jpg",
        count: 86,
        prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/diH7/"
      },
      imageCount: 86,
      number_of_images: 76,
      default_image_index: 1,
      hires_image_index: "0,1,2,3,4,5",
      checkin_time: "3:00 PM",
      trustyou: {
        score: {
          overall: 95
        }
      }
    };

    it('should successfully fetch and return cleaned hotel data', async () => {
      poller.mockResolvedValue(mockHotelData);

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(200);

      expect(response.body).toEqual({
        id: "diH7",
        name: "The Fullerton Hotel Singapore",
        address: "1 Fullerton Square",
        rating: 5,
        latitude: 1.28624,
        longitude: 103.852889,
        description: "Pamper yourself with a visit to the spa...",
        amenities: {
          airConditioning: true,
          businessCenter: true,
          clothingIron: true,
          dataPorts: true
        },
        categories: {
          overall: {
            name: "Overall",
            score: 90,
            popularity: 5
          },
          business_hotel: {
            name: "Business Hotel",
            score: 97,
            popularity: 2.9867220735786
          }
        },
        amenities_ratings: [
          {
            name: "Location",
            score: 96
          },
          {
            name: "Service",
            score: 91
          }
        ],
        image_details: {
          suffix: ".jpg",
          count: 86,
          prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/diH7/"
        },
        imageCount: 86,
        number_of_images: 76,
        default_image_index: 1,
        hires_image_index: "0,1,2,3,4,5",
        checkin_time: "3:00 PM"
      });

      expect(poller).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/diH7');
      expect(poller).toHaveBeenCalledTimes(1);
    });

    it('should call poller with correct URL for different hotel IDs', async () => {
      poller.mockResolvedValue(mockHotelData);

      await request(app)
        .post('/additionalhoteldetails/abc123')
        .expect(200);

      expect(poller).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/abc123');
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalHotelData = {
        id: "test123",
        name: "Test Hotel",
        address: "123 Test Street",
        rating: 4,
        latitude: 1.0,
        longitude: 103.0
        // Missing optional fields like description, amenities, etc.
      };

      poller.mockResolvedValue(minimalHotelData);

      const response = await request(app)
        .post('/additionalhoteldetails/test123')
        .expect(200);

      expect(response.body).toEqual({
        id: "test123",
        name: "Test Hotel",
        address: "123 Test Street",
        rating: 4,
        latitude: 1.0,
        longitude: 103.0,
        description: undefined,
        amenities: undefined,
        categories: undefined,
        amenities_ratings: undefined,
        image_details: undefined,
        imageCount: undefined,
        number_of_images: undefined,
        default_image_index: undefined,
        hires_image_index: undefined,
        checkin_time: undefined
      });
    });

    it('should handle poller errors', async () => {
      const errorMessage = 'API request failed';
      poller.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(500);

      expect(poller).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/diH7');
    });

    it('should set CORS headers correctly', async () => {
      poller.mockResolvedValue(mockHotelData);

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5000');
    });

    it('should filter out extra fields from API response', async () => {
      const hotelDataWithExtraFields = {
        ...mockHotelData,
        extraField1: "should be filtered out",
        extraField2: 12345,
        anotherField: { nested: "data" }
      };

      poller.mockResolvedValue(hotelDataWithExtraFields);

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(200);

      // Verify extra fields are not in response
      expect(response.body).not.toHaveProperty('extraField1');
      expect(response.body).not.toHaveProperty('extraField2');
      expect(response.body).not.toHaveProperty('anotherField');
      
      // Verify expected fields are still there
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('address');
    });

    it('should return JSON content type', async () => {
      poller.mockResolvedValue(mockHotelData);

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(200);

      expect(response.type).toBe('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      poller.mockRejectedValue(new Error('TIMEOUT'));

      await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(500);
    });

    it('should handle malformed API responses', async () => {
      poller.mockResolvedValue(null);

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(500);
    });

    it('should handle empty hotel ID', async () => {
      // This will return 404 for missing route parameter
      await request(app)
        .post('/additionalhoteldetails/')
        .expect(404); // Should return 404 for missing route
    });
  });

  describe('Data Validation', () => {
    it('should preserve data types in response', async () => {
      poller.mockResolvedValue({
        id: "diH7",
        name: "Test Hotel",
        address: "Test Address",
        rating: 4.5,
        latitude: 1.28624,
        longitude: 103.852889,
        description: "Test description",
        amenities: {
          airConditioning: true,
          pool: false
        },
        imageCount: 86,
        number_of_images: 76,
        default_image_index: 1
      });

      const response = await request(app)
        .post('/additionalhoteldetails/diH7')
        .expect(200);

      expect(typeof response.body.rating).toBe('number');
      expect(typeof response.body.latitude).toBe('number');
      expect(typeof response.body.longitude).toBe('number');
      expect(typeof response.body.amenities.airConditioning).toBe('boolean');
      expect(typeof response.body.imageCount).toBe('number');
    });
  });
});