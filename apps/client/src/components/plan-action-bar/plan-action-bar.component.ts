import {Component} from "@angular/core";
import {PlanManagerService} from "../../services/plan-manager.service";
import {PlanGroupingMode} from "../../enums/plan-grouping-mode";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {AuthenticationService} from "../../services/authentication.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";

/**
 * This component is the second toolbar of the app, containing options regarding the visual appereance of the plan
 * table.
 */
@Component({
    selector: "vp-plan-action-bar",
    templateUrl: "./plan-action-bar.component.html",
    styleUrls: ["./plan-action-bar.component.scss"]
})
export class PlanActionBarComponent
{
    /**
     * This is true if the compact view option is selected.
     */
    public compact = false;

    /**
     * Enum reference for template access.
     */
    public _planGroupingModes = PlanGroupingMode;

    /**
     * Constructor used for injection.
     */
    constructor(
        public _auth: AuthenticationService,
        public _tableLogic: PlanTableLogicService,
        public _planManager: PlanManagerService,
        public _singleton: SingletonComponentsService)
    {
    }
}
