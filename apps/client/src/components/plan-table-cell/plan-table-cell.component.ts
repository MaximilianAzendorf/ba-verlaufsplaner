import {ChangeDetectorRef, Component, ElementRef, HostBinding, Input, NgZone} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {CdkDragDrop, CdkDragRelease, CdkDragStart, DragRef, Point} from "@angular/cdk/drag-drop";
import {ModuleDescription} from "@vp/api-interfaces";
import {FailedAttemptRef, PlanMetaService} from "../../services/plan-meta.service";
import {ModuleSortingService} from "../../services/module-sorting.service";
import {PlanChangeService} from "../../services/plan-change.service";
import stringHash from "string-hash";
import shallowEqual from "shallowequal";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {map} from "lodash";
import {PlanProblem} from "../../services/plan-problems.service";
import {AuthenticationService} from "../../services/authentication.service";

/**
 * This component displays a single plan table cell, containing zero or more modules, and handles drag and drop between
 * table cells.
 */
@Component({
    selector: "[vpPlanTableCell]",
    templateUrl: "./plan-table-cell.component.html",
    styleUrls: ["./plan-table-cell.component.scss"]
})
export class PlanTableCellComponent
{
    /**
     * Parameter influencing the movement of dragged modules.
     */
    private static readonly DRAG_TOLERANCE_FALLOFF_PX = 20;

    /**
     * Parameter influencing the movement of dragged modules.
     */
    private static readonly DRAG_TOLERANCE_OFFSET_PX = -28;

    /**
     * The offset (which effectively is the column) of this table cell.
     */
    @Input() offset: number;

    /**
     * The group (which effectively is the row) of this table cell.
     */
    @Input() group: string;

