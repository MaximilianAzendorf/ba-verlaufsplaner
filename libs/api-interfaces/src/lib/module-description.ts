import {SemesterName} from "./semester-name";
import {LocalizableString} from "./localizable-string";

/**
 * This interface represents a single module containing its relevant data (like the name or the ECTS credits it gives).
 */
export interface ModuleDescription
{
    /**
     * The full name of the module.
     */
    name: LocalizableString;

    /**
     * The short name (e.g. an abbreviation) of the module. Optional.
     */
    nameShort?: LocalizableString | undefined;

    /**
     * The number of ECTS credits this module is worth.
     */
    ects: number;

    /**
     * The number of weekly hours ("Semesterwochenstunden") for this module.
     */
    sws?: number;

    /**
     * The offset of this module. The offset is the number of semesters after the start semester of the plan this module
     * belongs to in which this module occurs in the plan.
     */
    offset: number;

    /**
     * The cycle of the module, meaning that this module is only offered every so many semesters.
     */
    cycle: number;

    /**
     * A list of all required modules that have to be done before this one.
     */
    requirements: {moduleId: string, required: boolean}[];

    /**
     * The minimum ECTS that have to be acquired before this module can be taken.
     */
    requiredEcts?: number;

    /**
     * This is present if the exam of the given module is passed.
     */
    passed?: true;

    /**
     * This array is used to track in which semesters this module was failed.
     */
    failedSemesters?: SemesterName[];

    /**
     * A string containing (short) extra information about this module. Optional.
     */
    extraInfo?: LocalizableString;

    /**
     * The index of the category that this module belongs to. Optional.
     */
    category: number;

    /**
     * If this is true, the module can be moved to a semester before the starting semester of its plan. This is useful
     * for e.g. master programs (Mastervorzugsfächer).
     */
    preponeAllowed?: boolean;

    /**
     * A sort key that is used to determine the order of modules in a list. Optional.
     */
    sortKey?: number;
}
