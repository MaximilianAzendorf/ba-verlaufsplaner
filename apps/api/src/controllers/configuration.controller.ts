import {Controller, Get} from "@nestjs/common";
import {ConfigurationService} from "../services/configuration.service";
import {PublicConfig} from "@vp/api-interfaces";

/**
 * This controller exposes the public configuration.
 */
@Controller("config")
export class ConfigurationController
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _config: ConfigurationService)
    {
    }

    /**
     * This endpoint returns the public configuration.
     */
    @Get()
    getConfig(): PublicConfig
    {
        return this._config.publicConfig;
    }
}
