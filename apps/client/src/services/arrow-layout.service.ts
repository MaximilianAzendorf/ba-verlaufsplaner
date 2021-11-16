import {Injectable} from "@angular/core";
import {ModuleDescription} from "@vp/api-interfaces";
import {PlanManagerService} from "./plan-manager.service";
import {PlanChangeService} from "./plan-change.service";
import {PlanTableLogicService} from "./plan-table-logic.service";
import {DomMeasurementService} from "./dom-measurement.service";
import {PlanMetaService} from "./plan-meta.service";
import {sortBy, map} from "lodash";
import log from "loglevel";
import {ModuleAccessService, ModuleKey} from "./module-access.service";

/**
 * This service handles the non-geometry layout of all requirement arrows. This includes the order in which arrows
 * are going out or coming into modules.
 */
@Injectable({
    providedIn: "root"
})
export class ArrowLayoutService
{
    /**
     * This maps every module to their incoming arrow list.
     */
    private readonly _incoming: Map<string, ModuleKey[]> = new Map();

    /**
     * This maps every module to their outgoing arrow list.
     */
    private readonly _outgoing: Map<string, ModuleKey[]> = new Map();

    /**
     * Constructor used for injection.
     */
    constructor(
        private _modules: ModuleAccessService,
        private _planManager: PlanManagerService,
        private _planChange: PlanChangeService,
        private _planMeta: PlanMetaService,
        private _tableLogic: PlanTableLogicService,
        private _measure: DomMeasurementService,
    )
    {
        // When the plan changes or a plan gets activated/deactivated, we have to recalculate.
        //
        _planChange.planChanged.subscribe(
            ArrowLayoutService,
            [PlanMetaService],
            _ => this._recalculate());
    }

    /**
     * Recalculates the arrow layout.
     */
    private _recalculate()
    {
        this._incoming.clear();
        this._outgoing.clear();

        for (let moduleKey of this._modules.moduleKeysOfPlans(this._planManager.activePlans))
        {
            this._incoming.set(moduleKey.str, []);
            this._outgoing.set(moduleKey.str, []);
        }

        for (let requirement of this._planMeta.requirements)
        {
            let toModule = this._modules.get(requirement.to);
            let fromModule = this._modules.get(requirement.from);
            let toOffset = this._planMeta.localToGlobalOffset(requirement.to);
            let fromOffset = this._planMeta.localToGlobalOffset(requirement.from);

            if (toOffset == fromOffset)
            {
                this._outgoing.get(requirement.to.str).push(requirement.from);
                this._outgoing.get(requirement.from.str).push(requirement.to);
            }
            else
            {
                if (toOffset < fromOffset)
                {
                    [toModule, fromModule] = [fromModule, toModule];
                }
                this._incoming.get(requirement.to.str).push(requirement.from);
                this._outgoing.get(requirement.from.str).push(requirement.to);
            }
        }

        log.debug("Arrow layout recalculated");
    }

    /**
     * This method is used to assign a sort key to every module depening on a pivot point, so that modules get sorted
     * in clockwise counter-clockwise order around that pivot, where the module with the smallest angle to the pivot
     * larger than the given cutoff angle is the first.
     */
    private _moduleSortKey(pivot: {top: number, left: number}, cutoffAngle: number, moduleKey: ModuleKey): number
    {
        let offset =  this._measure.offsetToAncestor(
            this._tableLogic.moduleComponents.get(moduleKey.str).element,
            this._tableLogic.scrollContainerRef);

        let [y, x] = [offset.top - pivot.top, offset.left - pivot.left]
        let angle = Math.atan2(y, x);
        angle -= cutoffAngle;
        if (angle < 0) angle += Math.PI * 2;

        return angle + Math.sqrt(x * x + y * y) / 100000;
    }

    /**
     * Sorts the given modules around the pivot, using the given cutoff angle in degrees.
     */
    private _sortAroundPivot(pivotKey: ModuleKey, moduleKeys: ModuleKey[], cutoffAngleDegrees: number)
        : ModuleKey[]
    {
        if (moduleKeys.length == 1) return moduleKeys;

        let pivotOffset = this._measure.offsetToAncestor(
            this._tableLogic.moduleComponents.get(pivotKey.str).element,
            this._tableLogic.scrollContainerRef);

        let cutoffAngle = cutoffAngleDegrees / 180 * Math.PI;
        return sortBy(moduleKeys, [module => this._moduleSortKey(pivotOffset, cutoffAngle, module)]);
    }

    /**
     * Returns all modules that are connected to this module by a requirement arrow.
     */
    public relevantModulesOf(moduleKey: ModuleKey): ModuleKey[]
    {
        return [moduleKey]
            .concat(...this._incoming.get(moduleKey.str) || [])
            .concat(...this._outgoing.get(moduleKey.str) || []);
    }

    /**
     * The number of incoming arrows of this module.
     */
    public incomingCount(moduleKey: ModuleKey): number
    {
        return (this._incoming.get(moduleKey.str) || []).length;
    }

    /**
     * The number of outgoing arrows of this module.
     */
    public outgoingCount(moduleKey: ModuleKey): number
    {
        return (this._outgoing.get(moduleKey.str) || []).length;
    }

    /**
     * Returns the sorted list of incoming arrow origins of this module. The keys are stringified.
     */
    public incoming(moduleKey: ModuleKey): string[]
    {
        let incoming = this._incoming.get(moduleKey.str) || [];
        return map(this._sortAroundPivot(moduleKey, incoming, 0).reverse(), k => k.str);
    }

    /**
     * Returns the sorted list of outgoing arrow destinations of this module. The keys are stringified.
     */
    public outgoing(moduleKey: ModuleKey): string[]
    {
        let outgoing = this._outgoing.get(moduleKey.str) || [];
        return map(this._sortAroundPivot(moduleKey, outgoing, 180), k => k.str);
    }
}
