import {Component, ElementRef, EventEmitter, Input, Output} from "@angular/core";
import {PlanProblem, PlanProblemsService} from "../../services/plan-problems.service";
import {sortBy} from "lodash";
import {LocalizationService} from "../../services/localization.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";
import {LocalizeFn} from "@angular/localize/init";
import {ModuleAccessService} from "../../services/module-access.service";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This component shows a table containing a list of plan problems.
 */
@Component({
    selector: "vp-errors-hub-table",
    templateUrl: "./errors-hub-table.component.html",
    styleUrls: ["./errors-hub-table.component.scss"]
})
export class ErrorsHubTableComponent
{
    /**
     * Backing field.
     */
    private _problems: PlanProblem[];

    @Output()
    public readonly closeRequested: EventEmitter<void> = new EventEmitter();

    /**
     * The list of problems that should be shown.
     */
    @Input() public set problems(value: PlanProblem[])
    {
        this._problems = value;
        this._update();
    }

    public get problems(): PlanProblem[]
    {
        return this._problems;
    }

    /**
     * This is true when there are only problems to be shown that do not belong to a specific module. In that case, the
     * module column is hidden.
     */
    public _onlyGlobal: boolean;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _element: ElementRef,
        public _loc: LocalizationService,
        public _modules: ModuleAccessService,
        private _tableLogic: PlanTableLogicService,
        private _planMeta: PlanMetaService,
        private _planChange: PlanChangeService,
        public _planProblems: PlanProblemsService,
        private _singleton: SingletonComponentsService)
    {
    }

    /**
     * Sorts the given problems by their severity and decides if there are only global problems present.
     */
    private _update(): void
    {
        this._problems = sortBy(this.problems, ["severity"]);
        this._onlyGlobal = !this._problems.find(p => p.module != null);
    }

    /**
     * The tooltip text for the hide/show button.
     */
    public _hideShowTooltip(problem: PlanProblem)
    {
        return this._planProblems.isIgnored(problem)
            ? $localize `Show this problem`
            : $localize `Hide this problem`;
    }

    /**
     * Hides or shows the given problem depending on the current state of the problem.
     */
    public _hideShow(problem: PlanProblem)
    {
        if (this._planProblems.isIgnored(problem))
        {
            this._planProblems.markAsNotIgnored(problem);
        }
        else
        {
            this._planProblems.markAsIgnored(problem);
        }
    }

    /**
     * Goes to the given problem. If its a global problem (belonging to a plan), we show the plan settings. Else, we
     * let the respective module blink and scroll to it.
     */
    public _goTo(problem: PlanProblem)
    {
        if (problem.module)
        {
            this._tableLogic.moduleComponents.get(problem.module.str).blink();
        }
        else if (problem.plan)
        {
            this._singleton.planSettings.show(problem.plan);
        }
        setTimeout(() => this.closeRequested.emit(), 0);
    }
}
