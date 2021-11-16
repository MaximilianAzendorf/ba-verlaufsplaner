import {Injectable} from "@angular/core";
import {PlanChangeService} from "./plan-change.service";
import {PlanManagerService} from "./plan-manager.service";
import {ModuleDescription, Plan} from "@vp/api-interfaces";
import {PlanMetaService} from "./plan-meta.service";
import {PlanTableLogicService} from "./plan-table-logic.service";
import {PlanProviderService} from "./plan-provider.service";
import {flatten, isEmpty} from "lodash";
import {LocalizationService} from "./localization.service";
import {LocalizeFn} from "@angular/localize/init";
import log from "loglevel";
import {ModuleAccessService, ModuleKey} from "./module-access.service";

/** Angular localize function */
declare var $localize: LocalizeFn;

export type PlanProblemSeverity = "error" | "warning" | "question";

/**
 * Contains information about a single plan problem.
 */
export interface PlanProblem
{
    /**
     * A ID identifying the given problem. Problems can be hidden/ignored based on this ID.
     */
    id: string,

    /**
     * The description of the problem.
     */
    message: string;

    /**
     * An optional shorter version of the problem description.
     */
    messageShort?: string;

    /**
     * The module this problem belongs to. Only set on module-specific problems.
     */
    module?: ModuleKey;

    /**
     * The plan this problem belongs to. Only set on global problems.
     */
    plan?: Plan;

    /**
     * The severity of the problem.
     */
    severity: PlanProblemSeverity;
}

/**
 * This service contains validation logic for the plan and generates problem descriptions if there are problems
 * detected.
 */
@Injectable({
    providedIn: "root"
})
export class PlanProblemsService
{
    /**
     * This maps a module to its problems.
     */
    private readonly _problems: Map<string, PlanProblem[]> = new Map();

    /**
     * Constructor used for injection.
     */
    constructor(
        private _loc: LocalizationService,
        private _modules: ModuleAccessService,
        private _change: PlanChangeService,
        private _provider: PlanProviderService,
        private _manager: PlanManagerService,
        private _logic: PlanTableLogicService,
        private _meta: PlanMetaService)
    {
        _provider.ready.then(() =>
        {
            _change.planChanged.subscribe(
                PlanProblemsService,
                [PlanMetaService],
                _ => this.update());
        });
    }

    /**
     * This method validates the whole plan and generates problem descriptions.
     */
    public update()
    {
        this._problems.clear();
        this._problems.set(null, []);

        for (let moduleKey of this._modules.moduleKeysOfPlans(this._manager.activePlans))
        {
            this._problems.set(moduleKey.str, []);
        }

        this._findRequirementProblems();
        this._findRequiredEctsProblems();
        this._findPastModuleQuestionProblems();
        this._findPreponedModuleProblems();
        this._findGlobalProblems();

        this._validateIgnoredIds();

        log.debug("Plan problems updated");
    }

    /**
     * Returns all problems of the given module.
     */
    public problemsOfModule(moduleKey: ModuleKey): PlanProblem[]
    {
        let module = this._modules.get(moduleKey);
        if (module.passed) return [];
        return this._problems.get(moduleKey.str)
            ?.filter(p => !this._provider.settingsDoc.ignoredProblems.includes(p.id));
    }

    /**
     * Returns all problems.
     */
    public get problems()
    {
        return this.problemsWithIgnored.filter(p => !this._provider.settingsDoc.ignoredProblems.includes(p.id));
    }

    public get problemsWithIgnored()
    {
        return flatten(Array.from(this._problems.values()));
    }

    public get ignoredProblems()
    {
        return this.problemsWithIgnored.filter(p => this._provider.settingsDoc.ignoredProblems.includes(p.id));
    }

    /**
     * Returns true if the given module has any problems with "error" severity.
     */
    public hasErrors(moduleKey: ModuleKey): boolean
    {
        for (let problem of this.problemsOfModule(moduleKey))
        {
            if (problem.severity == "error") return true;
        }
        return false;
    }

    /**
     * Marks the given problem as ignored.
     */
    public markAsIgnored(problem: PlanProblem)
    {
        this._provider.settingsDoc.ignoredProblems.push(problem.id);
        this._change.notifyChange(PlanProblemsService).then();
    }

    /**
     * Marks the given problem as not ignored.
     */
    public markAsNotIgnored(problem: PlanProblem)
    {
        this._provider.settingsDoc.ignoredProblems =
            this._provider.settingsDoc.ignoredProblems.filter(id => id != problem.id);
        this._change.notifyChange(PlanProblemsService).then();
    }

    /**
     * Returns true if the given problem is marked ignored.
     */
    public isIgnored(problem: PlanProblem)
    {
        return this._provider.settingsDoc.ignoredProblems.includes(problem.id);
    }

    /**
     * Validates the plan against its module requirements.
     */
    private _findRequirementProblems()
    {
        for (let requirement of this._meta.requirements)
        {
            let fromModule = this._modules.get(requirement.from);
            let toModule = this._modules.get(requirement.to);

            if (!fromModule || !toModule) continue;

            if (toModule.passed) continue;

            if (this._meta.localToGlobalOffset(requirement.from) >= this._meta.localToGlobalOffset(requirement.to))
            {
                this._problems.get(requirement.to.str).push({
                    id: `Req:${requirement.from}:${requirement.to}:${requirement.required ? "r" : "nr"}`,
                    module: requirement.to,
                    severity: requirement.required ? "error" : "warning",
                    message: requirement.required
                        ? $localize `This module has the module "${this._loc.select(fromModule.name)}" as an unmet prerequisite.`
                        : $localize `This module has the module "${this._loc.select(fromModule.name)}" as an unmet recommended prerequisite.`,
                    messageShort: requirement.required
                        ? $localize `This module has an unmet prerequisite.`
                        : $localize `This module has an unmet recommended prerequisite.`
                });
            }
        }
    }

