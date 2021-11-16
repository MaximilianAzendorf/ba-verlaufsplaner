import {Injectable} from "@angular/core";
import {PlanProviderService} from "./plan-provider.service";
import {UserPlanDoc, UserSettingsDoc} from "@vp/api-interfaces";
import {cloneDeep, isEqual} from "lodash";
import {PlanChangeService} from "./plan-change.service";
import {PlanManagerService} from "./plan-manager.service";
import {patch} from "@vp/utility";
import {InitService} from "./init.service";

/**
 * An object containing the state of the plan that the undo service is collecting.
 */
interface UndoState
{
    /**
     * The user plan documents captured in this state.
     */
    userPlanDocs?: Map<string, UserPlanDoc>;

    /**
     * The user settings document captured in this state.
     */
    userSettingsDoc?: UserSettingsDoc
}

/**
 * This service collects the history of the user actions and provides means to undo or redo changes of the user based
 * of this history.
 */
@Injectable({
    providedIn: "root"
})
export class UndoService
{
    /**
     * The maximum size of the history. Older entries get discarded.
     */
    private static MAX_STEPS = 100;

    /**
     * The collected history.
     */
    private readonly _history: UndoState[] = [];

    /**
     * The index inside the history of the current state.
     */
    private _index = -1;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _init: InitService,
        private _planManager: PlanManagerService,
        private _planChange: PlanChangeService,
        private _planProvider: PlanProviderService)
    {
        _planProvider.ready.then(() =>
        {
            _planChange.planChangedAfterProvider.subscribe(UndoService, [], origin =>
            {
                if (origin != UndoService && origin != PlanManagerService) this._capture()
            });
        });
    }

    /**
     * Captures the current state of the plan and appends it to the history, possibly discarding old entries if the
     * history is too long.
     */
    private _capture(): void
    {
        if (!this._init.initialized) return;
        if (this.canRedo) this._history.splice(this._index + 1);

        this._history.push({
            userPlanDocs: cloneDeep(this._planProvider.userPlanDocs),
            userSettingsDoc: cloneDeep(this._planProvider.settingsDoc)
        });
        this._index++;

        if (this._history.length > UndoService.MAX_STEPS)
        {
            let offset = this._history.length - UndoService.MAX_STEPS;
            this._history.splice(0, offset);
            this._index -= offset;
        }
    }

    /**
     * Applies the given state so that it becomes the current real state of the plans.
     */
    private async _apply(state: UndoState): Promise<void>
    {
        for (let [id, userPlanDoc] of state.userPlanDocs)
        {
            if (!this._planProvider.plans.has(id))
            {
                await this._planManager.addPlan(id, userPlanDoc.diff["+startSemester"]);
            }
            this._planProvider.plans.set(id, patch(await this._planProvider.getBasePlan(id), userPlanDoc.diff));
        }

        for (let id of this._planProvider.plans.keys())
        {
            if (!state.userPlanDocs.has(id))
            {
                await this._planManager.removePlan(id);
            }
        }

        if (!isEqual(this._planProvider.settingsDoc, state.userSettingsDoc))
        {
            let replacement = state.userSettingsDoc;
            replacement._rev = this._planProvider.settingsDoc._rev;
            this._planProvider.settingsDoc = replacement;
        }

        await this._planChange.notifyChange(UndoService);
    }

    /**
     * Returns true if there are entries in the history older than the current state.
     */
    public get canUndo(): boolean
    {
        return this._index > 0;
    }

    /**
     * Returns true if there are entries in the history newer than the current state.
     */
    public get canRedo(): boolean
    {
        return this._index < this._history.length - 1;
    }

    /**
     * Applies the next oldest state.
     */
    public async undo(): Promise<boolean>
    {
        if (!this.canUndo) return false;

        await this._apply(this._history[--this._index]);

        return true;
    }

    /**
     * Applies the next newest state.
     */
    public async redo(): Promise<boolean>
    {
        if (!this.canRedo) return false;

        await this._apply(this._history[++this._index]);

        return true;
    }
}
