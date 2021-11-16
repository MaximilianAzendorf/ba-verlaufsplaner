import {Component, ElementRef, ViewChild} from "@angular/core";
import {PlanProviderService} from "../../services/plan-provider.service";
import {SemesterNameService} from "../../services/semester-name.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {PlanChangeService} from "../../services/plan-change.service";
import {LocalizationService} from "../../services/localization.service";
import {PlanDocHeader, SemesterTerm, TEMPLATE_PLAN_PREFIX} from "@vp/api-interfaces";
import {isEmpty, uniq} from "lodash";
import {SingletonComponentsService} from "../../services/singleton-components.service";
import {AuthenticationService} from "../../services/authentication.service";

/**
 * A modal for adding new plans to the user plans.
 */
@Component({
    selector: "vp-plan-add",
    templateUrl: "./plan-add.component.html",
    styleUrls: ["./plan-add.component.scss"]
})
export class PlanAddComponent
{
    /**
     * This is true when the modal is currently active and visible.
     */
    public _visible: boolean;

    /**
     * All available base plan headers.
     */
    private _headers: PlanDocHeader[];

    /**
     * The current base plan map. This map maps each plan name present in the base plan headers to a list of available
     * versions and their corresponding plan IDs.
     */
    private _basePlanMap: Map<string, {version: string, startTerms: SemesterTerm[], id: string}[]>;

    /**
     * This is true as long as the base plan headers have not finished fetching.
     */
    public _loading = true;

    /**
     * This is true if we are currently waiting for a pending plan add promise.
     */
    public _adding = false;

    /**
     * The selected plan name.
     */
    public _selectedName: string = null;

    /**
     * The selected plan version.
     */
    public _selectedVersion: string = null;

    /**
     * The selected start semester.
     */
    public _startSemester = this._semesterName.currentSemester();

    /**
     * A view child for the modal.
     */
    @ViewChild("modal") _modal: ElementRef;

    /**
     * Constructor used for injection. Also starts fetching all base plan headers.
     */
    constructor(
        public _auth: AuthenticationService,
        private _loc: LocalizationService,
        private _planManager: PlanManagerService,
        private _planChange: PlanChangeService,
        public _planProvider: PlanProviderService,
        private _semesterName: SemesterNameService,
        private _singleton: SingletonComponentsService)
    {
        this._basePlanMap = new Map();

        this._planProvider.ready.then(() => this._planProvider.getAllBasePlanHeaders()).then(headers =>
        {
            this._headers = headers;
            this._loading = false;
        });
    }

    /**
     * Shows the add modal after construction the current base plan map. Because that map depends on the already
     * added plans of the user (because we don't want to show plans that are already present), we have to recalculate
     * this map every time we show this modal.
     */
    public show()
    {
        this._basePlanMap.clear();
        let existingNames = uniq(this._planManager.allPlans.map(p => this._loc.select(p.name)));

        for (let header of this._headers)
        {
            if (header._id.startsWith(TEMPLATE_PLAN_PREFIX) && !this._auth.isMaintainer) continue;

            if (this._planManager.allPlans.find(p => p._id == header._id)) continue;
            if (existingNames.includes(this._loc.select(header.name))) continue;
            if (header.obsoleteAfter && new Date(header.obsoleteAfter) <= new Date() && !this._auth.isMaintainer) continue;
            if (!header.published  && !this._auth.isMaintainer) continue;

            let locName = this._loc.select(header.name);
            if (!this._basePlanMap.has(locName))
            {
                this._basePlanMap.set(locName, []);
            }

            this._basePlanMap.get(locName).push({
                version: header.version,
                startTerms: header.startTerms,
                id: header._id
            });
        }

        this._adding = false;
        this._selectedName = this._selectedVersion = null;
        this._visible = true;

        setTimeout(() => this._modal.nativeElement.focus());
    }

    /**
     * Closes the add modal.
     */
    public close()
    {
        this._visible = false;
    }

    /**
     * This is called whenever the user selects a new plan name. It looks up the available versions and automatically
     * selects it if there is only one.
     */
    public _nameChanged()
    {
        let versions = this._versionsOfPlan(this._selectedName);
        this._selectedVersion = versions.length == 1 ? versions[0] : null;
    }

    /**
     * Returns all available plan names.
     */
    public get _names(): string[]
    {
        return Array.from(this._basePlanMap.keys()).sort();
    }

    /**
     * Returns all available versions of plans with the given name.
     */
    public _versionsOfPlan(name: string): string[]
    {
        return this._basePlanMap.get(name).map(v => v.version).sort().reverse();
    }

    /**
     * Returns the plan ID of the plan with the given name and version.
     */
    public _IdOfPlanVersion(name: string, version: string): string
    {
        return this._basePlanMap.get(name).find(v => v.version == version).id;
    }

    /**
     * Returns the allowed start terms of the selected plan.
     */
    public _allowedTerms(): SemesterTerm[]
    {
        if (!this._selectedName || !this._selectedVersion) return ["summer", "winter"];
        return this._basePlanMap.get(this._selectedName).find(v => v.version == this._selectedVersion).startTerms;
    }

    /**
     * Adds the selected plan.
     */
    public async _add(): Promise<void>
    {
        if (!this._selectedName || !this._selectedVersion || this._adding) return;
        this._adding = true;
        let planId = this._IdOfPlanVersion(this._selectedName, this._selectedVersion);
        await this._planManager.addPlan(planId, this._startSemester);
        this._planChange.notifyChange(PlanAddComponent).then();

        this.close();
        this._adding = false;

        let plan = this._planManager.allPlans.find(p => p._id == planId);

        if (!isEmpty(plan.choices))
        {
            this._singleton.planSettings.show(plan);
        }
    }
}
