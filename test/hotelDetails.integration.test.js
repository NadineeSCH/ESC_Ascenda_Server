const request = require('supertest');
const express = require('express');
const hotelDetailsRouter = require('../routes/hotelDetailsRouter');
const { poller } = require('../utils/utils');

// Mock the utils module for integration test
jest.mock('../utils/utils', () => ({
  poller: jest.fn()
}));

describe('Hotel Details Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/hoteldetails', hotelDetailsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return complete hotel details through the full stack', async () => {
    const mockHotelData = {
      id: '123',
      name: 'Integration Test Hotel',
      address: '456 Integration St',
      rating: 4.8,
      latitude: 1.234,
      longitude: 5.678,
      description: 'A hotel for integration testing',
      amenities: ['WiFi', 'Pool'],
      categories: ['Business'],
      amenities_ratings: { wifi: 4.5 },
      image_details: [],
      imageCount: 10,
      number_of_images: 10,
      default_image_index: 0,
      hires_image_index: 0,
      checkin_time: '15:00'
    };

    poller.mockResolvedValue(mockHotelData);

    const response = await request(app)
      .post('/hoteldetails')
      .send({ hotelId: '123' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5000');
    expect(response.body).toEqual(mockHotelData);
    expect(poller).toHaveBeenCalledWith('https://hotelapi.loyalty.dev/api/hotels/123');
  });

  it('should handle API errors through the full stack', async () => {
    poller.mockRejectedValue(new Error('API is down'));

    const response = await request(app)
      .post('/hoteldetails')
      .send({ hotelId: '123' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Hotel details fetch failed',
      message: 'Failed to fetch from external API: API is down',
      details: {
        endpoint: 'hotelDetailsService',
        timestamp: expect.any(String)
      }
    });
  });
});