    /**
     * Validates the plan against the requiredEcts property of its modules.
     */
    private _findRequiredEctsProblems()
    {
        for (let moduleKey of this._modules.moduleKeysOfPlans(this._manager.activePlans))
        {
            let module = this._modules.get(moduleKey);
            let plan = this._provider.plans.get(moduleKey.planId);
            if (!module.requiredEcts) continue;

            let ects = this._meta.ectsSumCumulativeOfPlan(plan, module.offset - 1);

            if (ects < module.requiredEcts)
            {
                this._problems.get(moduleKey.str).push({
                    id: `Ects:${moduleKey.str}`,
                    module: moduleKey,
                    severity: "error",
                    message: $localize `This module can only be taken with ${module.requiredEcts} CP or more.`
                });
            }
        }
    }

    /**
     * Validates the plan against preponed modules.
     */
    private _findPreponedModuleProblems()
    {
        let preponeEcts = new Map<string, number>();

        for (let moduleKey of this._modules.moduleKeysOfPlans(this._manager.activePlans))
        {
            let module = this._modules.get(moduleKey);
            let plan = this._provider.plans.get(moduleKey.planId);
            if (module.offset < 0)
            {
                preponeEcts.set(moduleKey.planId, (preponeEcts.get(moduleKey.planId) || 0) + module.ects);

                // TODO: Check if modules can be preponed (only if there are 120 CP or more in the bachelor).
                /*
                if (this._meta.ectsSumCumulativeOfPlan(plan, module.offset - 1) < 120)
                {
                    this._problems.get(moduleKey.str).push({
                        id: `PreSumEcts:${moduleKey.str}`,
                        module: moduleKey,
                        severity: "error",
                        message: $localize `This module can only be preponed with ${120} CP or more.`
                    });
                }*/
            }
        }

        for (let plan of this._manager.activePlans)
        {
            if (preponeEcts.get(plan._id) > 30)
            {
                this._problems.get(null).push({
                    id: `PreEcts:${plan._id}`,
                    plan: plan,
                    severity: "error",
                    message: $localize `The course ${this._loc.select(plan.name)} has more than 30 CP worth of preponed modules.`
                });
            }
        }
    }

    /**
     * Validates the plan against modules (and their passed status) in past semesters.
     */
    private _findPastModuleQuestionProblems()
    {
        for (let moduleKey of this._modules.moduleKeysOfPlans(this._manager.activePlans))
        {
            let module = this._modules.get(moduleKey);
            if (!module.passed && this._logic.offsetPast(this._meta.localToGlobalOffset(moduleKey)))
            {
                this._problems.get(moduleKey.str).push({
                    id: `Past:${moduleKey.str}`,
                    module: moduleKey,
                    severity: "question",
                    message: $localize `Status of this module is unknown.`
                });
            }
        }
    }

    /**
     * Validates the plan regarding global potential problems, e.g. a missing selected plan choice
     */
    private _findGlobalProblems()
    {
        for (let plan of this._manager.activePlans)
        {
            if (isEmpty(plan.choices)) continue;

            for (let [choiceId, choice] of Object.entries(plan.choices))
            {
                let foundActive = false;
                for (let alternative of Object.values(choice.alternatives))
                {
                    if (alternative.active)
                    {
                        foundActive = true;
                        break;
                    }
                }

                if (!foundActive)
                {
                    this._problems.get(null).push({
                        id: `Noactive-${plan._id}-${choiceId}`,
                        plan: plan,
                        severity: "error",
                        message: $localize `The course "${this._loc.select(plan.name)}" has no selected choice of "${this._loc.select(choice.name)}".`
                    });
                }
            }

            if (plan.obsoleteAfter && new Date(plan.obsoleteAfter) < new Date())
            {
                let migratable = plan.migratableTo && plan.migratableTo.length > 0;

                this._problems.get(null).push({
                    id: `Obsolete-${plan._id}`,
                    plan: plan,
                    severity: migratable ? "error" : "warning",
                    message: migratable
                        ? $localize `The course "${this._loc.select(plan.name)} (${plan.version})" is obsolete and should be migrated to a newer version.`
                        : $localize `The course "${this._loc.select(plan.name)} (${plan.version})" is obsolete.`
                });
            }

            if (!plan.published)
            {
                this._problems.get(null).push({
                    id: `Unpublished-${plan._id}`,
                    plan: plan,
                    severity: "warning",
                    message: $localize `The plan "${this._loc.select(plan.name)} (${plan.version})" is not published.`
                });
            }
        }
    }

    /**
     * Removes ignored IDs if they do not correspond to any current problems. This way, problems that get resolved and
     * later reappear will be shown again instead of silently hidden because they were ignored before.
     */
    private _validateIgnoredIds()
    {
        let filteredIgnoredIds: string[] = [];

        for (let problem of this.problemsWithIgnored)
        {
            if (this._provider.settingsDoc.ignoredProblems.includes(problem.id))
            {
                filteredIgnoredIds.push(problem.id);
            }
        }

        if (filteredIgnoredIds.length != this._provider.settingsDoc.ignoredProblems.length)
        {
            this._provider.settingsDoc.ignoredProblems = filteredIgnoredIds;
            this._change.notifyChange(PlanProblemsService).then();
        }
    }
}
