import {Component, HostBinding, Input} from "@angular/core";
import {FailedAttemptRef} from "../../services/plan-meta.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {LocalizationService} from "../../services/localization.service";
import {ModuleAccessService} from "../../services/module-access.service";

/**
 * This component is used to display a single failed module.
 */
@Component({
    selector: "vp-failed-attempt-hint",
    templateUrl: "./failed-attempt-hint.component.html",
    styleUrls: ["./failed-attempt-hint.component.scss"]
})
export class FailedAttemptHintComponent
{
    /**
     * The attempt reference pointing to the failed attempt that should be shown.
     */
    @Input() public attemptRef: FailedAttemptRef;

    /**
     * Constructor used for injection.
     */
    constructor(
        public _loc: LocalizationService,
        public _modules: ModuleAccessService,
        private _logic: PlanTableLogicService,
        private _planChange: PlanChangeService)
    {
    }

    /**
     * Binds to the visible CSS class and is true when the hovered module is the module this failed attempt belongs do.
     */
    @HostBinding("class.visible")
    private get _isVisible()
    {
        return this._logic.hoveredModule == this.attemptRef.moduleKey;
    }

    /**
     * Deletes this failed attempt
     */
    public _delete()
    {
        let module = this._modules.get(this.attemptRef.moduleKey)
        module.failedSemesters.splice(this.attemptRef.index, 1);
        this._planChange.notifyChange(FailedAttemptHintComponent).then();
    }
}
