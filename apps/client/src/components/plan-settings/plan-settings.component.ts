import {Component, ElementRef, ViewChild} from "@angular/core";
import {Plan, PlanAlternative, PlanChoice, PlanDocHeader} from "@vp/api-interfaces";
import {PlanChangeService} from "../../services/plan-change.service";
import {Editable} from "@vp/utility";
import {PlanProviderService} from "../../services/plan-provider.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {LocalizationService} from "../../services/localization.service";
import {PlanMigrationService} from "../../services/plan-migration.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {ModuleAccessService} from "../../services/module-access.service";
import {PlanMaintainerSettingsComponent} from "../plan-maintainer-settings/plan-maintainer-settings.component";

/**
 * This component is a modal for adjusting various settings of a plan.
 */
@Component({
    selector: "vp-plan-settings",
    templateUrl: "./plan-settings.component.html",
    styleUrls: ["./plan-settings.component.scss"]
})
export class PlanSettingsComponent
{
    /**
     * The plan that is edited. We use an Editable wrapper so changes are only made when we confirm them.
     */
    public _plan: Editable<Plan> = new Editable<Plan>(null);

    /**
     * This is true when the user has clicked on the "Remove Plan" button. When this is set to true, the confirmation
     * modal is shown.
     */
    public _askForDeletion: boolean;

    /**
     * This is set to true when we are currently waiting on a migration promise to finisch.
     */
    public _isMigrating: boolean;

    /**
     * This is the list of plan headers of all plans that we can migrate this plan to.
     */
    public _migratablePlanHeaders: PlanDocHeader[] = [];

    /**
     * The ID of the selected migration plan.
     */
    public _migrateId: string;

    /**
     * A view child for the modal.
     */
    @ViewChild("modal", {static: true}) _modal: ElementRef;

    @ViewChild("maintainerSettings", {static: false, read: PlanMaintainerSettingsComponent})
        _maintainerSettings: PlanMaintainerSettingsComponent;

    /**
     * The plan that is edited.
     */
    get plan()
    {
        return this._plan.original;
    }

    /**
     * Constructor used for injection.
     */
    constructor(
        public _loc: LocalizationService,
        private _modules: ModuleAccessService,
        public _tableLogic: PlanTableLogicService,
        private _planManager: PlanManagerService,
        public _planChange: PlanChangeService,
        private _planProvider: PlanProviderService,
        private _migration: PlanMigrationService)
    {
    }

    /**
     * When this method is called, the modal is shown and the given plan is set as the active plan to be edited.
     */
    public show(plan: Plan)
    {
        this._migrateId = null;
        this._plan = new Editable<Plan>(plan);
        setTimeout(() => this._modal.nativeElement.focus(), 0);

        if (this.plan?.migratableTo)
        {
            this._planProvider.getAllBasePlanHeaders().then(headers =>
            {
                this._migratablePlanHeaders = headers.filter(h =>
                {
                    return this.plan.migratableTo.includes(h._id)
                        && (!h.obsoleteAfter || new Date(h.obsoleteAfter) > new Date())
                });
            });
        }
    }

    /**
     * Closes the settings modal.
     */
    public close()
    {
        this._plan = new Editable<Plan>(null);
    }

    /**
     * Returns all choices of the current plan.
     */
    public _getAllChoices(): PlanChoice[]
    {
        return Object.values(this._plan.object.choices);
    }

    /**
     * Returns the active alternative of the given choice, or null if there is none.
     */
    public _getActiveAlternative(choice: PlanChoice): string
    {
        for (let [key, value] of Object.entries(choice.alternatives))
        {
            if (value.active) return key;
        }

        return null;
    }

    /**
     * Returns all alternatives of the given choice as tuples (key, alternative).
     */
    public _getAllAlternatives(choice: PlanChoice): [string, PlanAlternative][]
    {
        let res: [string, PlanAlternative][] = [];
        for (let [key, value] of Object.entries(choice.alternatives))
        {
            res.push([key, value]);
        }
        return res;
    }

    /**
     * Changes the active alternative of the given choice to the one with the given ID.
     */
    public _setActiveAlternative(choice: PlanChoice, activeKey: string): void
    {
        for (let [key, value] of Object.entries(choice.alternatives))
        {
            if (key == activeKey)
            {
                value.active = true;
            }
            else if (value.active)
            {
                delete value.active;
            }
        }

        this._planChange.notifyChange(PlanSettingsComponent).then();
    }

    public isValid()
    {
        return !this._maintainerSettings || this._maintainerSettings.isValid();
    }

    /**
     * Begins the deletion of the current plan by showing the confirmation modal.
     */
    public _delete()
    {
        this._askForDeletion = true;
    }

    /**
     * Cancels the current deletion process. This is called when the user cancels the deletion by rejecting the
     * confirmation modal.
     */
    public _cancelDelete()
    {
        this._askForDeletion = false;
    }

    /**
     * Confirms the deletion process and actually deletes the plan.This is called when the user confirms the
     * confirmation modal.
     */
    public async _confirmDelete()
    {
        this._askForDeletion = false;
        await this._planManager.removePlan(this.plan._id);
        this._planChange.notifyChange(PlanSettingsComponent).then();
        this.close();
    }

    /**
     * Applies the changed settings so they get written to the actual current plan.
     */
    public _apply()
    {
        this._modules.clearCache();
        if (this._plan.apply())
        {
            this._planChange.notifyChange(PlanSettingsComponent).then();
        }
        this.close();
    }

    /**
     * Migrates the given plan to the selected new base plan.
     */
    async _migrate()
    {
        this._isMigrating = true;
        await this._migration.migrate(this.plan._id, this._migrateId);
        this._isMigrating = false;
        this.close();
    }
}
