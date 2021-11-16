import {Injectable} from "@angular/core";
import {PlanProviderService} from "./plan-provider.service";
import {ModuleSortingService} from "./module-sorting.service";
import {ClassObject} from "@vp/api-interfaces";
import log from "loglevel";
import {TopologicalEmitter} from "@vp/utility";

/**
 * This service is used to signal changes in the plan so that these changes can be pushed to the backend after being
 * pre-processed by this service aswell as providing a event emitter that gets triggered on changes.
 */
@Injectable({
    providedIn: "root"
})
export class PlanChangeService
{
    /**
     * This event emitter gets triggered every time there is a plan change, but before the provider is informed. This
     * allows for the execution of pre-processing steps.
     */
    public readonly planChangedBeforeProvider: TopologicalEmitter<ClassObject> = new TopologicalEmitter();

    /**
     * This event emitter gets triggered every time there is a plan change, but after the provider is informed and has
     * done its work.
     */
    public readonly planChangedAfterProvider: TopologicalEmitter<ClassObject> = new TopologicalEmitter();

    /**
     * This event emitter gets triggered every time there is a plan change, after the provider is informed.
     */
    public readonly planChanged: TopologicalEmitter<ClassObject> = new TopologicalEmitter();

    private _lastChangePromise: Promise<void> = Promise.resolve();
    private _lastPromiseRunning = false;

    /**
     * Constructor used for injection
     */
    constructor(
        private _planProvider : PlanProviderService,
        private _moduleSorting : ModuleSortingService)
    {
        _planProvider.dbChange.subscribe(() => this.notifyChange(PlanProviderService));
    }

    /**
     * This method should be called whenever the plan was modified and will ensure that the modifications are pushed to
     * the backend.
     */
    public async notifyChange(origin: ClassObject, notifyProvider = true): Promise<void>
    {
        if (this._lastPromiseRunning)
        {
            log.warn("Plan changes are too fast; waiting for last change promise.");
        }
        await this._lastChangePromise;

        await this.planChangedBeforeProvider.emit(origin);

        let providerPromise: Promise<void> = notifyProvider ? this._planProvider.notifyChange() : Promise.resolve();

        this._lastPromiseRunning = true;
        this._lastChangePromise = providerPromise
            .then(() =>
            {
                return this.planChangedAfterProvider.emit(origin);
            })
            .finally(() =>
            {
                this._lastPromiseRunning = false;
            });

        await this.planChanged.emit(origin);

        return this._lastChangePromise;
    }
}
