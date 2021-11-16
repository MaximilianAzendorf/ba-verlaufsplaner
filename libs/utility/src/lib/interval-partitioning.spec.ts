import {partitionIntervals} from "@vp/utility";

describe("IntervalPartitioning", () =>
{
    it("should work with zero intervals", () =>
    {
        expect(partitionIntervals([])).toEqual([]);
    });

    it("should work with single interval", () =>
    {
        expect(partitionIntervals([[0, 1]])).toEqual([0]);
    });

    it("should work with non-overlapping intervals", () =>
    {
        expect(partitionIntervals([[0, 1], [7, 9], [2, 6]])).toEqual([0, 0, 0]);
    })

    it("should work with overlapping intervals",  () =>
    {
        expect(partitionIntervals([[0, 1], [1, 10], [2, 6], [8, 10], [7, 8]])).toEqual([0, 1, 0, 0, 2]);
    })
});
