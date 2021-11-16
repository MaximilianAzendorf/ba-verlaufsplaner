import {Injectable} from "@angular/core";
import {ModuleDescription, Plan, PlanData, SemesterName} from "@vp/api-interfaces";
import {SemesterNameService} from "./semester-name.service";
import {ModuleSortingService} from "./module-sorting.service";
import {PlanManagerService} from "./plan-manager.service";
import {PlanGroupingMode} from "../enums/plan-grouping-mode";
import {PlanChangeService} from "./plan-change.service";
import {PlanProviderService} from "./plan-provider.service";
import log from "loglevel";
import {LocalizationService} from "./localization.service";
import {flatten, map, uniq, every} from "lodash";
import {ModuleAccessService, ModuleKey} from "./module-access.service";

/**
 * Contains the raw data of a single requirement.
 */
export interface Requirement
{
    /**
     * The module key of the module that is the requirement.
     */
    from: ModuleKey;

    /**
     * The module key of the module that has the requirement.
     */
    to: ModuleKey;

    /**
     * If this is set to false, this requirement is only a recommendation; otherwise it is mandatory.
     */
    required: boolean
}

/**
 * Contains a reference to a failed attempt of a module.
 */
export interface FailedAttemptRef
{
    /**
     * The module that contains the failed attempt.
     */
    moduleKey: ModuleKey;

    /**
     * The index of the attempt.
     */
    index: number;
}

/**
 * This service provides computed information about the curriculum plan that goes beyond the raw plan data. It uses the
 * PlanProviderService to get the raw data of all plans and provides the combined plan alongside additional data.
 */
@Injectable({
    providedIn: "root"
})
export class PlanMetaService
{
    /**
     * Backing data for the respective method.
     */
    private _ectsSums: Map<number, number> = new Map();

    /**
     * Backing data for the respective method.
     */
    private _requirements: Requirement[];

    /**
     * Backing data for the respective method.
     */
    private _requirementsOfModule: Map<string, Requirement[]> = new Map();

    /**
     * Backing data for the respective method.
     */
    private _startSemester: SemesterName;

    /**
     * Constructor used for injection
     */
    public constructor(
        private _loc: LocalizationService,
        private _modules: ModuleAccessService,
        private _planManager: PlanManagerService,
        private _planProvider: PlanProviderService,
        private _planChange: PlanChangeService,
        private _semesterName: SemesterNameService,
        private _moduleSorting: ModuleSortingService)
    {
        // When the plan changes or a plan gets activated/deactivated, we have to recalculate.
        //
        _planChange.planChanged.subscribe(
            PlanMetaService,
            [ModuleAccessService],
            _ => this._recalculate());

        // On every change, reduce sort keys as a preprocessing step.
        //
        _planChange.planChangedBeforeProvider.subscribe(
            PlanMetaService,
            [],
            origin =>
            {
                if (origin != PlanManagerService) this._reduceSortKeys()
            });
    }

    /**
     * Expensive properties (like the module lists) are not recalculated every time, but only when its needed.
     */
    private _recalculate()
    {
        this._requirements = [];
        this._ectsSums.clear();
        this._requirementsOfModule.clear();

        // Recalculate the start semester.
        //
        let lowestStart: SemesterName = undefined;
        for (let moduleKey of this._modules.moduleKeysOfPlans(this._planManager.activePlans))
        {
            let module = this._modules.get(moduleKey);
            let plan = this._planProvider.plans.get(moduleKey.planId);
            if (!plan.startSemester) continue;

            let semester = this._semesterName.offset(plan.startSemester, module.offset);

            if (lowestStart == undefined || this._semesterName.lowerThan(semester, lowestStart))
            {
                lowestStart = semester;
            }
        }
        if (!lowestStart && this._planManager.activePlans.length > 0) log.error("Plans do not contain start semesters.");
        this._startSemester = lowestStart || this._semesterName.currentSemester();

        let moduleKeys = this._modules.moduleKeysOfPlans(this._planManager.activePlans);

        for (let moduleKey of moduleKeys)
        {
            this._requirementsOfModule.set(moduleKey.str, []);
        }

        for (let moduleKey of moduleKeys)
        {
            // Recalculate requirements
            //
            let module = this._modules.get(moduleKey);
            let planOfModule = this._planProvider.plans.get(moduleKey.planId);

            if (!module.requirements) continue;
            for (let req of module.requirements)
            {
                let requirement = {
                    from: this._modules.find(planOfModule, req.moduleId),
                    to: moduleKey,
                    required: req.required
                };
                this._requirements.push(requirement);

                this._requirementsOfModule.get(requirement.from.str).push(requirement);
                this._requirementsOfModule.get(requirement.to.str).push(requirement);
            }

            // Recalculate ects sums
            //
            let offset = this.localToGlobalOffset(moduleKey);
            let sum = this._ectsSums.get(offset) || 0;
            this._ectsSums.set(offset, sum + module.ects);
        }

        log.debug("Plan meta service recalculated");
    }

