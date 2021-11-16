import {UserRoles} from "./user-data";

/**
 * This is the base interface for all CouchDB document interfaces.
 */
export interface Doc<doctype extends string>
{
    /**
     * The CouchDB ID.
     */
    _id: string;

    /**
     * The CouchDB revision.
     */
    _rev?: string;

    /**
     * The doctype of the document. This should always be the same string for similar objects.
     */
    doctype: doctype;
}

/**
 * The security object of a CouchDB database.
 */
export interface SecurityObject
{
    /**
     * The "ID" of the security object. This is actually just the name for the endpoint so we can push it into the
     * database the same way we can push other documents.
     */
    _id: "_security";

    /**
     * Members of a database can read and write ordinary documents.
     */
    members: {names: string[], roles: UserRoles[]};

    /**
     * Admins of a database can do everything members can in addition to being able to change design docs and security
     * objects.
     */
    admins: {names: string[], roles: UserRoles[]};
}

/**
 * A design document of a CouchDB database.
 */
export interface DesignDoc extends Doc<"design">
{
    /**
     * The language is always javascript.
     */
    language: "javascript";

    /**
     * The stringified validation function.
     */
    validate_doc_update: string;
}
