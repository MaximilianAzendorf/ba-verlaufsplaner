import {Doc} from "./db-docs";
import {Diff} from "@vp/utility";
import {PlanDoc} from "./plan";

/**
 * User data are either user plan documents or user settings documents.
 */
export type UserData = UserPlanDoc | UserSettingsDoc;

/**
 * An enumeration containing all valid user roles.
 */
export enum UserRoles
{
    /**
     * Users can access their own database and read base plans.
     */
    User = "user",

    /**
     * Maintainers can access their own databse and read and write base plans.
     */
    Maintainer = "maintainer",

    /**
     * Admins (the CouchDB system _admin role) can do everything.
     */
    Admin = "_admin"
}

/**
 * This interface models a user document from the _users database of CouchDB.
 */
export interface UserDoc extends Doc<"user">
{
    /**
     * The username of the user.
     */
    name: string;

    /**
     * The roles of the user. Because we use external JWT authentication for the CouchDB database, which roles are
     * contained here do not matter because user roles are determined by the JWT token anyways, so we leave that empty
     * here. CouchDB complains if we omit this field.
     */
    roles: [];

    /**
     * The type is always "user".
     */
    type: "user";
}

/**
 * A user plan doc contains the plan diff of a single plan.
 */
export interface UserPlanDoc extends Doc<"user-plan">
{
    /**
     * The diff between the base plan and the user-edited custom plan.
     */
    diff: Diff<PlanDoc>;
}

/**
 * The string literal used as the _id value of the user settings document.
 */
export const USER_SETTINGS_DOC_NAME: "user-settings" = "user-settings";

/**
 * The user settings document contains settings of the user, such as ignored plan problems.
 */
export interface UserSettingsDoc extends Doc<"user-settings">
{
    /**
     * The id of the settings document is always the same, so we narrow down the type.
     */
    _id: typeof USER_SETTINGS_DOC_NAME;

    /**
     * The problem IDs of the problems which the user has ignored/hidden.
     */
    ignoredProblems: string[];
}
