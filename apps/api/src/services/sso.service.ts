import {Injectable, Logger} from "@nestjs/common";
import {ConfigurationService} from "./configuration.service";
import {Response} from "express";
import {DbService} from "./db.service";
import {UserRoles} from "@vp/api-interfaces";
import {DbTokenService} from "./db-token.service";
import {dbUsername, urlJoin} from "@vp/utility";

/**
 * This service handles the SSO authentication flow.
 */
@Injectable()
export class SsoService
{
    /**
     * Logger.
     */
    private readonly _log = new Logger(SsoService.name);

    constructor(
        private _db: DbService,
        private _dbToken: DbTokenService,
        private _config: ConfigurationService)
    {
    }

    public initiate(response: Response, lang: string, responseUri: string): void
    {
        this._log.debug("Auth flow requested; redirecting to SSO");
        response.redirect(this._config.ssoUrl + `?redirectUri=${encodeURIComponent(responseUri)}&lang=${lang}`);
    }

    public async handleResponse(response: Response, username: string, lang: string): Promise<void>
    {
        await this._db.ready;
        try
        {
            await this._db.users.get(dbUsername(username));
        }
        catch (error)
        {
            if (error.status != 404) throw error;
            this._log.log(`Creating new user ${username}`);
            await this._db.createUser(username);
        }

        let roles = username.startsWith("m")
            ? [UserRoles.User, UserRoles.Maintainer]
            : [UserRoles.User];

        let token = this._dbToken.create(username, roles);
        this._log.log(`Authorized user ${username}`);
        response.redirect(urlJoin(this._config.baseUrl, `/${lang}/authorized?token=${token}`));
    }
}
