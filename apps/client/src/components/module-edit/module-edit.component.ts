import {Component, Input, OnInit} from "@angular/core";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {LocalizationService} from "../../services/localization.service";
import {PlanProviderService} from "../../services/plan-provider.service";
import {ModuleDescription} from "@vp/api-interfaces";
import {Editable} from "@vp/utility";
import {PlanChangeService} from "../../services/plan-change.service";
import {sortBy, every} from "lodash";

@Component({
    selector: "vp-module-edit",
    templateUrl: "./module-edit.component.html",
    styleUrls: ["./module-edit.component.scss"]
})
export class ModuleEditComponent
{
    private _moduleKey: ModuleKey;
    public _module: Editable<ModuleDescription>;

    get moduleKey(): ModuleKey
    {
        return this._moduleKey;
    }

    constructor(
        public _loc: LocalizationService,
        public _modules: ModuleAccessService,
        public _provider: PlanProviderService,
        private _change: PlanChangeService)
    {
    }

    public get module()
    {
        return this._module.object;
    }

    public show(moduleKey: ModuleKey)
    {
        this._moduleKey = moduleKey;
        this._module = new Editable(this._modules.get(this._moduleKey));
    }

    public close()
    {
        if (!this._module.original.name)
        {
            this._modules.delete(this._moduleKey);
        }

        this._moduleKey = null;
        this._module = null;
    }

    public _delete()
    {
        this._modules.delete(this.moduleKey);
        this.close();
    }

    public get _reqSelectKeys(): ModuleKey[]
    {
        let keys =  this._modules.moduleKeysOfPlan(this._provider.plans.get(this.moduleKey.planId), true);
        keys = keys.filter(k => !k.equals(this.moduleKey));

        return sortBy(keys, k => this._loc.select(this._modules.get(k).name));
    }

    _apply()
    {
        if (!this._isValid()) return;

        this._module.apply();
        this._change.notifyChange(ModuleEditComponent).then();
        this.close();
    }

    _removeReq(requirement: {moduleId: string, required: boolean}): void
    {
        this.module.requirements = this.module.requirements.filter(r => r != requirement);
    }

    _addReq(): void
    {
        this.module.requirements.push({moduleId: null, required: false});
    }

    _validEcts()
    {
        return this.module.ects != null;
    }

    _validCycle()
    {
        return this.module.cycle != null;
    }

    _validCategory()
    {
        return true;
    }

    _validRequirement(requirement: { moduleId: string; required: boolean })
    {
        return requirement.moduleId != null;
    }

    _isValid(): boolean
    {
        return this._validEcts()
            && this._validCycle()
            && this._validCategory()
            && every(this.module.requirements, r => this._validRequirement(r));
    }
}
