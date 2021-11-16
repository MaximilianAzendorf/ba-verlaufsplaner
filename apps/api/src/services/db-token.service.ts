import {Injectable, Logger} from "@nestjs/common";
import {ConfigurationService} from "./configuration.service";
import * as jwt from "jsonwebtoken";
import {SignOptions} from "jsonwebtoken";
import {UserRoles} from "@vp/api-interfaces";

/**
 * This service exposes functionality to generate and sign JWT access keys.
 */
@Injectable()
export class DbTokenService
{
    /**
     * Logger.
     */
    private readonly _log = new Logger(DbTokenService.name);

    /**
     * Constructor used for injection.
     */
    constructor(
        private _config: ConfigurationService)
    {
    }

    /**
     * Creates a signed access token containing the given username and roles.
     */
    public create(username: string, roles: UserRoles[] = []): string
    {
        let dbName = DbTokenService._dbName(username);

        let payload = {
            "db": dbName,
            "_couchdb.roles": roles
        };
        let options: SignOptions = {
            subject: username,
            algorithm: "HS256",
            noTimestamp: true
        }

        this._log.debug(`Signing token for user ${username} with role(s) ${roles}`);
        return jwt.sign(payload, this._config.dbTokenKey, options);
    }

    /**
     * Returns the name of the user-specific database of the user with the given username.
     */
    private static _dbName(username: string): string
    {
        let hex = [];
        for (let i = 0; i < username.length; i++)
        {
            let newHex = username.charCodeAt(i).toString(16);
            hex.push(newHex);
        }

        return `userdb-${hex.join("")}`;
    }
}