    /**
     * This method removes redundant sort keys from modules so that the resulting diff is as small as possible. It is
     * used as a preprocessing step for plan changes.
     */
    private _reduceSortKeys() : void
    {
        for (let offset of this.offsets)
        {
            for (let group of this.groups)
            {
                this._moduleSorting.reduceSortKeys(
                    map(this.getRelevantModules({offset: offset, group: group}), k => this._modules.get(k)));
            }
        }

        log.debug("Plan meta service reduced sort keys");
    }

    private _planOfModule(moduleKey: ModuleKey): Plan
    {
        return this._planProvider.plans.get(moduleKey.planId);
    }

    /**
     * Returns all requirements of the current plans.
     */
    public get requirements(): Requirement[]
    {
        return this._requirements;
    }

    /**
     * Returns all requirements that have the given module as an endpoint.
     */
    public requirementsOfModule(moduleKey: ModuleKey): Requirement[]
    {
        return this._requirementsOfModule.get(moduleKey.str);
    }

    /**
     * Returns all plans that contain the given category.
     */
    public plansOfCategory(category: string): Plan[]
    {
        return this._planManager.activePlans.filter(p => p.categories.map(category => this._loc.select(category))
            .includes(category));
    }

    /**
     * Converts the local offset of the given module (the offset that this module would have as its offset value) to the
     * global offset relative to the starting semester of the whole plan (which can differ if there are more than one
     * plan with different starting semesters). You can omit the localOffset parameter to use the offset of the module
     * description itself.
     */
    public localToGlobalOffset(moduleKey: ModuleKey, localOffset: number | undefined = undefined): number
    {
        let module = this._modules.get(moduleKey);
        let planOfModule = this._planOfModule(moduleKey);
        let relOffset = this._semesterName.relativeOffset(this.startSemester, planOfModule.startSemester);

        return relOffset + (localOffset ?? module.offset);
    }

    /**
     * Converts the global offset (the offset relative to the starting semester of the whole plan) to the local offset
     * of the given module (the offset that this module would have as its offset value).
     */
    public globalToLocalOffset(moduleKey: ModuleKey, globalOffset: number): number
    {
        let planOfModule = this._planOfModule(moduleKey);
        let relOffset = this._semesterName.relativeOffset(this.startSemester, planOfModule.startSemester);

        return globalOffset - relOffset;
    }

    /**
     * Returns the group of the given module, depending of the active grouping mode.
     */
    public getGroup(moduleKey: ModuleKey): string
    {
        let plan = this._planOfModule(moduleKey);
        let module = this._modules.get(moduleKey);

        switch (this._planManager.getPlanGrouping())
        {
        case PlanGroupingMode.Category:
            return this._loc.select(plan.categories[module.category]);
        case PlanGroupingMode.Plan:
            return this._loc.select(plan.name);
        default:
            throw new Error("Unsupported grouping mode " + this._planManager.getPlanGrouping());
        }
    }

    /**
     * Returns all modules that satisfy the given filter object, sorted deterministically.
     *
     * @param filter A filter object with two fields, offset and group. Only modules with the given offset and group are
     * returned from the function.
     */
    public getRelevantModules(filter: {offset: number, group: string | undefined}): ModuleKey[]
    {
        let modules: ModuleKey[] = [];

        for (let moduleKey of this._modules.moduleKeysOfPlans(this._planManager.activePlans))
        {
            if (this.localToGlobalOffset(moduleKey) != filter.offset) continue;
            if (this.getGroup(moduleKey) != filter.group) continue;

            modules.push(moduleKey);
        }

        modules.sort((a, b) =>
        {
            let moduleA = this._modules.get(a);
            let moduleB = this._modules.get(b);
            return this._moduleSorting.moduleSortFn(moduleA, moduleB)
        });

        return modules;
    }

