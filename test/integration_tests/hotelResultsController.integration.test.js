const fetch = require('jest-fetch-mock');
fetch.enableMocks();
const { getSearchResults } = require('../../controller/hotelResultsController');
const mockApis = require('../mocks/hotel3132ApiMocks');
const mockSuccessResp31 = mockApis.mockPriceList;
const mockSuccessResp32 = mockApis.mockStaticInfoList;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();
const mockReq = (body) => ({ body });


const validBody = {
  destination_id: 'RsBu',
  checkin: '2025-08-05',
  checkout: '2025-08-09',
  lang: 'en_US',
  currency: 'SGD',
  guestsEachRoom: 2,
  rooms: 1,
  sort_exist: true,
  sort_var: 'price',
  reverse: 0,
  filter_exist: true,
  filters: {
    minPrice: 100.0,
    maxPrice: 4000.0,
    minRating: 3.5,
    maxRating: 5.0,
    minScore: 60.0,
    maxScore: null
  }
};

const wrongTypes = {
  string: [],
  number: [],
  boolean: [],
};

const fieldTypes = {
  destination_id: 'string',
  checkin: 'string',
  checkout: 'string',
  lang: 'string',
  currency: 'string',
  guestsEachRoom: ['string', 'number'],
  rooms: ['string', 'number'],
  sort_exist: 'boolean',
  filter_exist: 'boolean',
};

beforeEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
})


