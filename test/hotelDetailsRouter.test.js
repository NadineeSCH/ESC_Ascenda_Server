const request = require('supertest');
const express = require('express');
const hotelDetailsRouter = require('../routes/hotelDetailsRouter');
const hotelDetailsController = require('../controller/hotelDetailsController');

// Mock the controller
jest.mock('../controller/hotelDetailsController');

describe('Hotel Details Router', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', hotelDetailsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should route POST / to hotelDetailsController.getHotelDetails', async () => {
    hotelDetailsController.getHotelDetails.mockImplementation((req, res) => {
      res.json({ success: true });
    });

    const response = await request(app)
      .post('/')
      .send({ hotelId: '123' })
      .set('Accept', 'application/json');

    expect(hotelDetailsController.getHotelDetails).toHaveBeenCalledTimes(1);
    expect(hotelDetailsController.getHotelDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { hotelId: '123' }
      }),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should handle JSON requests properly', async () => {
    hotelDetailsController.getHotelDetails.mockImplementation((req, res) => {
      res.json({ hotelId: req.body.hotelId });
    });

    const requestBody = {
      hotelId: '456'
    };

    const response = await request(app)
      .post('/')
      .send(requestBody)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ hotelId: '456' });
  });

  it('should return 404 for unsupported methods', async () => {
    const response = await request(app)
      .get('/');

    expect(response.status).toBe(404);
  });

  it('should return 404 for unsupported routes', async () => {
    const response = await request(app)
      .post('/invalid-route');

    expect(response.status).toBe(404);
  });
});