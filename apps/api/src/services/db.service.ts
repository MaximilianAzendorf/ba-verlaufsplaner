import {HttpService, Injectable, Logger} from "@nestjs/common";
import {ConfigurationService} from "./configuration.service";
import {SecurityObject, TEMPLATE_PLAN_PREFIX, UserRoles} from "@vp/api-interfaces";
import {DbTokenService} from "./db-token.service";
import {DB, urlJoin} from "@vp/utility";

// noinspection JSUnusedLocalSymbols
/**
 * This function is serialized and used as a validation function for the base plan database design document. It ensures
 * that only admins and maintainers can alter base plans.
 */
let _baseDbValidation = function(newDoc: any, oldDoc: any, userCtx: any, secObj: any)
{
    if (userCtx.roles.indexOf("maintainer") == -1 && userCtx.roles.indexOf("_admin") == -1)
    {
        throw {forbidden: "Not authorized to alter base plans."};
    }

    let templatePrefix = "$";
    if (newDoc._id.startsWith(templatePrefix) && userCtx.roles.indexOf("_admin") == -1)
    {
        throw {forbidden: "Not authorized to alter template plans."};
    }
}

/**
 * This services exposes a DB instance in form of a service and contains additional server-specific logic.
 */
@Injectable()
export class DbService extends DB
{
    /**
     * Logger.
     */
    private readonly _log = new Logger(DbService.name);

    /**
     * The token used for admin access.
     */
    private _adminToken: string;

    /**
     * A promise that is resolved as soon as the service is done initializing the database state.
     */
    public readonly ready: Promise<void>;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _http: HttpService,
        private _dbTokenService: DbTokenService,
        private _configService: ConfigurationService)
    {
        super(_configService.publicConfig);

        this.ready = this._init();
    }

    /**
     * Initializes the database.
     */
    private async _init(): Promise<void>
    {
        // We wait 1 second in case the database was started just now.
        await new Promise(resolve => setTimeout(resolve, 1000));

        this._adminToken = this._dbTokenService.create("vp-admin", [UserRoles.Admin]);
        this._log.log("Connecting to DB");
        await this.connectRemote(this._adminToken, {noUserDb: true});
        this._log.log("Checking DB integrity");
        await this._ensureSystemDbIntegrity();
        this._log.log("DB ready");
    }

    /**
     * Ensures that all databases are in a orderly state. Especially the base plan database is checked for its security
     * object and design document.
     */
    private async _ensureSystemDbIntegrity()
    {
        // Make sure all databases exist
        await this.users.info();
        await this.base.info();

        let baseDbValidationFnString = _baseDbValidation.toString();

        // We have to do this check in this ugly way because we can't use the TEMPLATE_PLAN_PREFIX variable directly
        // in the validation function.

        if (baseDbValidationFnString.match(/templatePrefix ?= ?"([^"]+)"/)[1] != TEMPLATE_PLAN_PREFIX)
        {
            throw Error("The checked template prefix does not match TEMPLATE_PLAN_PREFIX.");
        }

        let baseSecurityObj: SecurityObject = {
            _id: "_security",
            members: {
                names: [],
                roles: []
            },
            admins: {
                names: [],
                roles: [UserRoles.Admin]
            }
        };

        await this._http.put(urlJoin(this.base.name, "_security"), baseSecurityObj, {
            headers: { "Authorization": `Bearer ${this._adminToken}`}
        }).toPromise();

        await this._ensureDoc(this.base, {
            _id: "_design/_auth",
            doctype: "design",
            language: "javascript",
            validate_doc_update: baseDbValidationFnString
        }, true);

        await this._ensureDoc(this.base, {
            _id: "$empty",
            doctype: "plan",
            name: {
                "en": "Empty plan",
                "de": "Leerer Plan"
            },
            startTerms: [
                "winter",
                "summer"
            ],
            published: true,
            version: "0000",
            categories: [],
            modules: {},
            choices: {}
        }, true);
    }
}
