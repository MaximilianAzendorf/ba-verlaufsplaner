import {ElementRef, Injectable} from "@angular/core";
import {ModuleDescription, Plan} from "@vp/api-interfaces";
import {PlanMetaService} from "./plan-meta.service";
import {PlanManagerService} from "./plan-manager.service";
import {ModuleComponent} from "../components/module/module.component";
import {SemesterNameService} from "./semester-name.service";
import {RequirementsLayerComponent} from "../components/requirements-layer/requirements-layer.component";
import {ModuleAccessService, ModuleKey} from "./module-access.service";
import {PlanProviderService} from "./plan-provider.service";

/**
 * This class serves as the glue between all plan table related components and shares state and logic between them. This
 * service is provided by the {@link PlanTableComponent} component.
 */
@Injectable({
    providedIn: "root"
})
export class PlanTableLogicService
{
    /**
     * This map is used to find the module component instances based on the key of the respective module.
     */
    public moduleComponents: Map<string, ModuleComponent> = new Map();

    /**
     * The element ref to the scroll container.
     */
    public scrollContainerRef: ElementRef;

    /**
     * This is the maximum offset that is displayed by the component. It can be increased and decreased by the
     * "Add/Remove Semester" buttons. It can not be lower than the maximum offset of the currently active plans (so the
     * plans are always displayed fully).
     */
    public maxOffset = -1;

    /**
     * This is true if the user is currently dragging a module with their mouse.
     */
    public isDragging = false;

    /**
     * This is only set if the user is currently dragging a module and contains the module description of the dragged
     * module.
     */
    public draggedModule: ModuleKey;

    /**
     * This is only set if the user is currently hovering over a module and contains the module description of that
     * module.
     */
    public hoveredModule: ModuleKey;

    /**
     * This is only set if the user is currently hovering over a plan table cell and contains the offset of that table
     * cell.
     */
    public hoveredOffset: number;

    /**
     * This function determines which modules should be highlighted in the plan table. If this is undefined or null,
     * all modules will be highlighted.
     */
    public highlightFunction: ((moduleKey: ModuleKey) => boolean) | undefined;

    /**
     * This property contains the current height of the table header, in pixels.
     */
    public headerHeight: number;

    /**
     * If this is set to true, all requirement arrows are shown at once.
     */
    public showAllRequirements: boolean;

    /**
     * This field contains the requirement layer component (which sets itself here), so that we can trigger arrow
     * recalculation on demand
     */
    public requirementsLayerComponent: RequirementsLayerComponent;

    /**
     * If this is set to true, the plan table shows options to edit module data and modals to upload base plans are
     * available.
     */
    public maintainerMode: boolean;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _modules: ModuleAccessService,
        private _planManager: PlanManagerService,
        private _planProvider: PlanProviderService,
        private _planMeta: PlanMetaService,
        private _semesterName: SemesterNameService)
    {
    }

    /**
     * Returns true if the given semester is blocked, meaning that the module currently being dragged cannot be dropped
     * into this semester (e.g. because of its cycle).
     */
    public offsetBlocked(offset: number): boolean
    {
        if (!this.isDragging) return false;

        if (offset < 0 || offset > this.maxOffset) return false;

        let draggedDesc = this._modules.get(this.draggedModule);

        let offsetDifference = this._planMeta.localToGlobalOffset(this.draggedModule) - offset;
        if (offsetDifference % draggedDesc.cycle != 0) return true;

        if (draggedDesc.offset - offsetDifference < 0) return !(draggedDesc.preponeAllowed ?? false);
    }

    /**
     * Returns true if the given semester is in the past.
     */
    public offsetPast(offset: number): boolean
    {
        let name = this._semesterName.offset(this._planMeta.startSemester, offset);
        return this._semesterName.lowerThan(name, this._semesterName.currentSemester());
    }

    /**
     * Returns true if the given module is in the past.
     */
    public modulePast(moduleKey: ModuleKey): boolean
    {
        return this.offsetPast(this._planMeta.localToGlobalOffset(moduleKey));
    }

    /**
     * Returns the index of the given group, which is used to assign different colors to different groups.
     */
    public groupIndex(group: string): number
    {
        return this._planMeta.groups.indexOf(group);
    }

    /**
     * Returns true if the given module should be highlighted by the current highlight function.
     */
    public isHighlighted(moduleKey: ModuleKey): boolean
    {
        if (!this.highlightFunction) return true;
        return this.highlightFunction(moduleKey);
    }

    /**
     * Returns a list of all offsets of the currently active plans.
     */
    public get offsets(): number[]
    {
        this.maxOffset = Math.max(this.maxOffset, this._planMeta.maxOffset);

        let offsets: number[] = [];

        for (let i = 0; i <= this.maxOffset; i++)
        {
            offsets.push(i);
        }

        return offsets;
    }

    /**
     * Returns whether or not the given plan should be highlighted, which is determined by over what the user currently
     * hovers his mouse.
     */
    public planIsHighlighted(plan: Plan): boolean
    {
        if (this.hoveredModule)
        {
            return this._planProvider.plans.get(this.hoveredModule.planId) == plan;
        }
        else if (this.hoveredOffset != undefined)
        {
            return this._planMeta.startOffsetOfPlan(plan) <= this.hoveredOffset
                && this._planMeta.maxOffsetOfPlan(plan) >= this.hoveredOffset;
        }
    }

    /**
     * Returns a list of all highlighted plans
     */
    public get highlightedPlans(): Plan[]
    {
        return this._planManager.activePlans.filter(p => this.planIsHighlighted(p));
    }
}
