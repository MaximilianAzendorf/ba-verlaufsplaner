import {AfterViewInit, Component, OnInit} from "@angular/core";
import {PlanManagerService} from "../../services/plan-manager.service";
import {LocalizationService} from "../../services/localization.service";
import {Plan, PlanDoc, PlanDocHeader, TEMPLATE_PLAN_PREFIX} from "@vp/api-interfaces";
import {PlanProviderService} from "../../services/plan-provider.service";
import {cloneDeep} from "lodash";

@Component({
    selector: "vp-base-plan-manager",
    templateUrl: "./base-plan-manager.component.html",
    styleUrls: ["./base-plan-manager.component.scss"]
})
export class BasePlanManagerComponent implements AfterViewInit
{
    /**
     * This is true when the modal is currently active and visible.
     */
    public _visible: boolean;

    public _selectedPlan: Plan = null;

    public _confirmPublish = false;
    public _confirmUpdate = false;
    public _confirmAdd = false;
    public _confirmDelete = false;

    public _newId: string;
    public _newIdConfirm: string;

    public _waitingForReload = false;

    private _basePlanHeaders: PlanDocHeader[];

    /**
     * Constructor used for injection.
     */
    constructor(
        public _loc: LocalizationService,
        private _provider: PlanProviderService,
        public _manager: PlanManagerService)
    {
    }

    private _reset()
    {
        this._selectedPlan = null;
        this._confirmUpdate = false;
        this._confirmAdd = false;
        this._confirmDelete = false;
    }

    /**
     * Shows the modal.
     */
    public show()
    {
        this._reset();
        this._visible = true;
    }

    /**
     * Closes the modal.
     */
    public close()
    {
        this._reset();
        this._visible = false;
    }

    public _validId(): boolean
    {
        if (!this._basePlanHeaders) return false;

        return this._newId != ""
            && this._newId != null
            && this._newId == this._newIdConfirm
            && !this._basePlanHeaders.find(h => h._id == this._newId);
    }

    async ngAfterViewInit()
    {
        await this._provider.ready;
        this._basePlanHeaders = await this._provider.getAllBasePlanHeaders();
    }

    _prepare()
    {
        delete this._selectedPlan.startSemester;

        for (let choice of Object.values(this._selectedPlan.choices))
        {
            for (let alternative of Object.values(choice.alternatives))
            {
                delete alternative.active;
            }
        }
    }

    async _add()
    {
        try
        {
            this._prepare();
            this._selectedPlan.published = false;
            let newBasePlan = cloneDeep(this._selectedPlan) as PlanDoc;
            delete newBasePlan._rev;
            newBasePlan._id = this._newId;

            await this._manager.removePlan(this._selectedPlan._id);
            await this._provider.notifyChange();
            await this._provider.putBasePlan(newBasePlan);
        }
        finally
        {
            location.reload();
        }
    }

    async _publish()
    {
        this._selectedPlan.published = true;
        await this._update();
    }

    async _update()
    {
        try
        {
            this._prepare();
            await this._manager.removePlan(this._selectedPlan._id);
            await this._provider.notifyChange();
            await this._provider.putBasePlan(this._selectedPlan as PlanDoc);
        }
        finally
        {
            location.reload()
        }
    }

    async _delete()
    {
        try
        {
            this._prepare();
            await this._manager.removePlan(this._selectedPlan._id);
            await this._provider.notifyChange();
            await this._provider.deleteBasePlan(this._selectedPlan as PlanDoc & { _rev: string });
        }
        finally
        {
            location.reload();
        }
    }

    templateSelected()
    {
        return this._selectedPlan._id.startsWith(TEMPLATE_PLAN_PREFIX);
    }
}
