import {Component, DoCheck, ElementRef, QueryList, Renderer2, ViewChildren} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {PlanBarLayoutService} from "../../services/plan-bar-layout.service";

/**
 * This component displays the whole table header of the plan table and computes its layout.
 */
@Component({
    selector: "[vpPlanTableHeader]",
    templateUrl: "./plan-table-header.component.html",
    styleUrls: ["./plan-table-header.component.scss"]
})
export class PlanTableHeaderComponent implements DoCheck
{
    /**
     * A query list containing all header lines, so we can compute the right spacing between them.
     */
    @ViewChildren("headerLine", {read: ElementRef}) headerLines: QueryList<ElementRef>;

    /**
     * Constructor used for injection.
     */
    public constructor(
        public _logic: PlanTableLogicService,
        public _barLayout: PlanBarLayoutService,
        private _renderer: Renderer2)
    {
    }

    ngDoCheck(): void
    {
        if (!this.headerLines) return;

        let totalHeight = 0;
        for (let lineTr of this.headerLines.map(e => e.nativeElement))
        {
            for (let lineChildren of lineTr.children)
            {
                this._renderer.setStyle(lineChildren, "position", "sticky");
                this._renderer.setStyle(lineChildren, "top", `${totalHeight}px`);
            }
            totalHeight += lineTr.clientHeight;
        }

        this._logic.headerHeight = totalHeight;
    }
}
