/**
 * A localizable string is either a plain string (in which case, no localization takes place) or an object containing
 * localized strings for various languages, where the language codes (e.g. "en") are the keys of the respective strings.
 */
export type LocalizableString = string | {"de"?: string, "en"?: string};
