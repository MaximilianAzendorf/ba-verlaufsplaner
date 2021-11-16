export type SemesterTerm = "winter" | "summer";

/**
 * A semester name is the absolute name, consisting of a term (winter/summer) and a year, of a semester.
 */
export interface SemesterName
{
    /**
     * The term of the semester (winter/summer).
     */
    term : SemesterTerm;

    /**
     * The year of the semester. Winter terms start in the given year.
     */
    year: number;
}
