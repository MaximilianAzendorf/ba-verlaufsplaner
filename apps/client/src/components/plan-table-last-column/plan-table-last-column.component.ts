import {Component, OnDestroy} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {TopologicalSubscription} from "@vp/utility";

/**
 * This component displays the buttons used for adding and removing semesters from the plan table view at the end of
 * the table.
 */
@Component({
    selector: "[vpPlanTableLastColumn]",
    templateUrl: "./plan-table-last-column.component.html",
    styleUrls: ["./plan-table-last-column.component.scss"]
})
export class PlanTableLastColumnComponent implements OnDestroy
{
    /**
     * A subscription object stored for cleanup purposes.
     */
    private _changeSubscription: TopologicalSubscription;

    /**
     * Constructor used for injection.
     */
    constructor(
        public _logic: PlanTableLogicService,
        private _change: PlanChangeService,
        public _planMeta: PlanMetaService,
        private _manager: PlanManagerService)
    {
        this._changeSubscription = _change.planChanged.subscribe(
            PlanTableLastColumnComponent,
            [PlanMetaService],
            origin =>
            {
                if (origin != PlanManagerService) return;
                _logic.maxOffset = _planMeta.maxOffset
            });
    }

    /**
     * This causes the component to show one semester more.
     */
    public _addSemester(): void
    {
        this._logic.maxOffset += 1;
    }

    /**
     * This causes the component to show one semester less.
     */
    public _removeSemester(): void
    {
        this._logic.maxOffset -= 1;
    }

    /**
     * This prevents the default behaviour of an event and is used to prevent some undesired focusing behaviour of the
     * "Add/Remove Semester" buttons.
     */
    public _preventDefault($event): void
    {
        $event.preventDefault();
    }

    ngOnDestroy()
    {
        this._changeSubscription.unsubscribe();
    }
}
