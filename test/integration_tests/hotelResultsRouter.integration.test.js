const express = require("express");
const request = require("supertest");
const fetch = require("jest-fetch-mock");
fetch.enableMocks();

const hotelResultsRouter = require("../../routes/hotelResultsRouter");
const mockApis = require("../mocks/hotel3132ApiMocks.js");
const mockSuccessResp31 = mockApis.mockPriceList;
const mockSuccessResp32 = mockApis.mockStaticInfoList;

describe("hotelResultsRouter integration (real controller)", () => {
  let app;
  let validBody;

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.resetMocks();
    app = express();
    app.use(express.json());
    app.use("/hotel-results", hotelResultsRouter);

    const now = new Date();
    const checkin = new Date(now.getTime() + 4 * 86400000);
    const checkout = new Date(now.getTime() + 6 * 86400000);

    validBody = {
      destination_id: "RsBu",
      checkin: checkin.toISOString().split("T")[0],
      checkout: checkout.toISOString().split("T")[0],
      lang: "en_US",
      currency: "SGD",
      guestsEachRoom: 2,
      rooms: 1,
      sort_exist: true,
      sort_var: "price",
      reverse: 0,
      filter_exist: true,
      filters: {
        minPrice: 100.0,
        maxPrice: 4000.0,
        minRating: 3.5,
        maxRating: 5.0,
        minScore: 60.0,
        maxScore: null,
      },
    };
  });

  test("POST /hotel-results with valid body returns 200", async () => {
    fetch.mockResponses(
      [JSON.stringify(mockSuccessResp31), { status: 200 }],
      [JSON.stringify(mockSuccessResp32), { status: 200 }]
    );

    const res = await request(app).post("/hotel-results").send(validBody);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /hotel-results returns 404", async () => {
    const res = await request(app).get("/hotel-results");
    expect(res.statusCode).toBe(404);
  });

  test("POST with empty body returns 400", async () => {
    const res = await request(app).post("/hotel-results").send({});
    expect(res.statusCode).toBe(400);
  });

  test("Missing destination_id returns 400", async () => {
    const body = structuredClone(validBody);
    delete body.destination_id;
    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(400);
  });

  test("Wrong type for rooms returns 400", async () => {
    const body = structuredClone(validBody);
    body.rooms = [];
    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(400);
  });

  test("Invalid checkin or checkout dates return 400", async () => {
    const body = structuredClone(validBody);
    body.checkin = body.checkout;
    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(400);
  });

  test("Missing filters when filter_exist is true returns 400", async () => {
    const body = structuredClone(validBody);
    delete body.filters;
    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(400);
  });

  test("Unsupported sort_var returns 400", async () => {
    const body = structuredClone(validBody);
    body.sort_var = "stars";
    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(400);
  });

  test("Fetch failure returns 500", async () => {
    fetch.mockResponses(
      [() => Promise.reject(new Error("fetch failed")), { status: 200 }],
      [JSON.stringify(mockSuccessResp32), { status: 200 }]
    );

    const res = await request(app).post("/hotel-results").send(validBody);
    expect(res.statusCode).toBe(500);
  });

  test("Poller max attempts returns 500 (realtimers)", async () => {
    jest.useRealTimers();

    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ completed: false, hotels: [] }),
      })
    );

    const res = await request(app).post("/hotel-results").send(validBody);
    expect(res.statusCode).toBe(500);
  }, 10000);

  test("Empty API result returns 200 with empty data", async () => {
    fetch.mockResponses(
      [JSON.stringify({ completed: true, hotels: [] }), { status: 200 }],
      [JSON.stringify(mockSuccessResp32), { status: 200 }]
    );

    const res = await request(app).post("/hotel-results").send(validBody);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("Missing static info returns 200 with default fields", async () => {
    const body = structuredClone(validBody);
    body.sort_exist = false;
    body.filter_exist = false;
    fetch.mockResponses(
      [JSON.stringify(mockSuccessResp31), { status: 200 }],
      [JSON.stringify([]), { status: 200 }]
    );

    const res = await request(app).post("/hotel-results").send(body);
    expect(res.statusCode).toBe(200);
    console.log(res)
    const hotel = res.body.data.find((h) => h.id === "z999");
    expect(hotel).toBeDefined();
    expect(hotel.rating).toBe(2.5);
    expect(hotel.score).toBe(70);
  });
});
