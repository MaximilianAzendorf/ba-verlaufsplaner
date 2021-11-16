import {LocalizableString, ModuleDescription, SemesterName, SemesterTerm} from "@vp/api-interfaces";
import {Doc} from "./db-docs";

/**
 * The prefix with which template plans (plans that only maintainers can see and use to create new base plans) start.
 * IMPORTANT: If this value must be changed, you also have to change the prefix in the validation function in the
 * backend DB service or else permissions are off.
 */
export const TEMPLATE_PLAN_PREFIX = "$";

/**
 * A PlanData instance contains a collection of modules together with a name.
 */
export interface PlanData
{
    /**
     * The name of the plan. This usually contains the name of the study program this plan belongs to as well as the
     * type of degree (Bachelor/Master).
     */
    name: LocalizableString;

    /**
     * An object containing all modules of this plan, where the key of a module should be a globally unique id for that
     * module.
     */
    modules: { [id: string] : ModuleDescription };
}

/**
 * A plan is a collection of modules together with necessary metadata, representing a (default) plan of a curriculum.
 */
export interface PlanDoc extends PlanData, Doc<"plan">
{
    /**
     * The version of this plan. This can be, for example, the year this plan was introduced/the year of the PO.
     */
    version: string;

    /**
     * The start semester of this plan. In a base plan, this describes the first semester that this program is offered.
     */
    startSemester?: SemesterName | undefined;

    /**
     * A list of all categories that occur in this plan, in the order they should be displayed in.
     */
    categories: LocalizableString[];

    /**
     * A list of terms in which this plan can start.
     */
    startTerms: SemesterTerm[];

    /**
     * If this property is present, this plan shall not be used for plans after the given date.
     */
    obsoleteAfter?: string;

    /**
     * This array contains a list of plan indexes to which this plan can be migrated to.
     */
    migratableTo?: string[];

    /**
     * The plan is only visible to normal users if this is set to true. Published plans cannot be deleted by
     * maintainers.
     */
    published: boolean;

    /**
     * A list of all sub-plans of this plan.
     */
    choices: {[choiceKey: string]: PlanChoice};
}

/**
 * This const tuple contains all field of the PlanDoc interface that should be contained in the fetched plan headers.
 */
const PLAN_HEADER_PROPERTIES_CONST =
    <const> ["_id", "_rev", "name", "startTerms", "version", "obsoleteAfter", "published", "migratableTo"];

/**
 * The plan header properties as an ordinary string array.
 */
export const PLAN_HEADER_PROPERTIES = <any>PLAN_HEADER_PROPERTIES_CONST as string[];

/**
 * Represents the header of a plan document, containing only relevant metadata, but not the module descriptions of the
 * plan itself.
 */
export type PlanDocHeader = Pick<PlanDoc, typeof PLAN_HEADER_PROPERTIES_CONST[number]>;

/**
 * A plan is a plan document without the specifics of a CouchDB document.
 */
export type Plan = Omit<PlanDoc, "_rev" | "doctype">;

/**
 * A plan choice is a collection of multiple module groups where only one should be chosen by the user.
 */
export interface PlanChoice
{
    /**
     * The name of the choice.
     */
    name: LocalizableString;

    /**
     * The different module collections from which the user should choose.
     */
    alternatives: {[alternativeKey: string]: PlanAlternative};
}

/**
 * A plan alternative is a single alternative of a plan choice that consists of its name, its modules and an optional
 * active flag.
 */
export interface PlanAlternative extends PlanData
{
    /**
     * This is set to true if this alternative is chosen.
     */
    active?: true;
}
