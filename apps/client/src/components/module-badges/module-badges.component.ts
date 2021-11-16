import {Component, Input, NgZone} from "@angular/core";
import {PlanProblem, PlanProblemsService} from "../../services/plan-problems.service";
import {ModuleDescription} from "@vp/api-interfaces";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {SemesterNameService} from "../../services/semester-name.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";

/**
 * This component handles the badges that are shown above the top right corner of module components.
 */
@Component({
    selector: "vp-module-badges",
    templateUrl: "./module-badges.component.html",
    styleUrls: ["./module-badges.component.scss"]
})
export class ModuleBadgesComponent
{
    /**
     * The delay before a module moved by marking it as failed starts its blink animation, in milliseconds.
     */
    private static readonly MODULE_BLINK_DELAY = 350;

    /**
     * The module description of which the component should display the associated badges.
     */
    @Input() public moduleKey: ModuleKey;

    /**
     * Constructor used for injection.
     */
    constructor(
        public _modules: ModuleAccessService,
        public _problems: PlanProblemsService,
        public _planLogic: PlanTableLogicService,
        private _meta: PlanMetaService,
        private _change: PlanChangeService,
        private _semesterName: SemesterNameService,
        public _singleton: SingletonComponentsService,
        private _zone: NgZone)
    {
    }

    private get _module()
    {
        return this._modules.get(this.moduleKey);
    }

    /**
     * This method handles the case when the user marks the module as passed.
     */
    public _modulePassed()
    {
        this._module.passed = true;
        this._change.notifyChange(ModuleBadgesComponent).then();
    }

    /**
     * This method handles the case when the user marks the module as passed.
     */
    public _moduleResetPassed()
    {
        delete this._module.passed;
        this._change.notifyChange(ModuleBadgesComponent).then();
    }

    /**
     * This method handles the case when the user marks the module as failed.
     */
    public _moduleFailed()
    {
        if (!this._module.failedSemesters)
        {
            this._module.failedSemesters = [];
        }

        let currentSemesterName = this._semesterName.offset(
            this._meta.startSemester,
            this._meta.localToGlobalOffset(this.moduleKey));

        this._module.failedSemesters.push(currentSemesterName)

        let minDisplacement = this._semesterName.relativeOffset(currentSemesterName,
            this._semesterName.currentSemester());

        while (minDisplacement > 0)
        {
            this._module.offset += this._module.cycle;
            minDisplacement -= this._module.cycle;
        }

        this._change.notifyChange(ModuleBadgesComponent).then();

        this._zone.runOutsideAngular(() =>
        {
            setTimeout(
                () => this._planLogic.moduleComponents.get(this.moduleKey.str).blink(),
                ModuleBadgesComponent.MODULE_BLINK_DELAY);
        });
    }

    /**
     * This is used as a trackFn function for tracking plan problems.
     */
    public _problemTrackFn(index: number, item: PlanProblem): string
    {
        return item.id;
    }
}
