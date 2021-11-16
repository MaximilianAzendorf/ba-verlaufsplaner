import {Injectable, Logger} from "@nestjs/common";
import {PublicConfig} from "@vp/api-interfaces";

/**
 * This service pulls necessary configuration from environment variables and exposes them.
 */
@Injectable()
export class ConfigurationService
{
    /**
     * Logger.
     */
    private readonly _log = new Logger(ConfigurationService.name);

    /** Backing field. */
    private readonly _baseUrl: string;

    /** Backing field. */
    private readonly _dbUrl: string;

    /** Backing field. */
    private readonly _dbTokenKey: string;

    /** Backing field. */
    private readonly _ssoUrl: string;

    /**
     * Constructs a service instance and reads the respective environment variables.
     */
    public constructor()
    {
        this._baseUrl = process.env["BASE_URL"];
        this._dbUrl = process.env["COUCHDB_URL"];
        this._dbTokenKey = process.env["COUCHDB_TOKEN_KEY"];
        this._ssoUrl = process.env["SSO_URL"];

        this._validateConfig();
        this._log.log("Configuration is loaded and valid");
    }

    /**
     * Validates the configuration and terminates the server if something is wrong.
     */
    private _validateConfig(): void
    {
        if (!this.baseUrl)
        {
            this._log.error("No base URL given. Please specify the base URL via the BASE_URL environment variable.");
            process.exit(1001);
        }

        if (!this.dbUrl)
        {
            this._log.error("No CouchDB URL given. Please specify the URL of the CouchDB instance via the COUCHDB_URL environment variable.");
            process.exit(1002);
        }

        if (!this.dbTokenKey)
        {
            this._log.error("No key for CouchDB JWT Authentication given. Please specify a key via the COUCHDB_TOKEN_KEY environment variable.");
            process.exit(1003);
        }

        if (!this.ssoUrl)
        {
            this._log.error("No SSO url given. Please specify an SSO url via the SSO_URL environment variable.");
            process.exit(1004);
        }
    }

    /**
     * Returns the public configuration.
     */
    public get publicConfig(): PublicConfig
    {
        return {
            dbUrl: this.dbUrl,
            usersDb: this.dbUsersDbName,
            baseDb: this.dbBaseDbName,
        };
    }

    /**
     * Returns the base URL of the server. This is the URL that the user should visit when they want to use the app.
     */
    public get baseUrl(): string
    {
        return this._baseUrl;
    }

    /**
     * Returns the database URL. This is the URL of the CouchDB instance that should be used.
     */
    public get dbUrl(): string
    {
        return this._dbUrl;
    }

    /**
     * Returns the name of the users database. This is always _users.
     */
    public get dbUsersDbName(): string
    {
        return "_users";
    }

    /**
     * Returns the name of the base plan database.
     */
    public get dbBaseDbName(): string
    {
        return "base-plans";
    }

    /**
     * Returns the key that should be used to sign JWT access tokens. The CouchDB instance has to be configured to
     * accept JWT token signed with this key.
     */
    public get dbTokenKey(): string
    {
        return this._dbTokenKey
    }

    /**
     * Returns the SSO URl. This is the URL that should be used to make SSO login redirects.
     */
    public get ssoUrl(): string
    {
        return this._ssoUrl;
    }
}
