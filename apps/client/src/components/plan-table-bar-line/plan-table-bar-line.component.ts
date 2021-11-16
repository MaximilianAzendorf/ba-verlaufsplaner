import {Component, Input} from "@angular/core";
import {BarLayoutEntry} from "../../services/plan-bar-layout.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {Plan} from "@vp/api-interfaces";
import {PlanMetaService} from "../../services/plan-meta.service";
import {LocalizationService} from "../../services/localization.service";

/**
 * This component displays a single line of the plan bars at the top of the table header.
 */
@Component({
    selector: "[vpPlanTableBarLine]",
    templateUrl: "./plan-table-bar-line.component.html",
    styleUrls: ["./plan-table-bar-line.component.scss"]
})
export class PlanTableBarLineComponent
{
    /**
     * The layout line this component should display.
     */
    @Input() layoutLine: BarLayoutEntry[];

    /**
     * Constructor used for injection.
     */
    constructor(
        public _loc: LocalizationService,
        public _meta: PlanMetaService,
        public _logic: PlanTableLogicService)
    {
    }

    /**
     * This is called when the user hovers over a bar and highlights the corresponding plan.
     */
    _highlightPlan(plan: Plan)
    {
        this._logic.highlightFunction = moduleKey => moduleKey.planId == plan._id;
    }

    /**
     * Resets the highlighted plan when the user stops hovering of a bar.
     */
    _resetHighlight()
    {
        this._logic.highlightFunction = null;
    }
}
