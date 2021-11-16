import {Component, ElementRef, Input, NgZone, OnDestroy, Renderer2, ViewChild} from "@angular/core";
import {SemesterNameService} from "../../services/semester-name.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {TopologicalSubscription} from "@vp/utility";
import {LocalizeFn} from "@angular/localize/init";
import {PlanManagerService} from "../../services/plan-manager.service";
import {LocalizationService} from "../../services/localization.service";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This component displays the number and semester name of the semester of the given offset as well as the total ECTS
 * credits in that semester.
 */
@Component({
    selector: "[vpPlanTableColumnHeader]",
    templateUrl: "./plan-table-column-header.component.html",
    styleUrls: ["./plan-table-column-header.component.scss"]
})
export class PlanTableColumnHeaderComponent implements OnDestroy
{
    /**
     * The offset (which effectively is the column) of this header.
     */
    @Input() offset: number;

    /**
     * The ECTS view child.
     */
    @ViewChild("ects") _ects: ElementRef;

    /**
     * The last ECTS sum of this row. This is used to compute changes in this sum on change detection cycles.
     * @private
     */
    private _lastEcts: number;

    /**
     * A subscription object stored for cleanup purposes.
     */
    private _changeSubscription: TopologicalSubscription;

    /**
     * Constructor used for injection.
     */
    public constructor(
        private _loc: LocalizationService,
        public _logic: PlanTableLogicService,
        private _planManager: PlanManagerService,
        public _planMeta: PlanMetaService,
        public _planChange: PlanChangeService,
        public _semesterName: SemesterNameService,
        private _zone: NgZone,
        private _renderer: Renderer2)
    {
        this._changeSubscription = _planChange.planChanged.subscribe(
            PlanTableColumnHeaderComponent,
            [PlanMetaService],
            () => this._checkEctsChange());

        setTimeout(() => this._lastEcts = _planMeta.ectsSum(this.offset), 0);
    }

    /**
     * Returns the tooltip string containing the total accumulated ECTS of the semester.
     */
    public get _totalEctsString(): string
    {
        let total = $localize `Total: ${this._planMeta.ectsSumCumulative(this.offset)} CP`;

        if (this._planManager.activePlans.length > 1)
        {
            for (let plan of this._planManager.activePlans)
            {
                let localOffset = this.offset - this._semesterName.relativeOffset(this._planMeta.startSemester, plan.startSemester);
                total += ` \n ${this._loc.select(plan.name)}: ${this._planMeta.ectsSumCumulativeOfPlan(plan, localOffset)} CP`;
            }
        }

        return total;
    }

    /**
     * Checks if the sum of ECTS in this column has gone up or down with the current change detection cycle. It then
     * adds the respective CSS classes to the ECTS view child.
     */
    private _checkEctsChange()
    {
        this._zone.runOutsideAngular(() =>
        {
            let newEcts = this._planMeta.ectsSum(this.offset)

            if (this._lastEcts > newEcts)
            {
                this._renderer.removeClass(this._ects.nativeElement, "went-down");
                this._renderer.removeClass(this._ects.nativeElement, "went-up");
                setTimeout(() => this._renderer.addClass(this._ects.nativeElement, "went-down"), 0);
            }
            if (this._lastEcts < newEcts)
            {
                this._renderer.removeClass(this._ects.nativeElement, "went-down");
                this._renderer.removeClass(this._ects.nativeElement, "went-up");
                setTimeout(() => this._renderer.addClass(this._ects.nativeElement, "went-up"), 0);
            }

            this._lastEcts = newEcts;
        });
    }

    ngOnDestroy()
    {
        this._changeSubscription.unsubscribe();
    }
}
