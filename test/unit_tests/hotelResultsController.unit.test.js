const hotelResultsService = require('../../service/hotelResultsService.js');

jest.mock('../../service/hotelResultsService');

const { getSearchResults } = require("../../controller/hotelResultsController.js");

const mockReq = (body) => { return {body} }; //returns {body: whatever was passing into the function}
// call like: req = mockReq(body) ==> req.body will return body object

// cannot do = () => {} for mockReturnThis. Arrow function binds the this where it was created so it usually becomes the this in the global scope,
// which is undefined. Regardless if an object inside the arrow function is the one calling the mockReturnThis
// whereas normal function binds the this to the object that is calling them
// in this case, when status does a mockReturnThis, the this is referred to the object
// in order to use () => {}, we dont refer to this at all and just return the object itself
const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const mockNext = () => { return jest.fn(); };


const validBody = {
  destination_id: 'RsBu',
  checkin: '2025-08-04',
  checkout: '2025-08-06',
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



describe("hotelResultsController test", () => {
    // date mock, freeze time to 01-08-2025
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-08-01T00:00:00Z'));
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('400 Bad Request', () => {

        test('returns 400 for empty body', async () => {
            
            const req = mockReq({});
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Empty JSON Body' }));
        });

        test('returns 400 for missing basic field (destination)', async () => {
            
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            delete invalidBody.destination_id;

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid or missing destination_id' }));
        });

        test('returns 400 for invalid type for basic field (rooms)', async () => {
            
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.rooms = [];
            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid or missing rooms'
            }));
        });

        test('returns 400 if filters is missing when filter_exist is true', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            delete invalidBody.filters; // simulate filters missing

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Missing or invalid filters'
            }));
        });

        test('returns 400 if filters is not an object when filter_exist is true', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.filters = 'not-an-object';

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Missing or invalid filters'
            }));
        });

        test('returns 400 for invalid field type within filters object', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.filters.minPrice = "cheap"; // should be number

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid type for filters.minPrice'
            }));
        });


        test('returns 400 if sort_var missing when sort_exist is true', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            delete invalidBody.sort_var;

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid sort parameters'
            }));
        });

        test('returns 400 if sort_var is of wrong type (sort_exist = true)', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            delete invalidBody.sort_var;

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();

            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid sort parameters'
            }));
        });


        test('returns 400 for invalid checkin date', async () => {
            
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.checkin = 'invalid-date';
            console.log(invalidBody);

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid checkin date' }));
        });

        test('returns 400 for invalid checkout date', async () => {
            
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.checkout = 'not-a-date';

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid checkout date' }));
        });

        test('returns 400 if checkout is before or same as checkin', async () => {
            
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.checkout = '2025-08-04';

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid checkout date' }));
        });

        test('returns 400 if checkin is less than 3 days from today', async () => {
            const invalidBody = JSON.parse(JSON.stringify(validBody));
            invalidBody.checkin = '2025-08-02';

            const req = mockReq(invalidBody);
            const res = mockRes();
            const next = mockNext();
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid checkin date' }));
        });
    });

    describe('200 OK', () => {
        test('returns 200 and data if request is valid', async () => {

            const req = mockReq(validBody);
            const res = mockRes();
            const next = mockNext();
            hotelResultsService.processSearchResults.mockResolvedValue({ data: ['mockHotel1', 'mockHotel2'] });
            await getSearchResults(req, res, next);
            console.log(req.body);

            expect(hotelResultsService.processSearchResults).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ reqParams: validBody, data: ['mockHotel1', 'mockHotel2'] });
        });

        test('returns 200 with empty array if service returns []', async () => {
            
            const req = mockReq(validBody);
            const res = mockRes();
            const next = mockNext();
            hotelResultsService.processSearchResults.mockResolvedValue({ data: [] });
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ reqParams: validBody, data: [] });
        });
    });

    describe('DTO Construction and Logic', () => {
        test('sets sort and filter to null if not provided', async () => {
            
            const newBody = Object.assign({}, validBody);
            newBody.sort_exist = false;
            newBody.filter_exist = false;
            
            const req = mockReq(newBody);
            const res = mockRes();
            const next = mockNext();
            hotelResultsService.processSearchResults.mockResolvedValue({ data: [] });
            await getSearchResults(req, res, next);
            
            expect(hotelResultsService.processSearchResults).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                null,
                null
            );
        });

        test('constructs DTOs and guests string correctly', async () => {
            const newBody = Object.assign({}, validBody);
            newBody.rooms = 2;
            newBody.guestsEachRoom = 1;
            
            const req = mockReq(newBody);
            const res = mockRes();
            const next = mockNext();
            hotelResultsService.processSearchResults.mockResolvedValue({ data: [] });
            await getSearchResults(req, res, next);

            expect(hotelResultsService.processSearchResults).toHaveBeenCalledWith(
                expect.objectContaining({ guests: '1|1' }),
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('500 Internal Server Error', () => {
        test('handles service error with 500 response', async () => {
            
            const req = mockReq(validBody);
            const res = mockRes();
            const next = mockNext();
            hotelResultsService.processSearchResults.mockRejectedValue(new Error('Service failed'));
            await getSearchResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch hotel results.' }));
        });
    });
});



