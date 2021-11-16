import {Injectable} from "@angular/core";
import {SemesterName} from "@vp/api-interfaces";
import {LocalizeFn} from "@angular/localize/init";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This service provides functionality for handling semester names (see {@link SemesterName}), like adding/substracting
 * offsets from semester names, converting them to strings or calculating differences between them.
 */
@Injectable({
    providedIn: "root"
})
export class SemesterNameService
{
    /**
     * Returns the given semester name offset by the given offset. For example, the winter term of 2021 offset by an
     * offset of 3 would become the summer term of 2023.
     */
    public offset(name: SemesterName, offset: number): SemesterName
    {
        let semesterIndex = name.year * 2 + (name.term == "winter" ? 1 : 0) + offset;

        return { term: semesterIndex % 2 == 0 ? "summer" : "winter", year: Math.floor(semesterIndex / 2) };
    }

    /**
     * Returns the given semester name in a human-readable string representation.
     *
     * @param name The semester name that should be converted.
     * @param offset You can specify an offset so that the given semester name is offset by that amount before being
     * converted to a string.
     */
    public format(name: SemesterName, offset: number = 0): string
    {
        if (offset != 0)
        {
            name = this.offset(name, offset);
        }

        let ss = $localize `SS`;
        let ws = $localize `WS`;

        let str = `${name.term == "summer" ? ss: ws} ${name.year}`;
        if (name.term == "winter")
        {
            str += `/${(name.year + 1) % 100}`;
        }

        return str;
    }

    /**
     * Returns the current semester, meaning the actual semester according to the current date.
     */
    public currentSemester(): SemesterName
    {
        let date = new Date();

        if (date.getMonth() < 4)
        {
            return { term: "winter", year: date.getFullYear() - 1 };
        }
        else
        {
            return { term: date.getMonth() < 10 ? "summer" : "winter", year: date.getFullYear() };
        }
    }

    /**
     * Returns true if the first given semester name is further in the past than the second one.
     */
    public lowerThan(a: SemesterName, b: SemesterName): boolean
    {
        return a.year < b.year || (a.year == b.year && a.term < b.term);
    }

    /**
     * Returns the offset between the first and the second given semester name, meaning that adding the resulting offset
     * to the first semester name would result in the second semester name.
     */
    public relativeOffset(a: SemesterName, b: SemesterName): number
    {
        let offset = (b.year - a.year) * 2;
        if (a.term == "summer") offset += 1;
        if (b.term == "summer") offset -= 1;
        return offset;
    }
}