describe("Basic Validation", () => {

  test.each([
    ['destination_id', 'undefined'],
    ['destination_id', 'null'],
    ['destination_id', 'wrongType'],
    ['checkin', 'undefined'],
    ['checkin', 'null'],
    ['checkin', 'wrongType'],
    ['checkout', 'undefined'],
    ['checkout', 'null'],
    ['checkout', 'wrongType'],
    ['lang', 'undefined'],
    ['lang', 'null'],
    ['lang', 'wrongType'],
    ['currency', 'undefined'],
    ['currency', 'null'],
    ['currency', 'wrongType'],
    ['guestsEachRoom', 'undefined'],
    ['guestsEachRoom', 'null'],
    ['guestsEachRoom', 'wrongType'],
    ['rooms', 'undefined'],
    ['rooms', 'null'],
    ['rooms', 'wrongType'],
    ['sort_exist', 'undefined'],
    ['sort_exist', 'null'],
    ['sort_exist', 'wrongType'],
    ['filter_exist', 'undefined'],
    ['filter_exist', 'null'],
    ['filter_exist', 'wrongType'],

  ])("returns 400 when %s is %s", async (field, caseType) => {
    const reqBody = JSON.parse(JSON.stringify(validBody));

    if (caseType === 'undefined') {
      delete reqBody[field];
    } else if (caseType === 'null') {
      reqBody[field] = null;
    } else if (caseType === 'wrongType') {
      const expectedType = fieldTypes[field];
      if (Array.isArray(expectedType)) {
        reqBody[field] = []; // default wrong type
      } else {
        reqBody[field] = wrongTypes[expectedType] ?? [];
      }
    }

    const req = mockReq(reqBody);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});



describe("Date Logic", () => {

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  })

  test("checkin is invalid format", async () => {

    const body = JSON.parse(JSON.stringify(validBody));
    body.checkin = "abc";
    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("checkout is invalid format", async () => {
    const body = JSON.parse(JSON.stringify(validBody));
    body.checkout = "xyz";
    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("checkin is < 3 days from today", async () => {
    const body = JSON.parse(JSON.stringify(validBody));
    body.checkin = "2025-08-02";  // Assume fake date is frozen to 2025-08-01
    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("checkout <= checkin", async () => {
    const body = JSON.parse(JSON.stringify(validBody));
    body.checkout = "2025-08-04";  // same as checkin
    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});

describe("Sort Validation", () => {
  test.each([
    ["sort_var is undefined", (b) => delete b.sort_var],
    ["sort_var is null", (b) => b.sort_var = null],
    ["sort_var is wrong type", (b) => b.sort_var = []],
    ["sort_var is unsupported value", (b) => b.sort_var = 'stars'],
    ["reverse is wrong type", (b) => b.reverse = []],
  ])("%s", async (desc, mutateBody) => {
    const body = JSON.parse(JSON.stringify(validBody));
    mutateBody(body);

    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Filter Validation", () => {
  test.each([
    ["filters is undefined", (b) => delete b.filters],
    ["filters is null", (b) => b.filters = null],
    ["filters is wrong type", (b) => b.filters = "not-an-object"],
    ["minPrice is undefined", (b) => delete b.filters.minPrice],
    ["minPrice is wrong type", (b) => b.filters.minPrice = "cheap"],
    ["maxPrice is undefined", (b) => delete b.filters.maxPrice],
    ["maxPrice is wrong type", (b) => b.filters.maxPrice = []],
    ["minRating is undefined", (b) => delete b.filters.minRating],
    ["minRating is wrong type", (b) => b.filters.minRating = {}],
    ["maxRating is undefined", (b) => delete b.filters.maxRating],
    ["maxRating is wrong type", (b) => b.filters.maxRating = "high"],
    ["minScore is undefined", (b) => delete b.filters.minScore],
    ["minScore is wrong type", (b) => b.filters.minScore = []],
    ["maxScore is undefined", (b) => delete b.filters.maxScore],
    ["maxScore is wrong type", (b) => b.filters.maxScore = false],
  ])("%s", async (_, mutateBody) => {
    const body = JSON.parse(JSON.stringify(validBody));
    mutateBody(body);

    const req = mockReq(body);
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});


describe('Valid Input', () => {

  describe('Basic (All Inputs Valid)', () => {
    beforeEach(() => {
      fetch.resetMocks();
      fetch.mockResponses(
        [JSON.stringify(mockSuccessResp31), { status: 200 }],
        [JSON.stringify(mockSuccessResp32), { status: 200 }]
      );
    });

    test('All required fields present', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));

      const body = JSON.parse(JSON.stringify(validBody));
      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
      await promise;

      //console.log(JSON.stringify(res.json.mock.calls[0][0], null, 2));
      expect(res.status).toHaveBeenCalledWith(200);

      jest.useRealTimers();
    });
  });

  describe('Filters Only', () => {

    beforeEach(() => {
      fetch.resetMocks();
      fetch.mockResponses(
        [JSON.stringify(mockSuccessResp31), { status: 200 }],
        [JSON.stringify(mockSuccessResp32), { status: 200 }]
      );
    });

    test('Filter: price', async () => {
      jest.useFakeTimers(); // use fake timers
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));

      const body = JSON.parse(JSON.stringify(validBody));
      body.filters = {
        minPrice: 100,
        maxPrice: 200,
        minRating: null,
        maxRating: null,
        minScore: null,
        maxScore: null
      };
      body.filter_exist = true;
      body.sort_exist = false;

      const req = mockReq(body);
      const res = mockRes();
      const next = mockNext();

      const promise = getSearchResults(req, res, next);

      // fast-forward timers to let poller resolve
      jest.advanceTimersByTime(500);

      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["cCrl", "b7Dw", "op45"]);

      jest.useRealTimers(); // clean up
    });

    test('Filter: rating', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.filters = {
        minPrice: null,
        maxPrice: null,
        minRating: 1,
        maxRating: 4,
        minScore: null,
        maxScore: null
      };
      body.filter_exist = true;
      body.sort_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["cCrl", "op45", "z999", "nullStaticInfo"]);
    });

    test('Filter: score', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.filters = {
        minPrice: null,
        maxPrice: null,
        minRating: null,
        maxRating: null,
        minScore: 75,
        maxScore: 90
      };
      body.filter_exist = true;
      body.sort_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["b7Dw", "op45"]);
    });

    test('Filter: all', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.filters = {
        minPrice: 100,
        maxPrice: 200,
        minRating: 1,
        maxRating: 4,
        minScore: 75,
        maxScore: 90
      };
      body.filter_exist = true;
      body.sort_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["op45"]);
    });
  });

  describe('Sort Only', () => {

    beforeEach(() => {
      fetch.resetMocks();
      fetch.mockResponses(
        [JSON.stringify(mockSuccessResp31), { status: 200 }],
        [JSON.stringify(mockSuccessResp32), { status: 200 }]
      );
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('Sort: price_asc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.filter_exist = false;
      body.sort_var = 'price';
      body.reverse = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      console.log(resultIds);
      expect(resultIds).toEqual(["nullStaticInfo", "op45", "b7Dw", "cCrl", "z999"]);
    });

    test('Sort: price_desc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'price';
      body.reverse = true;
      body.filter_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["z999", "cCrl", "b7Dw", "op45", "nullStaticInfo"]);
    });

    test('Sort: rating_asc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'rating';
      body.reverse = false;
      body.filter_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["b7Dw", "op45", "z999", "nullStaticInfo", "cCrl"]);
    });

    test('Sort: rating_desc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'rating';
      body.reverse = true;
      body.filter_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["cCrl", "op45", "z999", "nullStaticInfo", "b7Dw"]);
    });

    test('Sort: score_asc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'score';
      body.reverse = false;
      body.filter_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["cCrl", "z999", "nullStaticInfo", "b7Dw", "op45"]);
    });

    test('Sort: score_desc', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'score';
      body.reverse = true;
      body.filter_exist = false;

      const req = mockReq(body);
      const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;

      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["op45", "b7Dw", "cCrl", "z999", "nullStaticInfo"]);
    });
  });

  describe('Filters + Sort', () => {
    beforeEach(() => {
      fetch.resetMocks();
      fetch.mockResponses(
        [JSON.stringify(mockSuccessResp31), { status: 200 }],
        [JSON.stringify(mockSuccessResp32), { status: 200 }]
      );
    jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('All filters + sort by price', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'price';
      body.reverse = false;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();

      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["op45", "b7Dw"]);
    });

    test('All filters + sort by price_rev', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'price';
      body.reverse = true;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();
      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["b7Dw", "op45"]);
    });

    test('All filters + sort by score', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'score';
      body.reverse = false;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();
      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["b7Dw", "op45"]);
    });

    test('All filters + sort by score_rev', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'score';
      body.reverse = true;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();
      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["op45", "b7Dw"]);
    });

    test('All filters + sort by rating', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'rating';
      body.reverse = false;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();
      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["b7Dw", "op45"]);
    });

    test('All filters + sort by rating_rev', async () => {
      const body = JSON.parse(JSON.stringify(validBody));
      body.sort_var = 'rating';
      body.reverse = true;
      body.filters = {
                minPrice: 100,
                maxPrice: 400,
                minRating: 0,
                maxRating: 2.5,
                minScore: 80,
                maxScore: 100
            }

      const req = mockReq(body); const res = mockRes(); const next = mockNext();
      const promise = getSearchResults(req, res, next);
      jest.advanceTimersByTime(500);
      await promise;
      
      const resultIds = res.json.mock.calls[0][0].data.map(h => h.id);
      expect(resultIds).toEqual(["op45", "b7Dw"]);
    });
  });
});

