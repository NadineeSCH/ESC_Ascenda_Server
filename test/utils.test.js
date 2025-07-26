// utils.test.js
const { poller } = require("../utils/utils");
const fetchMock = require("jest-fetch-mock");

// Enable fetch mocking
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

describe("poller function", () => {
  it("should resolve with data when completed is true", async () => {
    const mockResponse = { completed: true, data: "test data" };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await poller("http://test.url");
    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should poll until completed is true", async () => {
    const mockResponses = [
      { completed: false },
      { completed: false },
      { completed: true, data: "finally done" },
    ];

    mockResponses.forEach((response) => {
      fetchMock.mockResponseOnce(JSON.stringify(response));
    });

    const result = await poller("http://test.url");
    expect(result).toEqual(mockResponses[2]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("should reject on fetch error", async () => {
    fetchMock.mockReject(new Error("Network error"));

    await expect(poller("http://test.url")).rejects.toThrow("Network error");
  });

  it("should respect the poll interval", async () => {
    jest.useFakeTimers();
    const mockResponses = [
      { completed: false },
      { completed: true, data: "done" },
    ];

    // Mock sequential responses
    fetchMock.mockResponses(
      [JSON.stringify(mockResponses[0]), { status: 200 }],
      [JSON.stringify(mockResponses[1]), { status: 200 }]
    );

    const pollPromise = poller("http://test.url");

    // Fast-forward time and flush promises
    await jest.advanceTimersByTimeAsync(500); // First poll
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(500); // Second poll
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const result = await pollPromise;
    expect(result).toEqual(mockResponses[1]);

    jest.useRealTimers();
  });
});
