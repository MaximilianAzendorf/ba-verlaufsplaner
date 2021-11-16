import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {PublicConfig} from "@vp/api-interfaces";
import {ErrorService} from "./error.service";
import {LocalizeFn} from "@angular/localize/init";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This service fetches the public configuration from the server and exposes it.
 */
@Injectable({
    providedIn: "root"
})
export class ConfigurationService
{
    /** Backing field. */
    private _config: PublicConfig;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _error: ErrorService,
        private _http: HttpClient)
    {
    }

    /**
     * Returns the public configuration.
     */
    public async getConfig(): Promise<PublicConfig>
    {
        if (!this._config)
        {
            try
            {
                this._config = await this._http.get<PublicConfig>("../api/config").toPromise();
            }
            catch (error)
            {
                this._error.report($localize `There is a problem with the server.`, error.message);
            }
        }

        return this._config;
    }
}
