import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import Fetch from "pouchdb-core";
import {USER_SETTINGS_DOC_NAME, UserData, UserDoc, UserPlanDoc, UserSettingsDoc} from "@vp/api-interfaces";
import {PLAN_HEADER_PROPERTIES, PlanDoc, PlanDocHeader} from "@vp/api-interfaces";
import {PublicConfig} from "@vp/api-interfaces";
import {decode, JwtPayload} from "jsonwebtoken";
import {urlJoin} from "./url-join";
import {Doc} from "@vp/api-interfaces";
import {DesignDoc} from "@vp/api-interfaces";
import EventEmitter from "events";
import {cloneDeep, isMatch} from "lodash";

/**
 * This is a helper function that constructs the id of a user document with the given username.
 */
export function dbUsername(plainUnsername: string)
{
    return `org.couchdb.user:${plainUnsername}`;
}

/**
 * This class provides all functionality needed to interact with the database.
 */
export class DB
{
    /** Backing field. */
    private _connected = false;

    /** Backing field. */
    private _dbUsers: PouchDB.Database<UserDoc>

    /** Backing field. */
    private _dbBase: PouchDB.Database<PlanDoc>;

    /** Backing field. */
    private _dbOwn: PouchDB.Database<UserData>;

    /**
     * This set stores all revision IDs that got created during the current ongoing transactions.
     */
    private readonly _generatedRevs: Set<string> = new Set();

    /**
     * This list stores all revs that got reported as a change while some transaction where in progress.
     */
    private readonly _pendingRevs: string[] = [];

    /**
     * This is the number of transactions that are currently in progress.
     */
    private _transactionsInProgress = 0;

    /**
     * This event emitter is triggered when a change of the user database is detected.
     */
    public readonly changeListener: EventEmitter = new EventEmitter();

    /**
     * Constructs a new DB instance based on the given configuration
     */
    constructor(private _config: PublicConfig)
    {
        PouchDB.plugin(PouchDBFind);
        this._dbBase = new PouchDB(urlJoin(_config.dbUrl, _config.baseDb));
    }

    /**
     * Returns the users database object. In case of remote connection, this is connected to the _users database of the
     * CouchDB instance.
     */
    public get users(): PouchDB.Database<UserDoc>
    {
        return this._dbUsers;
    }

    /**
     * Returns the base plan database object. This is the database where all base plan documents are stored.
     */
    public get base(): PouchDB.Database<PlanDoc>
    {
        return this._dbBase;
    }

    /**
     * Returns the user-specific database object. This contains user plan documents as well as the user settings.
     */
    public get own(): PouchDB.Database<UserData>
    {
        return this._dbOwn;
    }

    /**
     * Connects to a remote CouchDB instance, using the given token as authentication token. If noUserDb is set to true,
     * no user-specific database connection is made.
     */
    public async connectRemote(
        token: string,
        connectOptions?: {
            noUserDb?: boolean,
            listenToUserChanges?: boolean})
        : Promise<void>
    {
        let jwtToken = decode(token) as JwtPayload;

        let options = {
            fetch: this._createFetchTokenInterceptor(token)
        };

        this._dbBase = new PouchDB(urlJoin(this._config.dbUrl, this._config.baseDb), options);
        this._dbUsers = new PouchDB(urlJoin(this._config.dbUrl, this._config.usersDb), options);
        this._dbOwn = connectOptions?.noUserDb
            ? undefined
            : new PouchDB(urlJoin(this._config.dbUrl, jwtToken.db), options);

        if (!connectOptions?.noUserDb && connectOptions?.listenToUserChanges)
        {
            this._dbOwn.changes({since: "now", live: true})
                .on("change", change => this._handleUserDbChangeEvent(change));
        }

        if (!connectOptions?.noUserDb)
        {
            await this._ensureDbIntegrity();
        }
        this._connected = true;
    }

    /**
     * Connects to local PouchDB-based databases.
     */
    public async connectLocal(): Promise<void>
    {
        this._dbUsers = new PouchDB("$vp_users")
        this._dbOwn = new PouchDB("vp-user");

        await this._dbUsers.info();

        if ((await this._dbUsers.info()).doc_count == 0)
        {
            /* eslint-disable camelcase */
            await this._dbUsers.put({
                _id: "org.couchdb.user:vp-user",
                doctype: "user",
                derived_key: "",
                name: "vp-user",
                roles: [],
                password_sha: "",
                password_scheme: "simple",
                salt: "",
                type: "user"
            });
            /* eslint-enable camelcase */
        }

        await this._ensureDbIntegrity();
        this._connected = true;
    }

    /**
     * Disconnects this instance.
     */
    public disconnect(): void
    {
        this.ensureConnected();

        this._dbUsers.close();
        this._dbBase.close();
        this._dbOwn.close();

        this._dbUsers = this._dbBase = this._dbOwn = undefined;

        this._connected = false;
    }

