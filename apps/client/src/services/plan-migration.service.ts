import {Injectable} from "@angular/core";
import {PlanProviderService} from "./plan-provider.service";
import {PlanManagerService} from "./plan-manager.service";
import {patchInplace} from "@vp/utility";
import {PlanChangeService} from "./plan-change.service";

/**
 * This services provides functionality to migrate a plan to another base plan (e.g. to a newer version).
 */
@Injectable({
    providedIn: "root"
})
export class PlanMigrationService
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _planManager: PlanManagerService,
        private _planChange: PlanChangeService,
        private _planProvider: PlanProviderService)
    {
    }

    /**
     * Migrates the plan with the given ID to the base plan with the given new ID.
     * @param oldId The ID of the current plan that should be migrated.
     * @param newId The ID of the new base plan to which the plan should be migrated to.
     */
    public async migrate(oldId: string, newId: string)
    {
        let oldPlan = this._planProvider.plans.get(oldId);
        let oldUserDoc = this._planProvider.userPlanDocs.get(oldId);

        await this._planManager.removePlan(oldId);
        await this._planManager.addPlan(newId, oldPlan.startSemester);

        let newPlan = this._planProvider.plans.get(newId);
        patchInplace(newPlan, oldUserDoc.diff);

        await this._planChange.notifyChange(PlanMigrationService);
    }
}
