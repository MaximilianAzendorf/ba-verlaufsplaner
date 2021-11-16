import {urlJoin} from "@vp/utility";

describe("UrlJoin", () =>
{
    it("should work with single part", () =>
    {
        expect(urlJoin("api")).toEqual("api");
        expect(urlJoin("/api")).toEqual("/api");
        expect(urlJoin("api/")).toEqual("api/");
    });

    it("should work with multiple parts", () =>
    {
        expect(urlJoin("api", "x")).toEqual("api/x");
        expect(urlJoin("api", "/x")).toEqual("api/x");
        expect(urlJoin("api/", "x")).toEqual("api/x");
        expect(urlJoin("api/", "/x")).toEqual("api/x");
        expect(urlJoin("api/", "/y/", "/x")).toEqual("api/y/x");
        expect(urlJoin("api", "y", "x")).toEqual("api/y/x");
    });
});