    /**
     * Returns references to all failed attempts that satisfy the given filter object.
     *
     * @param filter A filter object with two fields, offset and category. Only failed attempts with the given offset
     * and category are returned from the function.
     */
    public getRelevantFailedAttempts(filter: {offset: number, group: string | undefined}): FailedAttemptRef[]
    {
        let refs: FailedAttemptRef[] = [];
        let offsetName = this._semesterName.offset(this.startSemester, filter.offset);

        for (let moduleKey of this._modules.moduleKeysOfPlans(this._planManager.activePlans))
        {
            let module = this._modules.get(moduleKey);

            if (module.passed) continue;
            if (!module.failedSemesters) continue;
            if (this.getGroup(moduleKey) != filter.group) continue;

            for (let failed of module.failedSemesters)
            {
                if (this._semesterName.relativeOffset(offsetName, failed) != 0) continue;
                refs.push({moduleKey: moduleKey, index: module.failedSemesters.indexOf(failed)});
            }
        }

        return refs;
    }

    /**
     * Returns the cumulative ects credits of all modules that have the specified offset. This basically is the number
     * of credits that are planed for the semester given by the specified offset.
     */
    public ectsSum(offset: number): number
    {
        return this._ectsSums.get(offset) || 0;
    }

    /**
     * Returns the cumulative ects credits of all modules that have the specified offset or a lower one. This basically
     * is the number of credits that the student has after they finish it according to plan.
     */
    public ectsSumCumulative(offset: number): number
    {
        let sum = 0;
        do
        {
            sum += this.ectsSum(offset);
        } while (offset-- > 0);

        return sum;
    }

    /**
     * Returns the cumulative ects credits of all modules that have the specified offset or a lower one in the specified
     * plan.
     */
    public ectsSumCumulativeOfPlan(plan: Plan, localOffset: number): number
    {
        let sum = 0;

        for (let moduleKey of this._modules.moduleKeysOfPlan(plan))
        {
            let module = this._modules.get(moduleKey);
            if (module.offset <= localOffset)
            {
                sum += module.ects;
            }
        }

        return sum;
    }

    /**
     * Returns an array of all categories.
     */
    public get categories(): string[]
    {
        let categories = uniq(
            flatten(
                map(this._planManager.activePlans, p => p.categories))
                .map(category => this._loc.select(category)));

        if (!every(this._modules.moduleKeysOfPlans(this._planManager.activePlans),
            m => this._modules.get(m).category >= 0))
        {
            categories.splice(0, 0, null);
        }

        return categories;
    }

    /**
     * Returns an array of all active plan names.
     */
    public get activePlanNames(): string[]
    {
        return map(this._planManager.activePlans, p => this._loc.select(p.name)).sort();
    }

    /**
     * Returns an array of all groups
     */
    public get groups(): string[]
    {
        switch (this._planManager.getPlanGrouping())
        {
        case PlanGroupingMode.Category:
            return this.categories;
        case PlanGroupingMode.Plan:
            return this.activePlanNames;
        default:
            throw new Error("Unsupported grouping mode " + this._planManager.getPlanGrouping());
        }
    }

    /**
     * Returns the maximum offset that is present in the plan.
     */
    public get maxOffset() : number
    {
        let maxOffset = 0;
        for (let module of this._modules.moduleKeysOfPlans(this._planManager.activePlans))
        {
            maxOffset = Math.max(this.localToGlobalOffset(module), maxOffset);
        }

        return maxOffset;
    }

    /**
     * Returns the maximum global offset of any module of the given plan.
     */
    public maxOffsetOfPlan(plan: Plan): number
    {
        let maxOffset = 0;
        for (let module of this._modules.moduleKeysOfPlan(plan))
        {
            maxOffset = Math.max(this.localToGlobalOffset(module), maxOffset);
        }

        return maxOffset;
    }

    /**
     * Returns the global offset at which the given plan starts.
     */
    public startOffsetOfPlan(plan: Plan): number
    {
        return this._semesterName.relativeOffset(this.startSemester, plan.startSemester);
    }

    /**
     * Returns all offsets relvant for the plan. This basically returns an array of all numbers from 0 to maxOffset
     * (inclusive).
     */
    public get offsets() : number[]
    {
        let semesters: number[] = []
        for (let i = 0; i <= this.maxOffset; i++)
        {
            semesters.push(i);
        }

        return semesters;
    }

    /**
     * Returns the semester name of the start semester of the plan.
     */
    public get startSemester() : SemesterName
    {
        return this._startSemester;
    }
}
