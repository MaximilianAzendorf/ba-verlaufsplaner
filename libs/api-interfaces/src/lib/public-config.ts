/**
 * The public config is the collection of configuration values that are publicly accessible via the /config endpoint.
 */
export interface PublicConfig
{
    /**
     * The CouchDB base URL.
     */
    dbUrl: string;

    /**
     * The name of the users database. This is usually "_users".
     */
    usersDb: string;

    /**
     * THe name of the database containing the base plans.
     */
    baseDb: string;
}
