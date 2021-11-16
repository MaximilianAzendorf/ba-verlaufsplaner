import {ChangeDetectorRef, Component, NgZone, QueryList, ViewChildren} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {RequirementArrowComponent} from "../requirement-arrow/requirement-arrow.component";
import {PlanManagerService} from "../../services/plan-manager.service";
import {ArrowLayoutService} from "../../services/arrow-layout.service";
import log from "loglevel";

/**
 * This component handles all requirements arrows.
 */
@Component({
    selector: "vp-requirements-layer",
    templateUrl: "./requirements-layer.component.html",
    styleUrls: ["./requirements-layer.component.scss"]
})
export class RequirementsLayerComponent
{
    /**
     * A query list containing all requirement arrows.
     */
    @ViewChildren("arrow", {read: RequirementArrowComponent}) _arrows: QueryList<RequirementArrowComponent>;

    /**
     * Constructor used for injection.
     */
    constructor(
        _change: PlanChangeService,
        public _meta: PlanMetaService,
        public _manager: PlanManagerService,
        public _logic: PlanTableLogicService,
        private _changeDetection: ChangeDetectorRef,
        private _zone: NgZone)
    {
        _logic.requirementsLayerComponent = this;
        _change.planChanged.subscribe(
            RequirementsLayerComponent,
            [PlanMetaService, ArrowLayoutService],
            _ => this.triggerUpdate());
    }

    /**
     * This method schedules the recalculation of all arrow geometry.
     */
    public triggerUpdate()
    {
        setTimeout(() =>
        {
            for (let arrow of this._arrows)
            {
                arrow.updatePath();
            }
            this._zone.run(() => this._changeDetection.markForCheck());
        }, 0);

        log.debug("Requirements layer updated");
    }

    /**
     * Used as a trackBy function for the arrow components.
     */
    public _trackFunction(index, _item)
    {
        return index;
    }
}