describe("Third Party API Errors", () => {
  beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

  test("fetch fails", async () => {
    fetch.mockRejectedValueOnce(new Error("fetch failed"));

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

  test("poller max attempts", async () => {
    jest.useRealTimers(); // crucial: ensure real timers are used
    
    const body = JSON.parse(JSON.stringify(validBody));
    const now = new Date();

    const newCheckinDate = new Date(now);
    newCheckinDate.setDate(now.getDate() + 4);
    const newCheckin = newCheckinDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const newCheckoutDate = new Date(now);
    newCheckoutDate.setDate(now.getDate() + 6);
    const newCheckout = newCheckoutDate.toISOString().split('T')[0];

    body.checkin = newCheckin;
    body.checkout = newCheckout;

    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ completed: false, hotels: [] }) // will never complete
      })
    );

    const req = mockReq(JSON.parse(JSON.stringify(body)));
    const res = mockRes();
    const next = mockNext();

    await getSearchResults(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Failed to fetch hotel results."
    }));
  }, 10000);

  test("price API returns invalid JSON", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error("invalid JSON") }
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

  test("price list not array", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: true, hotels: { hotel_id: "not-an-array" } })
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => (mockSuccessResp32)
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

  test("price list is null", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: true, hotels: null })
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => (mockSuccessResp32)
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });


  test("static info API returns invalid JSON", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: true, hotels: mockSuccessResp31 })
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error("invalid JSON") }
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

  test("static info list is null", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: true, hotels: mockSuccessResp31 })
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ('null')
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

  test("static info list not array", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: true, hotels: mockSuccessResp31 })
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ('not-an-array')
    });

    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes();
    const next = mockNext();

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Failed to fetch hotel results." }));
  });

});

describe("Third Party API edge cases", () => {
  beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

  test("static info list is empty", async () => {
    const body = JSON.parse(JSON.stringify(validBody))
    body.sort_exist = false;
    body.filter_exist = false;

    const req = mockReq(body);
    const res = mockRes(); const next = mockNext();

    fetch.mockResponses(
      [JSON.stringify(mockSuccessResp31), { status: 200 }],
      [JSON.stringify([], { status: 200 })] // empty static info list
    );

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;

    expect(res.status).toHaveBeenCalledWith(200);
    console.log(res.json.mock.calls[0][0]);
    const hotels = res.json.mock.calls[0][0].data;

    expect(hotels.length).toBe(mockApis.mockPriceList.hotels.length - 1); // one is nullPrice
    for (const hotel of hotels) {
      expect(hotel).toHaveProperty("id");
      expect(hotel).toHaveProperty("price");
      expect(hotel).toHaveProperty("rating", 2.5);
      expect(hotel).toHaveProperty("score", 70);

      expect(hotel.name).toBeNull();
      expect(hotel.latitude).toBeNull();
      expect(hotel.longitude).toBeNull();
      expect(hotel.description).toBeNull();
      expect(hotel.address).toBeNull();
      expect(hotel.distance).toBeNull();
      expect(hotel.checkinTime).toBeNull();
      expect(hotel.imageUrl).toBeNull();
    }
  });

  test("price list is empty", async () => {
    const req = mockReq(JSON.parse(JSON.stringify(validBody)));
    const res = mockRes(); const next = mockNext();

    fetch.mockResponses(
      [JSON.stringify({ completed: true, hotels: [] }), { status: 200 }],
      [JSON.stringify(mockApis.mockStaticInfoList), { status: 200 }]
    );

    const promise = getSearchResults(req, res, next);
    jest.advanceTimersByTime(500); // adjust if your poller uses longer delays
    await promise;

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({reqParams: validBody, data: [] });
  });
});
