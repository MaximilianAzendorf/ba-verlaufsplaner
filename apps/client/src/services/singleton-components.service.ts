import {Injectable} from "@angular/core";
import {PlanSettingsComponent} from "../components/plan-settings/plan-settings.component";
import {PlanAddComponent} from "../components/plan-add/plan-add.component";
import {ModuleEditComponent} from "../components/module-edit/module-edit.component";
import {ModuleAddComponent} from "../components/module-add/module-add.component";
import {BasePlanManagerComponent} from "../components/base-plan-manager/base-plan-manager.component";

/**
 * This service is used to globally access singleton components (like settings modals) from anywhere.
 */
@Injectable({
    providedIn: "root"
})
export class SingletonComponentsService
{
    public planSettings: PlanSettingsComponent;
    public planAdd: PlanAddComponent;
    public moduleEdit: ModuleEditComponent;
    public moduleAdd: ModuleAddComponent;
    public basePlanManager: BasePlanManagerComponent;
}
