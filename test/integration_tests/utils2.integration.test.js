const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

const { ascendaApiCaller } = require("../../utils/utils2.js");
const { mockPriceList, mockStaticInfoList } = require("../mocks/hotel3132ApiMocks.js");

const mockReqParams = {
    destination_id: 'dest123',
    checkin: '2025-09-01',
    checkout: '2025-09-05',
    lang: 'en',
    currency: 'SGD',
    guests: '2|2'
};

beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
});

describe("ascendaApiCaller integration test (with fetch mocking)", () => {
    // -------- FETCH (api_no = 2) --------

    it("fetch: success with valid JSON", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(mockStaticInfoList));

        const result = await ascendaApiCaller(2, mockReqParams);
        expect(result).toEqual(mockStaticInfoList);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fetch: 500 status code", async () => {
        fetchMock.mockResponseOnce("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error"
        });

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: HTTP 500: Internal Server Error");

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fetch: invalid JSON", async () => {
        fetchMock.mockResponseOnce("not-json");

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API");

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fetch: thrown error (network failure)", async () => {
        fetchMock.mockRejectOnce(new Error("Network failure"));

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: Network failure");

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // -------- POLLER (api_no = 1) --------

    it("poller: success on first attempt", async () => {
        jest.useFakeTimers();

        fetchMock.mockResponseOnce(JSON.stringify({
            completed: true,
            data: mockPriceList
        }));

        const promise = ascendaApiCaller(1, mockReqParams);

        await jest.advanceTimersByTimeAsync(500);
        const result = await promise;

        expect(result.data).toEqual(mockPriceList);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });

    it("poller: success after retry", async () => {
        jest.useFakeTimers();

        fetchMock.mockResponses(
            [JSON.stringify({ completed: false }), { status: 200 }],
            [JSON.stringify({ completed: true, data: mockPriceList }), { status: 200 }]
        );

        const promise = ascendaApiCaller(1, mockReqParams);

        await jest.advanceTimersByTimeAsync(500); // First poll
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(500); // Second poll
        expect(fetchMock).toHaveBeenCalledTimes(2);

        const result = await promise;
        expect(result.data).toEqual(mockPriceList);

        jest.useRealTimers();
    });

    it("poller: receives 500 error", async () => {
        jest.useFakeTimers();

        fetchMock.mockResponseOnce("Server Error", {
            status: 500,
            statusText: "Internal Server Error"
        });

        const pollPromise = ascendaApiCaller(1, mockReqParams);

        jest.advanceTimersByTimeAsync(500);

        await pollPromise.catch(err => {
            expect(err.message).toBe("Failed to fetch from external API: HTTP 500: Internal Server Error");
        });

    });


    it("poller: receives invalid JSON", async () => {
        jest.useFakeTimers();

        fetchMock.mockResponseOnce("not-json");

        const pollPromise = ascendaApiCaller(1, mockReqParams);
        jest.advanceTimersByTimeAsync(500);

        await pollPromise.catch(err => {
            expect(err.message).toBe("Failed to fetch from external API: invalid json response body at  reason: Unexpected token 'o', \"not-json\" is not valid JSON");
        });


        expect(fetchMock).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    it("poller: fetch throws error (network error)", async () => {
        jest.useFakeTimers();

        fetchMock.mockRejectOnce(new Error("Network error"));

        const pollPromise = ascendaApiCaller(1, mockReqParams);
        jest.advanceTimersByTimeAsync(500);

        await pollPromise.catch(err => {
            expect(err.message).toBe("Failed to fetch from external API: Network error");
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    it("poller: max attempts reached", async () => {

        fetchMock.mockResponse(JSON.stringify({ completed: false }));

        const pollPromise = ascendaApiCaller(1, mockReqParams);

        await pollPromise.catch(err => {
            expect(err.message).toBe("Failed to fetch from external API: Max attempts reached");
            expect(fetchMock).toHaveBeenCalledTimes(10);
        });

    }, 15000);

    // -------- GENERAL --------

    const invalidApiNos = [0, 3, -1, "1", null];
    test.each(invalidApiNos)("invalid api_no = %p → throws error", async (invalidValue) => {
        await expect(ascendaApiCaller(invalidValue, mockReqParams))
            .rejects.toThrow(`Unsupported api_no in ascendaApiCaller: ${invalidValue}`);
    });
});
