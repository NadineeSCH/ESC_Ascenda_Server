// hoteldetails.test.js
const request = require('supertest');
const express = require('express');
const hotelDetailsRouter = require('../routes/hoteldetails');
const { poller } = require('../utils/utils');

// Mock the utils module
jest.mock('../utils/utils', () => ({
  poller: jest.fn()
}));

describe('POST /hoteldetails', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', hotelDetailsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return cleaned hotel room data', async () => {
    const mockHotelData = {
      rooms: [
        {
          roomNormalizedDescription: 'Deluxe Room',
          free_cancellation: true,
          roomAdditionalInfo: {
            breakfastInfo: 'Free breakfast',
            otherInfo: 'Some info'
          },
          long_description: 'Spacious deluxe room',
          price: 200,
          images: [
            { hero_image: true, url: 'http://image.com/hero.jpg' },
            { hero_image: false, url: 'http://image.com/other.jpg' }
          ]
        }
      ]
    };

    poller.mockResolvedValue(mockHotelData);

    const requestBody = {
      hotelId: '123',
      destinationId: '456',
      checkin: '2023-01-01',
      checkout: '2023-01-05',
      currency: 'USD',
      guestsEachRoom: 2,
      rooms: 1
    };

    const response = await request(app)
      .post('/')
      .send(requestBody)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        roomNormalizedDescription: 'Deluxe Room',
        free_cancellation: true,
        breakfastInfo: 'Free breakfast',
        additionalInfo: {
          breakfastInfo: 'Free breakfast',
          otherInfo: 'Some info'
        },
        longDesc: 'Spacious deluxe room',
        price: 200,
        image: 'http://image.com/hero.jpg'
      }
    ]);

    // Verify the poller was called with the correct URL
    const expectedUrl = 'https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=USD&country_code=SG&guests=2&partner_id=1';
    expect(poller).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle multiple rooms correctly', async () => {
    poller.mockResolvedValue({ rooms: [] });

    const requestBody = {
      hotelId: '123',
      destinationId: '456',
      checkin: '2023-01-01',
      checkout: '2023-01-05',
      currency: 'USD',
      guestsEachRoom: 2,
      rooms: 3
    };

    await request(app)
      .post('/')
      .send(requestBody);

    const expectedUrl = 'https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=USD&country_code=SG&guests=2|2|2&partner_id=1';
    expect(poller).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle missing hero image', async () => {
    const mockHotelData = {
      rooms: [
        {
          roomNormalizedDescription: 'Standard Room',
          free_cancellation: false,
          roomAdditionalInfo: null,
          long_description: 'Basic room',
          price: 100,
          images: []
        }
      ]
    };

    poller.mockResolvedValue(mockHotelData);

    const response = await request(app)
      .post('/')
      .send({
        hotelId: '123',
        destinationId: '456',
        checkin: '2023-01-01',
        checkout: '2023-01-05',
        currency: 'USD',
        guestsEachRoom: 1,
        rooms: 1
      });

    expect(response.body[0].image).toBeUndefined();
  });

  it('should set CORS headers', async () => {
    poller.mockResolvedValue({ rooms: [] });

    const response = await request(app)
      .post('/')
      .send({
        hotelId: '123',
        destinationId: '456',
        checkin: '2023-01-01',
        checkout: '2023-01-05',
        currency: 'USD',
        guestsEachRoom: 1,
        rooms: 1
      });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5000');
  });
});
