import {OrdinalPipe} from "./ordinal.pipe";

describe("OrdinalPipe", () =>
{
    it("create an instance", () =>
    {
        const pipe = new OrdinalPipe("en");
        expect(pipe).toBeTruthy();
    });

    it("should work in german", () =>
    {
        const pipe = new OrdinalPipe("de");
        expect(pipe.transform(1)).toMatch("1.");
        expect(pipe.transform(5)).toMatch("5.");
        expect(pipe.transform(396)).toMatch("396.");
    })

    it("should work in english", () =>
    {
        const pipe = new OrdinalPipe("en");
        expect(pipe.transform(1)).toMatch("1<sup>st</sup>");
        expect(pipe.transform(2)).toMatch("2<sup>nd</sup>");
        expect(pipe.transform(5)).toMatch("5<sup>th</sup>");
        expect(pipe.transform(13)).toMatch("13<sup>th</sup>");
        expect(pipe.transform(124)).toMatch("124<sup>th</sup>");
        expect(pipe.transform(396)).toMatch("396<sup>th</sup>");
    })
});
