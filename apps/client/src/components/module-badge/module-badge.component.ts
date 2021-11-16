import {Component, Input} from "@angular/core";
import {PlanProblemSeverity} from "../../services/plan-problems.service";

/**
 * This purely visual component represents a single module badge.
 */
@Component({
    selector: "vp-module-badge",
    templateUrl: "./module-badge.component.html",
    styleUrls: ["./module-badge.component.scss"]
})
export class ModuleBadgeComponent
{
    /**
     * The type of the module badge. This can be a problem severity as well as "passed" (for green tick passed badges)
     * or "edit" (for edit button badges).
     */
    @Input() type: PlanProblemSeverity | "passed" | "prepone" | "edit";
}
