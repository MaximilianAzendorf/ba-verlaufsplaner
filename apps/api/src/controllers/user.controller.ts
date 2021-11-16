import {Controller, Get, Query, Req, Res} from "@nestjs/common";
import {ConfigurationService} from "../services/configuration.service";
import {DbTokenService} from "../services/db-token.service";
import {DbService} from "../services/db.service";
import {Request, Response} from "express";
import {SsoService} from "../services/sso.service";
import {urlJoin} from "@vp/utility";

/**
 * This controller handles user creation and authentication.
 */
@Controller("user")
export class UserController
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _db: DbService,
        private _config: ConfigurationService,
        private _dbToken: DbTokenService,
        private _sso: SsoService)
    {
    }

    /**
     * This endpoint handles authorization and redirects to the SSO system.
     */
    @Get("authorize")
    getAuthorize(@Req() req: Request, @Res() res: Response): void
    {
        this._sso.initiate(res, req.query["lang"] as string, urlJoin(this._config.baseUrl, "/api/user/authorizeResponse"));
    }

    /**
     * TODO: Remove
     */
    @Get("testSso")
    async getTestSSO(
        @Query("redirectUri") redirectUri: string, @Query("lang") lang: string): Promise<string>
    {
        return `
<script>
function au() { window.location.href = "${redirectUri}?username=" + document.getElementById("un").value + "&lang=${lang}"; }
</script>
Hier könnte IHR SSO-Login stehen!
<br><br>
Username: <input type="text" id="un" value="test"><br><br>
Passwort: <input type="password">
<br><br>
<a href="#" onclick="au()">Weiter</a>
        `;
    }

    /**
     * This endpoint handles SSO responses and is used as a SSO redirect URL.
     */
    @Get("authorizeResponse")
    async getAuthorizeResponse(@Res() res: Response, @Query("username") username: string, @Query("lang") lang: string): Promise<void>
    {
        return await this._sso.handleResponse(res, username, lang);
    }
}
