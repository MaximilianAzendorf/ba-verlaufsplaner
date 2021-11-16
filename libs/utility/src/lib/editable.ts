import {cloneDeep} from "lodash";
import {transfer} from "./diff-patch";

/**
 * This class acts as a wrapper around a given object. Alterations of this object through this wrapper are only
 * transfered to the original object after the apply method is called.
 */
export class Editable<T>
{
    /**
     * The original object
     */
    private readonly _original: T;

    /**
     * The "working" object that gets mutated.
     */
    private readonly _mutated: T;

    /**
     * Constructs a new editable wrapper containing the given original object.
     */
    public constructor(originalObject: T)
    {
        this._original = originalObject;
        this._mutated = cloneDeep(this._original);
    }

    /**
     * Returns the object which can be mutated.
     */
    public get object(): T
    {
        return this._mutated || {} as any;
    }

    /**
     * Returns the original object.
     */
    public get original(): T
    {
        return this._original;
    }

    /**
     * Transfers the changes made to the working object to the original object.
     */
    public apply(): boolean
    {
        return transfer(this._mutated, this._original);
    }

    /**
     * Resets the working object to the state of the original.
     */
    public reset(): boolean
    {
        return transfer(this._original, this._mutated);
    }
}
