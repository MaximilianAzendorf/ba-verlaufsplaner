import {Component, Renderer2} from "@angular/core";
import {AuthenticationService} from "../../services/authentication.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {PlanProviderService} from "../../services/plan-provider.service";
import {UndoService} from "../../services/undo.service";
import {LocalizeFn} from "@angular/localize/init";
import {LocalizationService} from "../../services/localization.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";
import {PlanProblemsService} from "../../services/plan-problems.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * The topmost bar of the app.
 */
@Component({
    selector: "vp-top-navbar",
    templateUrl: "./top-navbar.component.html",
    styleUrls: ["./top-navbar.component.scss"]
})
export class TopNavbarComponent
{
    /**
     * Constructor used for injection.
     */
    constructor(
        public _loc: LocalizationService,
        public _auth: AuthenticationService,
        public _logic: PlanTableLogicService,
        public _planManager: PlanManagerService,
        public _planProvider: PlanProviderService,
        public _planProblems: PlanProblemsService,
        public _undo: UndoService,
        public _singleton: SingletonComponentsService,
        private _renderer: Renderer2)
    {
    }

    /**
     * The string labeling the plan dropdown.
     */
    public _planDropdownLabel(): string
    {
        if (this._planManager.activePlans.length == 1)
        {
            return this._loc.select(this._planManager.activePlans[0].name);
        }
        else if (this._planManager.activePlans.length > 1)
        {
            return $localize `Multiple courses`;
        }
        else if (this._planManager.allPlans.length > 0)
        {
            return $localize `No visible courses`;
        }
        else
        {
            return $localize `No courses`;
        }
    }

    /**
     * Forces this element do be not shown at least for a single frame by adding and immediately removing the forceHide
     * class which sets its display CSS property to none. This is used to force dropdown menus to close even if they are
     * hovered. This is kind of an ugly hack and can probably be done in a nicer way.
     */
    public _forceHide(element: HTMLElement)
    {
        this._renderer.addClass(element, "forceHide");
        setTimeout(() => this._renderer.removeClass(element, "forceHide"), 100);
    }
}
