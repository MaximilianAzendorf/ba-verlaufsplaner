import {Component, Input, ViewChild} from "@angular/core";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {PlanGroupingMode} from "../../enums/plan-grouping-mode";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {RequirementsLayerComponent} from "../requirements-layer/requirements-layer.component";
import {PlanProviderService} from "../../services/plan-provider.service";
import {LocalizationService} from "../../services/localization.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";

/**
 * This component displays all active plans in a table, with columns being the semesters and rows being the module
 * groups (as set by the plan manager service). This table is populated by module component instances for every module
 * displayed.
 */
@Component({
    selector: "vp-plan-table",
    templateUrl: "./plan-table.component.html",
    styleUrls: ["./plan-table.component.scss"]
})
export class PlanTableComponent
{
    /**
     * Backing field
     */
    private _compact: boolean;

    /**
     * This is true if the provider has not yet finished loading.
     */
    public _loading = true;

    /**
     * This value is forwarded to the module components.
     */
    @Input() set compact(value: boolean)
    {
        this._compact = value;
        this._requirementsLayerComponent?.triggerUpdate();
    }

    get compact(): boolean
    {
        return this._compact;
    }

    /**
     * The requirement layer component.
     */
    @ViewChild("requirementsLayer", {read: RequirementsLayerComponent}) _requirementsLayerComponent:
        RequirementsLayerComponent;

    /**
     * Constructor used for injection
     */
    public constructor(
        public _loc: LocalizationService,
        public _logic: PlanTableLogicService,
        public _planManager: PlanManagerService,
        public _planMeta: PlanMetaService,
        private _planProvider: PlanProviderService,
        public _singleton: SingletonComponentsService)
    {
        _planProvider.ready.then(() => this._loading = false);
    }

    /**
     * Returns true if the current grouping mode is set to category mode.
     */
    public _categoryGroupingModeActive()
    {
        return this._planManager.getPlanGrouping() == PlanGroupingMode.Category;
    }

    /**
     * This event handles the event when when user leaves the table with their mouse.
     */
    public _mouseLeave(_: MouseEvent): void
    {
        this._logic.hoveredOffset = undefined;
    }
}
