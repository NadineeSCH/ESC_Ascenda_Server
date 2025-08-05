const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

jest.mock("../../utils/utils.js", () => ({
    poller: jest.fn()
}))
const { poller } = require("../../utils/utils.js");

const { ascendaApiBuilder, ascendaApiCaller, safeAssign } = require("../../utils/utils2.js")

const mockReqParams = {
    var1 : 'bar',
    var2 : 'foo',
    var3 : 'foofoo'
}

describe("ascendaApiBuilder tests", () => {

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("Builds URL for api_no = 1", () => {
        const result = ascendaApiBuilder(1, mockReqParams);
        expect(result).toContain('/prices?');
        expect(result).toContain('var1=bar');
        expect(result).toContain('&var2=foo');
        expect(result).toContain('&var3=foofoo');
        expect(result).toContain('&landing_page=wl-acme-earn&product_type=earn');
    })

    test("Builds URL for api_no = 2", () => {
        const result = ascendaApiBuilder(2, mockReqParams);
        expect(result).not.toContain('/prices?');
        expect(result).toContain('var1=bar');
        expect(result).toContain('&var2=foo');
        expect(result).toContain('&var3=foofoo');
        expect(result).toContain('&landing_page=wl-acme-earn&product_type=earn');
    })
    
    const invalidApiNos = [0, 3, -1, '1', null]
    test.each(invalidApiNos)("throws error when api_no is not 1 or 2: %p", 
        (invalidValue) => {
            expect(() => ascendaApiBuilder(invalidValue, mockReqParams))
                .toThrow(`Unsupported api_no in ascendaApiBuilder: ${invalidValue}`);
        });

})

describe("ascendaApicCaller tests", () => {

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("calls poller and returns data for api_no === 1", async () => {
        poller.mockResolvedValue({ completed: true, data: "done" });

        const result = await ascendaApiCaller(1, mockReqParams);

        expect(poller).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ completed: true, data: "done" });
    });

    test("calls fetch and returns data for api_no === 2", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ data: "done" }));

        const result = await ascendaApiCaller(2, mockReqParams);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ data: "done" });
    });

    const invalidApiNos = [0, 3, -1, '1', null]
    test.each(invalidApiNos)("throws error when api_no is not 1 or 2: %p",
        async (invalidValue) => {
            await expect(ascendaApiCaller(invalidValue, mockReqParams))
                .rejects.toThrow(`Unsupported api_no in ascendaApiCaller: ${invalidValue}`); 
    });

    test("poller throws max attempts error", async () => {
        poller.mockRejectedValue(new Error("Max attempts reached"));

        await expect(ascendaApiCaller(1, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: Max attempts reached");
    })

    test("poller throws error because ascenda api returns with status 500", async () => {
        poller.mockRejectedValue(new Error("HTTP 500: Internal Server Error"));

        await expect(ascendaApiCaller(1, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: HTTP 500: Internal Server Error")
    })

    test("fetch returns http response with status 500 and valid json", async () => {
        fetch.mockResponseOnce(JSON.stringify({error: "oops"}), {status: 500, statusText: "Internal Server Error"});

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: HTTP 500: Internal Server Error");
    })

    // slightly redundant, kept it anyways
    test("fetch returns http response with status 500 and plain text", async () => {
        fetch.mockResponseOnce("Internal Server Error", {status: 500, statusText: "Internal Server Error"})

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API: HTTP 500: Internal Server Error");
    })

    test("fetch returns non-JSON response", async () => {
        fetch.mockResponseOnce("not json");

        await expect(ascendaApiCaller(2, mockReqParams))
            .rejects.toThrow("Failed to fetch from external API");
    })

})

describe("safeAssign", () => {
    test("returns null for undefined", () => {
        expect(safeAssign(undefined)).toBeNull();
    });

    test("returns null for null", () => {
        expect(safeAssign(null)).toBeNull();
    });

    test("returns null for empty string", () => {
        expect(safeAssign("")).toBeNull();
    });

    test("returns original value for 0", () => {
        expect(safeAssign(0)).toBe(0);
    });

    test("returns original value for false", () => {
        expect(safeAssign(false)).toBe(false);
    });

    test("returns original value for non-empty string", () => {
        expect(safeAssign("hello")).toBe("hello");
    });

    test("returns original value for object", () => {
        const obj = { a: 1 };
        expect(safeAssign(obj)).toBe(obj);
    });

    test("returns original value for array", () => {
        const arr = [1, 2, 3];
        expect(safeAssign(arr)).toBe(arr);
    });
});