    /**
     * This ensures that this instance is connected and throws an error if it is not.
     */
    public ensureConnected()
    {
        if (!this._connected)
        {
            throw Error("This DB instance is not connected.");
        }
    }

    /**
     * This makes the DB instance aware of an ongoing transaction represented by the given promise. Intercepts the
     * CouchDB Response of the given promise and adds it to the transaction-generated revs, thus preventing the change
     * made by this transaction to be reported as an external transaction.
     */
    public async note<T>(action: Promise<PouchDB.Core.Response>): Promise<PouchDB.Core.Response>
    {
        this._transactionsInProgress++;
        try
        {
            let response = await action;
            this._generatedRevs.add(response.rev);
            return response;
        }
        finally
        {
            this._transactionsInProgress--;
            if (this._transactionsInProgress == 0)
            {
                this._resolvePendingChanges();
            }
        }
    }

    /**
     * Returns all user plan documents.
     */
    public async userPlanDocs(): Promise<UserPlanDoc[]>
    {
        this.ensureConnected();
        let response = await this._dbOwn.allDocs({include_docs: true});
        return response.rows.map(r => r.doc).filter(r => r.doctype == "user-plan") as UserPlanDoc[];
    }

    public async basePlanDocHeaders(): Promise<PlanDocHeader[]>
    {
        this.ensureConnected();
        // noinspection JSVoidFunctionReturnValueUsed
        let response = await this._dbBase.find({
            selector: {_id: {$regex: "^(?!=_).*"}},
            fields: PLAN_HEADER_PROPERTIES
        });
        return response.docs;
    }

    /**
     * Returns the user settings document.
     */
    public async userSettingsDoc(): Promise<UserSettingsDoc>
    {
        this.ensureConnected();
        return await this._dbOwn.get(USER_SETTINGS_DOC_NAME);
    }

    /**
     * Creates a new user. Note that this is only possible when this instance is connected with a token holding the
     * _admin role.
     */
    public async createUser(username: string): Promise<void>
    {
        await this._dbUsers.put({
            _id: dbUsername(username),
            name: username,
            roles: [],
            type: "user"
        } as UserDoc);
    }

    /**
     * This Method looks up in the specified database if a document with an ID matching the ID of the given document is
     * already present and possibly comparing it against the given document. If such a document is not present or if it
     * differs from the given one (in case of comparison), the given document is pushed to the database.
     *
     * @param db The database in which to check for the document.
     * @param defaultDoc The document that is searched for and that possibly gets pushed to the database.
     * @param compare If this is true, a found matching document is checked against the given default document.
     */
    protected async _ensureDoc<T extends Doc<any>>(db: PouchDB.Database<T>, defaultDoc: T | DesignDoc, compare: boolean = false): Promise<void>
    {
        try
        {
            let doc = await db.get(defaultDoc._id);
            if (!compare) return;

            if (!isMatch(doc, defaultDoc))
            {
                let newDoc = cloneDeep(defaultDoc);
                newDoc._rev = doc._rev;
                await db.put(newDoc as T);
            }
        }
        catch (error)
        {
            if (error.status != 404) throw error;
            await db.put(defaultDoc as T);
        }
    }

    /**
     * Checks some documents of the newly connected instance (like the presence of a settings document) and fixes found
     * problems.
     */
    private async _ensureDbIntegrity(): Promise<void>
    {
        await this._ensureDoc(this._dbOwn, {
            _id: USER_SETTINGS_DOC_NAME,
            doctype: "user-settings",
            ignoredProblems: []
        });
    }

    private _resolvePendingChanges()
    {
        try
        {
            let external = false;
            for (let pending of this._pendingRevs)
            {
                if (!this._generatedRevs.has(pending))
                {
                    external = true;
                }
                this._generatedRevs.delete(pending);
            }

            if (external)
            {
                this.changeListener.emit("external");
            }
        }
        finally
        {
            this._pendingRevs.length = 0;
        }
    }

    private _handleUserDbChangeEvent(change: PouchDB.Core.ChangesResponseChange<UserData>)
    {
        this.changeListener.emit("any");
        for (let singleChange of change.changes)
        {
            this._pendingRevs.push(singleChange.rev);
        }

        if (this._transactionsInProgress == 0)
        {
            this.changeListener.emit("external");
        }
    }

    /**
     * Returns a fetch function which adds the given authentication token to every request made.
     */
    private _createFetchTokenInterceptor(token: string): Fetch
    {
        return (url, opts) =>
        {
            (opts.headers as any).set("Authorization", `Bearer ${token}`);
            return PouchDB.fetch(url, opts);
        };
    }
}
