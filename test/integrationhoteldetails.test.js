// integrationhoteldetails.test.js
const request = require('supertest');
const express = require('express');
const hotelDetailsRouter = require('../routes/hoteldetails');
const fetchMock = require('jest-fetch-mock');

// Enable fetch mocking
fetchMock.enableMocks();

describe('HotelDetails API Integration Test', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', hotelDetailsRouter);
  });

  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useRealTimers(); // Use real timers for integration test
  });

  it('should return hotel room data after polling completes', async () => {
    // Mock the external API responses
    fetchMock.mockResponses(
      // First poll response (not completed)
      [JSON.stringify({
        completed: false,
        rooms: []
      }), { status: 200 }],
      
      // Second poll response (completed with data)
      [JSON.stringify({
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: 'Deluxe Room',
            free_cancellation: true,
            roomAdditionalInfo: {
              breakfastInfo: 'Free breakfast'
            },
            long_description: 'Spacious room with view',
            price: 250,
            images: [
              { hero_image: true, url: 'https://example.com/room1.jpg' }
            ]
          }
        ]
      }), { status: 200 }]
    );

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
          breakfastInfo: 'Free breakfast'
        },
        longDesc: 'Spacious room with view',
        price: 250,
        image: 'https://example.com/room1.jpg'
      }
    ]);

    // Verify the external API was called with correct URL
    const expectedUrl = `https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=USD&country_code=SG&guests=2&partner_id=1`;
    
    // Should be called twice due to polling
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle API errors gracefully', async () => {
    fetchMock.mockReject(new Error('API is down'));

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

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle multiple rooms in guest parameter', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      completed: true,
      rooms: []
    }));

    await request(app)
      .post('/')
      .send({
        hotelId: '123',
        destinationId: '456',
        checkin: '2023-01-01',
        checkout: '2023-01-05',
        currency: 'USD',
        guestsEachRoom: 2,
        rooms: 3
      });

    const expectedUrl = `https://hotelapi.loyalty.dev/api/hotels/123/price?destination_id=456&checkin=2023-01-01&checkout=2023-01-05&lang=en_US&currency=USD&country_code=SG&guests=2|2|2&partner_id=1`;
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
  });
});