    /**
     * This value is passed to the module components.
     */
    @Input() compact: boolean;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _element: ElementRef,
        private _modules: ModuleAccessService,
        public _logic: PlanTableLogicService,
        public _planMeta: PlanMetaService,
        public _planChange: PlanChangeService,
        public _moduleSorting: ModuleSortingService,
        private _changeDetection: ChangeDetectorRef,
        private _zone: NgZone)
    {
    }

    /**
     * A host binding that adds the blocked class to the host element if this cell is blocked while dragging a module.
     */
    @HostBinding("class.blocked")
    public get _hostBlockedClass() { return this._logic.offsetBlocked(this.offset); }

    /**
     * A host binding that adds the past class to the host element if this cell belongs to a past semester.
     */
    @HostBinding("class.past")
    public get _hostPastClass() { return this._logic.offsetPast(this.offset); }

    /**
     * This generates a unique name for a drag list used by the Angular CDK.
     */
    public _dragListName(group: string, offset: number): string
    {
        group = group != null ? stringHash(group).toString(36) : "";
        return `d${group}-${offset}`;
    }

    /**
     * This returns a list of drag list names to which the given drag list must be connected (to allow drag&drop between
     * them).
     */
    public _dragListConnections(group: string, offset: number): string[]
    {
        let con: string[] = [];

        for (let i = 0; i <= this._logic.maxOffset; i++)
        {
            if (i == offset) continue;
            con.push(this._dragListName(group, i));
        }

        return con;
    }

    /**
     * This is the predicate used as a value for cdkDropListEnterPredicate of the CDK drag lists.
     */
    public _cdkEnterPredicate(offset: number): () => boolean
    {
        return () => this._logic.maintainerMode || !this._logic.offsetBlocked(offset);
    }

    /**
     * This is called whenever the user starts to drag a module and sets the respective properties.
     */
    public _dragStarted(event: CdkDragStart): void
    {
        this._logic.isDragging = true;
        this._logic.draggedModule = event.source.data;
        this._zone.run(() => this._changeDetection.detach());
    }

    /**
     * This is called whenever the user releases/drops a module that they dragged and unsets the respective properties.
     */
    public _dragEnded(_event: CdkDragRelease): void
    {
        this._logic.isDragging = false;
        this._logic.draggedModule = undefined;
        this._zone.run(() => this._changeDetection.reattach());
    }

    /**
     * This is called after the user dragged a module to a different semester (or to a different spot in the same
     * semester). The change made is handled here.
     */
    public _dragDropped(event: CdkDragDrop<number>): void
    {
        if (event.currentIndex == event.previousIndex && event.container == event.previousContainer)
        {
            // Nothing changed, so we don't have to do anything.
            return;
        }

        let moduleKey = event.item.data as ModuleKey;
        let module = this._modules.get(moduleKey);

        let oldOffset = this._planMeta.localToGlobalOffset(moduleKey);
        let oldSortKey = module.sortKey ?? 0;
        let newOffset = event.container.data;
        let newSortKey = event.currentIndex;

        let oldGroup = this._planMeta.getRelevantModules({offset: oldOffset, group: this._planMeta.getGroup(moduleKey)});
        let newGroup = this._planMeta.getRelevantModules({offset: newOffset, group: this._planMeta.getGroup(moduleKey)});

        this._moduleSorting.applySortKeys(map(oldGroup, k => this._modules.get(k)));
        this._moduleSorting.applySortKeys(map(newGroup, k => this._modules.get(k)));

        for (let key of oldGroup)
        {
            let m = this._modules.get(key);
            if (m.sortKey != undefined && m.sortKey > oldSortKey) m.sortKey -= 1;
        }

        for (let key of newGroup)
        {
            let m = this._modules.get(key);
            if (m.sortKey != undefined && m.sortKey >= newSortKey) m.sortKey += 1;
        }

        module.offset = this._planMeta.globalToLocalOffset(moduleKey, newOffset);
        module.sortKey = newSortKey;

        this._planChange.notifyChange(PlanTableCellComponent).then();
        this._changeDetection.detectChanges();
    }

    /**
     * Is used as a trackBy function for attempt references.
     */
    public _attemptTrackFn(index: number, _item: FailedAttemptRef): any
    {
        return index;
    }

    /**
     * Is used as a trackBy function for module keys.
     */
    public _moduleKeyTrackFn(index: number, item: ModuleKey): string
    {
        return item.str;
    }

    /**
     * This event handler is called everytime the mouse enters or leaves the cell. This event is handled outside the
     * Angular zone; Change detection is only triggered if really necessary for performance reasons.
     */
    _mouseEventHandler($event: any): void
    {
        let highlightedBefore = this._logic.highlightedPlans;
        if ($event.type == "mouseenter")
        {
            this._logic.hoveredOffset = this.offset;
        }

        if (!shallowEqual(highlightedBefore, this._logic.highlightedPlans))
        {
            this._zone.run(() => this._changeDetection.detectChanges());
        }

        // When the mouse leaves a table cell that lies in the past, we have to trigger a requirement arrow
        // recalculation with a delay because the table cell may shrink after the mouse leaves after the user has marked
        // a module as not passed, because the then-new fail hint collapses. Therefore, the arrows calculated after the
        // module was marked as not passed may be misaligned, so we have to calculate them again after the mouse left.
        if ($event.type == "mouseleave")
        {
            if (this._logic.offsetPast(this.offset))
            {
                setTimeout(() =>
                {
                    this._logic.requirementsLayerComponent.triggerUpdate();
                }, 350);
            }
        }
    }

    /**
     * This is used to smooth out the constrained motion of dragged modules.
     */
    _transitionFunction(x: number, max: number)
    {
        return max * (1 - Math.pow(0.5, x / max));

    }

    /**
     * This is given to the CDK drag-drop module and handles the positional confinement of dragged modules.
     */
    _dragPosition(point: Point, _dragRef: DragRef): Point
    {
        let clientRect = this._element.nativeElement.getBoundingClientRect();
        let x = point.x;
        let y = point.y;
        let boundTop = clientRect.top - PlanTableCellComponent.DRAG_TOLERANCE_OFFSET_PX;
        let boundBottom = clientRect.bottom + PlanTableCellComponent.DRAG_TOLERANCE_OFFSET_PX;

        if (y < boundTop)
        {
            y = boundTop - this._transitionFunction(boundTop - y,
                PlanTableCellComponent.DRAG_TOLERANCE_FALLOFF_PX);
        }
        else if (y > boundBottom)
        {
            y = boundBottom + this._transitionFunction(y - boundBottom,
                PlanTableCellComponent.DRAG_TOLERANCE_FALLOFF_PX);
        }

        return {x: x, y: y};
    }
}
