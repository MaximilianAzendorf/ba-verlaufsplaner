import { Injectable } from "@angular/core";
import log from "loglevel";
import {PlanProviderService} from "./plan-provider.service";
import {PlanManagerService} from "./plan-manager.service";

@Injectable({
    providedIn: "root"
})
export class InitService
{
    private _initialized = false;

    public get initialized(): boolean
    {
        return this._initialized;
    }

    constructor(
        private _planManager: PlanManagerService,
        private _planProvider: PlanProviderService)
    {
    }

    public async init(): Promise<void>
    {
        this._planProvider.initialize();
        await this._planProvider.ready

        for (let plan of this._planManager.allPlans)
        {
            this._planManager.activatePlan(plan);
        }

        this._initialized = true;
    }
}
