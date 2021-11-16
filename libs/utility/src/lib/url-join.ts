/**
 * This function takes a list of URL parts and combines them to one valid URL, automatically correcting leading or
 * trailing slashes.
 */
export function urlJoin(...parts: string[]): string
{
    for (let i = 0; i < parts.length; i++)
    {
        if (parts[i].startsWith("/") && i != 0)
        {
            parts[i] = parts[i].slice(1);
        }
        if (!parts[i].endsWith("/") && i != parts.length - 1)
        {
            parts[i] += "/";
        }
    }

    return parts.join("");
}
