// noinspection JSUnfilteredForInLoop

import {cloneDeep, isEmpty, isEqual} from "lodash";

/**
 * A diff is the difference between two objects. A diff from A to B can be applied to A to receive B.
 */
export type Diff<T> = null | number | boolean | string | any[] | {[key in keyof T]?: Diff<T[key]>} | {[key: string]: any};

/**
 * Computes the diff from the first to the second object given. Note that this diff implementation has some
 * application-specific limitations:
 *
 *     - Properties with a value of null or undefined are not handled properly
 *     - Only object consisting of primitive types, arrays or other such objects can be handled.
 *     - It is assumed that all property keys are valid TS identifiers. The especially must not contain special
 *       characters such as + or -.
 */
export function diff<T>(from: T, to: T): Diff<T>
{
    if (typeof from !== "object" || Array.isArray(from)
        || typeof to !== "object" || Array.isArray(to))
    {
        return isEqual(from, to) ? null : cloneDeep(to);
    }

    let result: Diff<T> = {};

    for (let key in to)
    {
        if (to[key] == undefined) continue;

        if (key in from)
        {
            let subDiff = diff(from[key], to[key]);
            if (subDiff != null)
            {
                result[key] = subDiff as any;
            }
        }
        else
        {
            result["+" + key] = cloneDeep(to[key]);
        }
    }

    for (let key in from)
    {
        if (key in to) continue;

        result["-" + key] = {};
    }

    return isEmpty(result) ? null : result;
}

/**
 * Patches the given object using the given diff inplace, mutating the object.
 */
export function patchInplace<Result>(obj: Result, diff: Diff<Result>): boolean
{
    if (diff == null) return true;
    if (typeof obj !== "object" || Array.isArray(obj)) return false;
    if (typeof diff !== "object" || Array.isArray(diff)) return false;

    for (let key in diff)
    {
        let add = key.startsWith("+");
        let rem = key.startsWith("-");
        if (add || rem) key = key.slice(1) as any;

        if (key in obj)
        {
            if (rem)
            {
                delete obj[key];
            }
            else
            {
                if (!patchInplace(obj[key], diff[key]))
                {
                    obj[key] = diff[key] as any;
                }
            }
        }
        else if (add)
        {
            obj[key] = cloneDeep(diff["+" + key]);
        }
    }
    return true;
}

/**
 * Patches the given object with the given diff and returns the result. The original object is not altered.
 */
export function patch<Result>(from: Result, diff: Diff<Result>): Result
{
    let obj = {_root: cloneDeep(from)};
    patchInplace(obj, {_root: diff});

    return obj._root;
}

/**
 * Mutates the second object such that it becomes structurally equal to the first one. Returns true if the second object
 * got mutated or false if the two objects are already structurally equal.
 */
export function transfer<Result>(from: Result, to: Result): boolean
{
    let transferDiff = diff(to, from);
    if (transferDiff)
    {
        patchInplace(to, transferDiff);
        return true;
    }
    else
    {
        return false;
    }
}
