import {Component, DoCheck, Input} from "@angular/core";
import {PlanMetaService, Requirement} from "../../services/plan-meta.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {DomMeasurementService} from "../../services/dom-measurement.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {ArrowLayoutService} from "../../services/arrow-layout.service";
import {ModuleAccessService} from "../../services/module-access.service";

/**
 * This component is used to display a single requirement arrow inside the plan table and contains the necessary logic
 * to handle its geometry and appearance.
 */
@Component({
    selector: "vp-requirement-arrow",
    templateUrl: "./requirement-arrow.component.html",
    styleUrls: ["./requirement-arrow.component.scss"]
})
export class RequirementArrowComponent
{
    /**
     * The distance (in pixels) between two arrow ends that are either outgoing or incoming at the same side of the same
     * module.
     */
    static readonly ARROW_OFFSET_SPACING = 18;

    /**
     * This parameter controls the minimum "curviness" of the arrows. Higher values mean more cuviness.
     */
    static readonly ARROW_MIN_ARC = 45;

    /**
     * This parameter controls how much the curve sizes grow with the vertical distance between the start and end of
     * an arrow.
     */
    static readonly ARROW_ARC_FACTOR = 0.35;

    /**
     * This parameter controls how curvy the curve on the second half of the arrow (the side with the arrow tip) is in
     * relation to the other half.
     */
    static readonly ARROW_ARC_INCOMING_FACTOR = 0.66;

    /**
     * This parameter controls how much the curve of the second half of the arrow (the side with the arrow tip) is
     * depending on how much arrows are coming in to the same module before this one. If we call this number n, the
     * final curviness factor of this  arrow side is then given by
     *
     *      ARROW_ARC_INCOMING_FACTOR + n * ARROW_ARC_INCOMING_FACTOR_INDEX_STEP.
     */
    static readonly ARROW_ARC_INCOMING_FACTOR_INDEX_STEP = 0.16;

    /**
     * Every arrow whose start- and endpoints are less than this much pixel apart on the vertical axis are
     * "straightened", meaning the y coordinate of the startpoint is moved so that the arrow is completely straight.
     */
    static readonly ARROW_STRAIGHTEN_THRESHOLD = 20;

    /**
     * Arrows that have the form of a single bend (which is only the case for arrows that start and end at modules that
     * are in the same semester) use this parameter to determine the minimum size of this bend.
     */
    static readonly ARROW_LOOP_MIN_BEND = 50;

    /**
     * Controls how much the size of the bend of single-bend-arrows is growing depending on the distance between their
     * start- end endpoints in the vertical axis.
     */
    static readonly ARROW_LOOP_BEND_FACTOR = 0.25;

    /**
     * The requirement data that this arrow should be representing.
     */
    @Input() requirement: Requirement;

    /**
     * Cubic bezier control point 1.
     */
    private _ca = {x: 0, y: 0};

    /**
     * Cubic bezier control point 2.
     */
    private _cb = {x: 0, y: 0};

    /**
     * Cubic bezier control point 3.
     */
    private _cc = {x: 0, y: 0};

    /**
     * Cubic bezier control point 4.
     */
    private _cd = {x: 0, y: 0};

    /**
     * A unique ID for this arrow.
     */
    public get _requirementId()
    {
        return this.requirement.from + "--" + this.requirement.to + "--" + (this.requirement.required ? "R" : "N");
    }

    /**
     * If this is true, the arrow should not be shown.
     */
    public get _isHidden()
    {
        if (this._logic.draggedModule != undefined) return true;
        if (this._logic.showAllRequirements && !this._logic.hoveredModule) return false;
        if (!this._logic.hoveredModule) return true;

        return !this._logic.hoveredModule.equals(this.requirement.from)
            && !this._logic.hoveredModule.equals(this.requirement.to);
    }

    /**
     * The path description string containing the arrow geometry.
     */
    public get _pathDescriptor()
    {
        return `M ${this._ca.x},${this._ca.y} C ${this._cb.x},${this._cb.y} ${this._cc.x},`
             + `${this._cc.y} ${this._cd.x},${this._cd.y}`;
    }

    /**
     * The module this arrow is pointing from.
     */
    public get _fromModule()
    {
        return this._modules.get(this.requirement.from);
    }

    /**
     * The module this arrow is pointing to.
     */
    public get _toModule()
    {
        return this._modules.get(this.requirement.to);
    }

    /**
     * Constructor used for injection.
     */
    constructor(
        private _modules: ModuleAccessService,
        public _meta: PlanMetaService,
        public _change: PlanChangeService,
        public _logic: PlanTableLogicService,
        public _arrowLayout: ArrowLayoutService,
        public _measure: DomMeasurementService)
    {
    }

