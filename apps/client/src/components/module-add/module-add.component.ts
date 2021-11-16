import { Component, OnInit } from "@angular/core";
import {PlanProviderService} from "../../services/plan-provider.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {ModuleDescription, Plan} from "@vp/api-interfaces";
import {LocalizationService} from "../../services/localization.service";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {SingletonComponentsService} from "../../services/singleton-components.service";

type SubPlan = {choiceId: string, alternativeId: string};

@Component({
    selector: "vp-module-add",
    templateUrl: "./module-add.component.html",
    styleUrls: ["./module-add.component.scss"]
})
export class ModuleAddComponent
{
    /**
     * This is true when the modal is currently active and visible.
     */
    public _visible: boolean;

    public _selectedPlan: Plan;

    public _selectedSubplan: SubPlan;

    public _moduleId: string;

    constructor(
        public _loc: LocalizationService,
        public _manager: PlanManagerService,
        public _modules: ModuleAccessService,
        private _singleton: SingletonComponentsService)
    {
    }

    /**
     * Shows the modal.
     */
    public show()
    {
        this._selectedPlan = this._manager.activePlans[0];
        this._selectedSubplan = null;
        this._moduleId = "";
        this._visible = true;
    }

    /**
     * Closes the modal.
     */
    public close()
    {
        this._visible = false;
    }

    public get _subPlans(): SubPlan[]
    {
        let subPlans: SubPlan[] = [];

        for (let choiceId of Object.keys(this._selectedPlan.choices))
        {
            for (let altId of Object.keys(this._selectedPlan.choices[choiceId].alternatives))
            {
                subPlans.push({choiceId: choiceId, alternativeId: altId});
            }
        }

        return subPlans;
    }

    _subPlanComparison(a: SubPlan, b: SubPlan)
    {
        if (a == null || b == null) return a == b;
        return a.alternativeId == b.alternativeId && a.choiceId == b.choiceId;
    }

    /**
     * Adds a new module at the specified position.
     */
    _add()
    {
        let key = new ModuleKey(this._selectedPlan._id,
            this._selectedSubplan?.choiceId,
            this._selectedSubplan?.alternativeId,
            this._moduleId);

        let desc: ModuleDescription = {
            name: null,
            ects: null,
            category: -1,
            offset: 0,
            cycle: null,
            requirements: []
        };

        this._modules.add(key, desc, false);
        this.close();
        this._singleton.moduleEdit.show(key);
    }

    _validId()
    {
        if (!this._selectedPlan) return false;

        if (this._modules.moduleKeysOfPlan(this._selectedPlan).find(k => k.moduleId == this._moduleId))
        {
            return false;
        }

        return !!this._moduleId && this._moduleId.match(/^[a-zA-Z]/);
    }

    _isValid()
    {
        return this._validId();
    }
}
