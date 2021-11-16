import {Inject, Injectable, LOCALE_ID} from "@angular/core";
import {LocalizableString} from "@vp/api-interfaces";
import {every} from "lodash";

/**
 * This service provides functionality for selecting the respective localized strings from a LocalizableString object.
 */
@Injectable({
    providedIn: "root"
})
export class LocalizationService
{
    /**
     * The default locale that should be selected if there is no string matching the current locale in a localizable
     * string.
     */
    public static readonly DEFAULT_LOCALE = "en";

    /**
     * Constructor used for injection.
     */
    constructor(
        /** The current locale. */ @Inject(LOCALE_ID) public readonly locale: string)
    {
    }

    /**
     * Selects the appropriate localized string from the given localizable string.
     */
    public select(value: LocalizableString)
    {
        if (value == null) return null;
        return typeof value == "object"
            ? value[this.locale] || value[LocalizationService.DEFAULT_LOCALE]
            : value;
    }

    public isComplete(value: LocalizableString)
    {
        const whitespace = /^\s*$/;
        if (value == null) return false;

        if (typeof value == "string") return !value.match(whitespace);

        return every(Object.values(value), x => x != null && !x.match(whitespace));
    }
}