    /**
     * This method recalculates the arrow geometry.
     */
    public updatePath()
    {
        let fromComponent = this._logic.moduleComponents.get(this.requirement.from.str);
        let toComponent = this._logic.moduleComponents.get(this.requirement.to.str);
        let fromModule = this._fromModule;
        let toModule = this._toModule;

        let flipped = false;

        let toGlobalOffset = this._meta.localToGlobalOffset(this.requirement.to);
        let fromGlobalOffset = this._meta.localToGlobalOffset(this.requirement.from);

        if (toGlobalOffset < fromGlobalOffset)
        {
            [toComponent, fromComponent] = [fromComponent, toComponent];
            [toModule, fromModule] = [fromModule, toModule];
            flipped = true;
        }

        let fromOffset = this._measure.offsetToAncestor(fromComponent.element, this._logic.scrollContainerRef);
        let toOffset = this._measure.offsetToAncestor(toComponent.element, this._logic.scrollContainerRef);

        let outgoingIndex = this._arrowLayout.outgoing(this.requirement.from).indexOf(this.requirement.to.str);
        let incomingIndex = this._arrowLayout.incoming(this.requirement.to).indexOf(this.requirement.from.str);
        let bothOutgoing = false;

        // If the two modules have the same global offset, both arrow ends are outgoing.
        if (incomingIndex == -1)
        {
            bothOutgoing = true;
            incomingIndex = this._arrowLayout.outgoing(this.requirement.to).indexOf(this.requirement.from.str);
        }

        let outgoingOffset = (outgoingIndex
            - this._arrowLayout.outgoingCount(this.requirement.from) / 2 + 0.5)
            * RequirementArrowComponent.ARROW_OFFSET_SPACING;
        let incomingOffset = (incomingIndex
            - (bothOutgoing
                ? this._arrowLayout.outgoingCount(this.requirement.to)
                : this._arrowLayout.incomingCount(this.requirement.to)
            ) / 2 + 0.5)
            * RequirementArrowComponent.ARROW_OFFSET_SPACING;

        if (fromGlobalOffset == toGlobalOffset)
        {
            this._ca.x = fromOffset.left + this._measure.width(fromComponent.element);
            this._ca.y = fromOffset.top + this._measure.height(fromComponent.element) / 2 + outgoingOffset;
            this._cd.x = toOffset.left + this._measure.width(toComponent.element);
            this._cd.y = toOffset.top + this._measure.height(toComponent.element) / 2 + incomingOffset;

            let bend = Math.max(RequirementArrowComponent.ARROW_LOOP_MIN_BEND,
                Math.abs(this._ca.y - this._cd.y) * RequirementArrowComponent.ARROW_LOOP_BEND_FACTOR);

            this._cb.x = this._ca.x + bend;
            this._cb.y = this._ca.y;
            this._cc.x = this._cd.x + bend;
            this._cc.y = this._cd.y;
        }
        else
        {
            this._ca.x = fromOffset.left + this._measure.width(fromComponent.element);
            this._ca.y = fromOffset.top + this._measure.height(fromComponent.element) / 2 + outgoingOffset;
            this._cd.x = toOffset.left;
            this._cd.y = toOffset.top + this._measure.height(toComponent.element) / 2 + incomingOffset;

            let arcFactor = Math.abs(this._ca.y - this._cd.y) * RequirementArrowComponent.ARROW_ARC_FACTOR;
            let arcIncomingFactor = RequirementArrowComponent.ARROW_ARC_INCOMING_FACTOR
                + ((flipped ? outgoingIndex : incomingIndex)
                    * RequirementArrowComponent.ARROW_ARC_INCOMING_FACTOR_INDEX_STEP);

            let arcOut = Math.max(RequirementArrowComponent.ARROW_MIN_ARC, arcFactor);
            let arcIn = Math.max(RequirementArrowComponent.ARROW_MIN_ARC, arcFactor * arcIncomingFactor);
            if (Math.abs(this._ca.y - this._cd.y) < RequirementArrowComponent.ARROW_STRAIGHTEN_THRESHOLD)
            {
                arcIn = arcOut = 0;
            }
            else if (flipped)
            {
                [arcIn, arcOut] = [arcOut, arcIn];
            }

            this._cb.x = this._ca.x + Math.max(arcOut, (this._cd.x - this._ca.x) / 2);
            this._cb.y = this._ca.y;
            this._cc.x = this._cd.x - Math.max(arcIn, (this._cd.x - this._ca.x) / 2);
            this._cc.y = this._cd.y;
        }

        // Straighten arrows if reasonable
        if (Math.abs(this._ca.y - this._cd.y) < RequirementArrowComponent.ARROW_STRAIGHTEN_THRESHOLD)
        {
            if (this._arrowLayout.incomingCount(this.requirement.to) == 1)
            {
                this._cd.y = this._cb.y = this._cc.y = this._ca.y;
            }
            else if (this._arrowLayout.outgoingCount(this.requirement.from) == 1)
            {
                this._ca.y = this._cb.y = this._cc.y = this._cd.y;
            }
        }

        if (flipped)
        {
            [this._ca, this._cb, this._cc, this._cd] = [this._cd, this._cc, this._cb, this._ca];
        }

        if (Math.abs(this._ca.x - this._cd.x) < 20 && this._ca.y == this._cd.y)
        {
            this._ca.x += 9 * (flipped ? 1 : -1);
        }
    }
}
