import {Injectable, NgZone} from "@angular/core";
import {Plan, SemesterName} from "@vp/api-interfaces";
import {PlanProviderService} from "./plan-provider.service";
import {cloneDeep, filter, sortBy} from "lodash";
import {PlanGroupingMode} from "../enums/plan-grouping-mode";
import {PlanChangeService} from "./plan-change.service";

/**
 * This service provides functionality to manage the exposed plan, like activating and deactivating individual plans and
 * changing the module groupings. Inactive plans are ignored in the PlanMetaService service and are therefore not shown
 * in the UI.
 */
@Injectable({
    providedIn: "root"
})
export class PlanManagerService
{
    /**
     * A list that stores all active plan ids.
     */
    private _activePlans: string[] = [];

    /**
     * Stores the current plan grouping mode.
     */
    private _planGrouping = PlanGroupingMode.Category;

    /**
     * Constructor used for injection
     */
    constructor(
        private _planProvider : PlanProviderService,
        private _change: PlanChangeService,
        private _zone: NgZone)
    {
    }

    /**
     * Sets the grouping mode.
     */
    public setPlanGrouping(mode: PlanGroupingMode): void
    {
        this._planGrouping = mode;
    }

    /**
     * Returns the current grouping mode.
     */
    public getPlanGrouping(): PlanGroupingMode
    {
        return this._planGrouping;
    }

    /**
     * Sets the given plan to the active state.
     */
    public setPlanState(plan: Plan, isActive: boolean): void
    {
        if (isActive) this.activatePlan(plan);
        if (!isActive) this.deactivatePlan(plan);
    }

    /**
     * Sets the given plan to the active state.
     */
    public activatePlan(plan: Plan): void
    {
        if (!this._activePlans.includes(plan._id)) this._activePlans.push(plan._id);
        this._change.notifyChange(PlanManagerService, false).then();
    }

    /**
     * Sets the given plan to the inactive state.
     */
    public deactivatePlan(plan: Plan): void
    {
        this._activePlans = this._activePlans.filter(p => p != plan._id);
        this._change.notifyChange(PlanManagerService, false).then();
    }

    /**
     * Returns true if the given plan is active.
     */
    public isPlanActive(plan: Plan): boolean
    {
        return this._activePlans.includes(plan._id);
    }

    /**
     * Returns an array of all active plans.
     */
    public get activePlans() : Plan[]
    {
        let activePlans = filter(this.allPlans, p => this.isPlanActive(p));
        return sortBy(activePlans, ["startSemester", "_id"]);
    }

    /**
     * Returns an array of all plans.
     */
    public get allPlans() : Plan[]
    {
        let allPlans = Array.from(this._planProvider.plans.values());
        return sortBy(allPlans, ["startSemester", "_id"]);
    }

    public async addPlan(id: string, startSemester: SemesterName | null): Promise<void>
    {
        let plan = cloneDeep(await this._planProvider.getBasePlan(id));
        if (startSemester) plan.startSemester = cloneDeep(startSemester);
        this._planProvider.plans.set(id, plan);
        this.activatePlan(plan);
    }

    public async removePlan(id: string): Promise<void>
    {
        let plan = this._planProvider.plans.get(id);
        this._planProvider.plans.delete(id);
        this.deactivatePlan(plan);
    }
}
