import { Injectable } from "@angular/core";
import {PlanProviderService} from "./plan-provider.service";
import {ModuleDescription, Plan, PlanData} from "@vp/api-interfaces";
import {map, flatten, cloneDeep} from "lodash";
import {PlanManagerService} from "./plan-manager.service";
import {PlanChangeService} from "./plan-change.service";
import log from "loglevel";

/**
 * A module key is a reference to a specific module.
 */
export class ModuleKey
{
    /**
     * A string representation of this key.
     */
    public readonly str: string;

    /**
     * Constructs a new module key.
     */
    constructor(
        /**
         * The ID of the plan of this module.
         */
        public readonly planId: string,
        /**
         * The ID of the choice of this module, or null if the module is not part of a choice.
         */
        public readonly choiceId: string | null,
        /**
         * The ID of the alternative of this module, or null if the module is not part of a choice.
         */
        public readonly alternativeId: string | null,
        /**
         * The ID of the module.
         */
        public readonly moduleId: string)
    {
        if (choiceId && !alternativeId || !choiceId && alternativeId)
        {
            throw new Error("Invalid module key creation");
        }

        this.str = this._calcString();
    }

    /**
     * Generates the string representation of the key.
     */
    private _calcString(): string
    {
        return this.choiceId
            ? `${this.planId}/${this.choiceId}/${this.alternativeId}/${this.moduleId}`
            : `${this.planId}/${this.moduleId}`;
    }

    /**
     * Returns true if the given other key refers to the same module as this one.
     */
    public equals(other: ModuleKey): boolean
    {
        return this.str == other.str;
    }

    /**
     * Overrides the toString method.
     */
    public toString = () => this.str;
}

/**
 * This service provides functionality for resolving module keys.
 */
@Injectable({
    providedIn: "root"
})
export class ModuleAccessService
{
    /**
     * Lists of all keys of given plans are cached here so they don't have to be aggregated all over again.
     * @private
     */
    private readonly _keyCache: Map<string, ModuleKey[]> = new Map();

    /**
     * Constructor used for injection.
     */
    constructor(
        private _manager: PlanManagerService,
        private _change: PlanChangeService,
        private _provider: PlanProviderService)
    {
        _change.planChanged.subscribe(ModuleAccessService, [], _ =>
        {
            this.clearCache();
        })
    }

    public clearCache()
    {
        this._keyCache.clear();
        log.debug("Module access key cache cleared.");
    }

    /**
     * Returns a module key for each module in the given plan.
     */
    public moduleKeysOfPlan(plan: Plan, allAlternatives = false): ModuleKey[]
    {
        let cacheKey = `${allAlternatives ? "#" : ""}${plan._id}`;

        let cacheHit = this._keyCache.get(cacheKey);
        if (cacheHit) return [...cacheHit];

        let res: ModuleKey[] = [];

        for (let id of Object.keys(plan.modules))
        {
            res.push(new ModuleKey(plan._id, null, null, id));
        }

        for (let [choiceId, choice] of Object.entries(plan.choices))
        {
            for (let [altId, alt] of Object.entries(choice.alternatives))
            {
                if (!alt.active && !allAlternatives) continue;

                for (let moduleId of Object.keys(alt.modules))
                {
                    res.push(new ModuleKey(plan._id, choiceId, altId, moduleId));
                }
            }
        }

        this._keyCache.set(cacheKey, [...res]);
        return res;
    }

    /**
     * Returns a module key for each module in one of the given plans.
     */
    public moduleKeysOfPlans(plans: Plan[], allAlternatives = false): ModuleKey[]
    {
        return flatten(map(plans, p => this.moduleKeysOfPlan(p, allAlternatives)));
    }

    /**
     * Finds the module key of the module with the given module ID in the given plan.
     */
    public find(plan: Plan, moduleId: string): ModuleKey
    {
        return this.moduleKeysOfPlan(plan).find(k => k.moduleId == moduleId);
    }

    private _findPlanData(key: ModuleKey): PlanData
    {
        if (!key) return null;

        let plan = this._provider.plans.get(key.planId);
        return this._selectPlanData(plan, key);
    }

    private _selectPlanData(plan: Plan, key: ModuleKey)
    {
        if (!key) return null;

        let planData: PlanData = plan;

        if (key.choiceId)
        {
            planData = plan.choices[key.choiceId].alternatives[key.alternativeId];
        }

        return planData;
    }

    /**
     * Returns the module description of the module that the given key points to.
     */
    public get(key: ModuleKey): ModuleDescription
    {
        return this._findPlanData(key)?.modules[key.moduleId];
    }

    public getFrom(plan: Plan, key: ModuleKey): ModuleDescription
    {
        return this._selectPlanData(plan, key)?.modules[key.moduleId];
    }


    /**
     * Deletes the given module.
     */
    public delete(key: ModuleKey): void
    {
        delete this._findPlanData(key).modules[key.moduleId];
        this.clearCache();

        for (let moduleKey of this.moduleKeysOfPlan(this._provider.plans.get(key.planId)))
        {
            let module = this.get(moduleKey);
            module.requirements = module.requirements.filter(req => req.moduleId != key.moduleId);
        }

        this._change.notifyChange(ModuleAccessService).then();
    }

    /**
     * Adds the given module at the position specified by the given key.
     */
    public add(key: ModuleKey, description: ModuleDescription, notifyChange: boolean = true)
    {
        this._findPlanData(key).modules[key.moduleId] = cloneDeep(description);
        this.clearCache();

        if (notifyChange)
        {
            this._change.notifyChange(ModuleAccessService).then();
        }
    }
}
