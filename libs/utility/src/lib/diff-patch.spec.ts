import {diff, patch} from "@vp/utility";

describe("Diff", () =>
{
    it("should work on equal simple objects", () =>
    {
        expect(diff(1, 1)).toEqual(null);
        expect(diff("abc", "abc")).toEqual(null);
        expect(diff(true, true)).toEqual(null);
        expect(diff([1, 2, 4], [1, 2, 4])).toEqual(null);
    });

    it("should work on unequal simple objects", () =>
    {
        expect(diff(1, 2)).toEqual(2);
        expect(diff("abc", "abd")).toEqual("abd");
        expect(diff(true, false)).toEqual(false);
        expect(diff([1, 2, 4], [1, 3, 4])).toEqual([1, 3, 4]);
    });

    it("should work on equal complex objects", () =>
    {
        expect(diff(
            {a: 1, b: "hello", c: [2, 3]},
            {a: 1, b: "hello", c: [2, 3]}))
            .toEqual(null);

        expect(diff(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"}))
            .toEqual(null);
    });

    it("should work on unequal, but structurally equal complex objects", () =>
    {
        expect(diff(
            {a: 1, b: "hello", c: [2, 3]},
            {a: 1, b: "abc", c: [3, 3]}))
            .toEqual(
                {b: "abc", c: [3, 3]});

        expect(diff(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {b: {c: "x", d: [3, 4]}, e: 4}, f: 5, g: "y"}))
            .toEqual(
                {a: {b: {c: "x"}}, g: "y"});
    });

    it("should work on unequal complex objects", () =>
    {
        expect(diff(
            {a: 1, b: "hello", c: [2, 3]},
            {a: 1, b: "hello", d: [2, 3]}))
            .toEqual(
                {"-c": {}, "+d": [2, 3]});

        expect(diff(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {e: 4}, h: {i: 1}, f: 5, g: "x"}))
            .toEqual(
                {a: {"-b": {}}, "+h": {i: 1}});

        expect(diff(
            {b: {x: 1}, c: {x: 1}, d: {x: 1}},
            {b: {x: 1, a: true}, c: {x: 1}, d: {x: 1}}))
            .toEqual(
                {b: {"+a": true}});
    });
});

describe("Patch", () =>
{
    it("should work with empty diffs", () =>
    {
        expect(patch(1, null)).toEqual(1);
        expect(patch("a", null)).toEqual("a");
        expect(patch(true, null)).toEqual(true);
        expect(patch([1, 2], null)).toEqual([1, 2]);
        expect(patch({a: 1, b: "x"}, null)).toEqual({a: 1, b: "x"});
    });

    it("should not return original list", () =>
    {
        let obj = [1, 2, 3];
        expect(patch(obj, null)).not.toBe(obj);
    });

    it("should not return original object", () =>
    {
        let obj = {a: 1};
        expect(patch(obj, null)).not.toBe(obj);
    });

    it("should work with simple objects and non-empty diffs", () =>
    {
        expect(patch(1, 2)).toEqual(2);
        expect(patch("a", "b")).toEqual("b");
        expect(patch(true, false)).toEqual(false);
        expect(patch([1, 2], [3, 4, 5])).toEqual([3, 4, 5]);
    });

    it("should work with complex objects and non-empty, but not structurally changing diffs", () =>
    {
        expect(patch(
            {a: 1, b: "hello", c: [2, 3]},
            {b: "abc", c: [3, 3]}))
            .toEqual(
                {a: 1, b: "abc", c: [3, 3]});

        expect(patch(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {b: {c: "x"}}, g: "y"}))
            .toEqual(
                {a: {b: {c: "x", d: [3, 4]}, e: 4}, f: 5, g: "y"});
    })

    it("should work with complex objects and non-empty diffs", () =>
    {
        expect(patch(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {"-b": {}}, "+h": {i: 1}}))
            .toEqual(
                {a: {e: 4}, h: {i: 1}, f: 5, g: "x"});

        expect(patch(
            {a: {b: {c: 2, d: [3, 4]}, e: 4}, f: 5, g: "x"},
            {a: {"-b": {}}, "+h": {i: 1}}))
            .toEqual(
                {a: {e: 4}, h: {i: 1}, f: 5, g: "x"});
    })
})
