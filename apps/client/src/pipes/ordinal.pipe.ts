import {Inject, LOCALE_ID, Pipe, PipeTransform} from "@angular/core";

/**
 * This pipe is used to transform a number to its ordinal form (e.g. 5 => "5." in German or 5 => "5th" in English).
 */
@Pipe({
    name: "ordinal"
})
export class OrdinalPipe implements PipeTransform
{
    private static readonly EN_ORDINALS = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];

    /**
     * Constructor used for injection
     */
    constructor(
        @Inject(LOCALE_ID) private _locale: string)
    {
    }

    /**
     * Transforms the given number to its ordinal form.
     */
    transform(value: number): string
    {
        if (this._locale == "de")
        {
            return `${value}.`;
        }
        else if (this._locale == "en")
        {
            let ordinalPostfix = value > 10 && value < 14 ? "th" : OrdinalPipe.EN_ORDINALS[value % 10];
            return `${value}<sup>${ordinalPostfix}</sup>`;
        }
        else
        {
            throw Error("Unsupported locale " + this._locale);
        }
    }
}
