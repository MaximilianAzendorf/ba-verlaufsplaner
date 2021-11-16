import {EventEmitter, Injectable} from "@angular/core";
import {Doc, Plan, PlanDoc, PlanDocHeader, UserPlanDoc, UserSettingsDoc} from "@vp/api-interfaces";
import {SemesterNameService} from "./semester-name.service";
import {cloneDeep, isEqual} from "lodash";
import log from "loglevel";
import {ConfigurationService} from "./configuration.service";
import {AuthenticationService} from "./authentication.service";
import {ErrorService} from "./error.service";
import {DB, diff, patch} from "@vp/utility";
import {LocalizeFn} from "@angular/localize/init";

/**
 * Angular localize function.
 */
declare var $localize: LocalizeFn;

/**
 * This service provides the raw curriculum plan data of all plans. It is usually not used directly, but through the
 * PlanMetaService and ModuleAccessService services.
 */
@Injectable({
    providedIn: "root"
})
export class PlanProviderService
{
    /**
     * The DB instance used by the service.
     */
    private _db : DB;

    /**
     * Contains the cached base plan headers if they where already fetched.
     */
    private _basePlanHeaders: PlanDocHeader[] = null;

    /**
     * The base plan documents fetched from the database. Because we assume that they don't change, we can cache them
     * here.
     */
    private _basePlans: Map<string, PlanDoc> = new Map();

    /**
     * The user plan documents fetched from the database. Because we assume that they don't get mutated by something
     * other than this service, we can cache them here.
     */
    private _userPlanDocs: Map<string, UserPlanDoc> = new Map();

    /**
     * The working plan documents, resulting from applying user-specific diffs to the base plan documents.
     */
    private _workingPlans: Map<string, Plan> = new Map();

    /**
     * The user settings document.
     */
    private _userSettings: UserSettingsDoc;

    /**
     * The original user settings document.
     */
    private _originalUserSettings: UserSettingsDoc;

    /**
     * This is set to true when the provider is done initializing.
     */
    private _isReady = false;

    /**
     * This promise resolves when the service is done initializing the database access.
     */
    public ready: Promise<void>;

    /**
     * This is the resolver of the initial _ready promise.
     */
    private _waitForInitializationResolver: () => void;

    /**
     * This event is fired whenever the database changed for some other reason than user input.
     */
    public readonly dbChange: EventEmitter<void> = new EventEmitter();

    /**
     * Constructor used for injection
     */
    constructor(
        private _error: ErrorService,
        private _auth: AuthenticationService,
        private _config: ConfigurationService,
        private _semesterName : SemesterNameService)
    {
        this.ready = new Promise((resolve, _) => this._waitForInitializationResolver = resolve);
    }

    /**
     * Returns true when the provider is done initializing
     */
    public get isReady(): boolean
    {
        return this._isReady;
    }

    /**
     * Initializes the provider by connecting to the database and building the initial state.
     */
    public initialize(): void
    {
        if (!this._waitForInitializationResolver) throw Error("Plan provider already initialized.");

        this.ready = this.ready
            .then(() => this._init(this._auth.token))
            .then(() => { this._isReady = true });

        this._waitForInitializationResolver();
        this._waitForInitializationResolver = null;
    }

    /**
     * Creates DB connections and recalculates all custom plans based on the base plans and the respective diffs.
     */
    private async _init(token: string | null): Promise<void>
    {
        let config = await this._config.getConfig();
        this._db = new DB(config);
        this._db.changeListener.on("external", () =>
        {
            log.warn("External user database change; rebuilding working plans.");
            this._initPlans();
        });

        if (token)
        {
            log.info("Connected to remote database.");
            await this._checkDbError(this._db.connectRemote(token,  {listenToUserChanges: true}));
        }
        else
        {
            log.info("Connected to local database.");
            await this._checkDbError(this._db.connectLocal());
        }

        await this._initPlans();
    }

    /**
     * Awaits the given promise while catching any errors that arise from it. Errors are then reported to the error
     * service.
     */
    private async _checkDbError<T>(action: Promise<T>): Promise<T>
    {
        let res: T;
        try
        {
            res = await action;
        }
        catch (error)
        {
            let msg = $localize `There is a problem with the database.`;

            if (!this._auth.token)
            {
                msg += " " + $localize `Your browser may not support the local testing mode; you may have to log in or use a different browser.`;
            }

            this._error.report(msg, error.message);
        }
        return res;
    }

    /**
     * Puts the given doc into the given database and notes this operation.
     */
    private async _notePut<T extends Doc<any>>(doc: T, db: any)
    {
        let resp = await this._db.note(this._checkDbError(db.put(doc)));
        doc._rev = resp.rev;
    }

