const express = require('express');
const request = require('supertest');
const hotelResultsRouter = require('../../routes/hotelResultsRouter');
const hotelResultsController = require('../../controller/hotelResultsController');

// Mock the controller method
jest.mock('../../controller/hotelResultsController');

describe('hotelResultsRouter', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/hotel-results', hotelResultsRouter);
    jest.clearAllMocks();
  });

  test('POST /hotel-results exists and calls controller', async () => {
    hotelResultsController.getSearchResults.mockImplementation((req, res) => {
      res.status(200).json({ message: 'controller reached' });
    });

    const response = await request(app)
      .post('/hotel-results')
      .send({ any: 'data' });

    expect(hotelResultsController.getSearchResults).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'controller reached' });
  });

  test('POST /hotel-results passes req, res, next correctly', async () => {
    const mockHandler = jest.fn((req, res) => {
      res.status(201).json({ received: req.body });
    });
    hotelResultsController.getSearchResults.mockImplementation(mockHandler);

    const payload = { test: 'value' };

    const response = await request(app)
      .post('/hotel-results')
      .send(payload);

    expect(mockHandler).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ received: payload });
  });

  test('non-POST routes are not handled', async () => {
    const response = await request(app).get('/hotel-results');
    expect(response.status).toBe(404);
  });
});