    /**
     * Recalculates all custom plans based on the base plans and the respective diffs. This is called at the
     * initialization step as well as on every external user database change.
     */
    private async _initPlans(): Promise<void>
    {
        this._userPlanDocs.clear();

        this._originalUserSettings = await this._checkDbError(this._db.userSettingsDoc());
        this._userSettings = cloneDeep(this._originalUserSettings);

        for (let userPlanDoc of await this._checkDbError(this._db.userPlanDocs()))
        {
            let id = userPlanDoc._id;
            this._userPlanDocs.set(id, userPlanDoc);
            await this._workingPlanFromDelta(id);
        }

        this.dbChange.emit();
    }

    private async _workingPlanFromDelta(id: string): Promise<void>
    {
        let userPlanDoc = this._userPlanDocs.get(id);
        let basePlan = await this._checkDbError(this.getBasePlan(id));
        this._workingPlans.set(id, patch(basePlan, userPlanDoc.diff))

        log.debug(`Working plan ${id} recreated`);
    }

    /**
     * Recalculates all diffs based on the base plans and the respective custom plans and pushes altered user plan
     * documents to the database.
     */
    private async _deltasFromPlans(): Promise<void>
    {
        await this.ready;

        for (let [id, userPlanDoc] of this._userPlanDocs)
        {
            if (this._workingPlans.has(id)) continue;

            log.debug(`Delete user plan doc ${userPlanDoc._id}.`);
            await this._db.note(this._checkDbError(this._db.own.remove(userPlanDoc._id, userPlanDoc._rev)));
            this._userPlanDocs.delete(id);
        }

        for (let [id, workingPlan] of this._workingPlans)
        {
            let userPlanDoc = this._userPlanDocs.get(id);
            let basePlan = await this._checkDbError(this.getBasePlan(id));

            let newDiff = diff(basePlan, workingPlan);

            if (userPlanDoc)
            {
                if (isEqual(userPlanDoc.diff, newDiff)) continue;
                userPlanDoc.diff = newDiff;
            }
            else
            {
                userPlanDoc = {
                    _id: id,
                    doctype: "user-plan",
                    diff: newDiff
                };
                this._userPlanDocs.set(id, userPlanDoc);
            }

            log.debug(`Push user plan doc ${userPlanDoc._id}.`);
            await this._notePut(userPlanDoc, this._db.own);
        }

        if (!isEqual(this._originalUserSettings, this._userSettings))
        {
            log.debug("Push user settings doc.");
            await this._notePut(this._userSettings, this._db.own);
            this._originalUserSettings = cloneDeep(this._userSettings);
        }
    }

    /**
     * Returns the base plan with the given ID and fetches it if needed.
     */
    public async getBasePlan(id: string): Promise<PlanDoc>
    {
        this._db.ensureConnected();
        let doc = this._basePlans.get(id);

        if (!doc)
        {
            doc = await this._checkDbError(this._db.base.get(id));
            this._basePlans.set(id, doc);
        }

        return doc;
    }

    /**
     * This method should be called whenever the plan was modified and will ensure that diffs are recalculated and the
     * modifications are pushed to the backend.
     */
    public async notifyChange(): Promise<void>
    {
        await this.ready;
        await this._deltasFromPlans();
    }

    /**
     * Returns the ignore list document from the database.
     */
    public get settingsDoc(): UserSettingsDoc
    {
        return this._userSettings;
    }

    public set settingsDoc(value: UserSettingsDoc)
    {
        this._userSettings = value;
    }

    /**
     * Resets the given plan to its default state.
     */
    public async reset(plan: Plan): Promise<void>
    {
        await this.ready;

        let planDoc = await this._checkDbError(this._db.own.get((plan as PlanDoc)._id)) as UserPlanDoc;
        planDoc.diff = null;
        await this._notePut(planDoc, this._db.own);
        await this._initPlans();
    }

    /**
     * Returns all (custom) plans currently loaded.
     */
    public get plans() : Map<string, Plan>
    {
        return this._workingPlans;
    }

    /**
     * Returns a map of all user plan documents, where the keys are their document ID.
     */
    public get userPlanDocs(): Map<string, UserPlanDoc>
    {
        return this._userPlanDocs;
    }

    /**
     * Returns all base plan headers.
     */
    public async getAllBasePlanHeaders(): Promise<PlanDocHeader[]>
    {
        await this.ready;
        let headers = this._basePlanHeaders;

        if (!headers)
        {
            headers = await this._db.basePlanDocHeaders();
            this._basePlanHeaders = headers;
        }

        return headers;
    }

    /**
     * Returns an array of all plan keys.
     */
    public get planKeys(): string[]
    {
        return Array.from(this._workingPlans.keys());
    }

    /**
     * Adds the given document as a base plan. Note that this only puts the document into the remote database. It does
     * not reload the base plans locally, so usually, a page reload is performed afterwards.
     */
    public async putBasePlan(plan: PlanDoc): Promise<void>
    {
        await this._db.base.put(plan);
    }

    /**
     * Removes the given base plan document. Note that this only deletes the document from the remote database. It does
     * not reload the base plans locally, so usually, a page reload is performed afterwards.
     */
    public async deleteBasePlan(plan: PlanDoc & {_rev: string}): Promise<void>
    {
        await this._db.base.remove(plan);
    }
}
