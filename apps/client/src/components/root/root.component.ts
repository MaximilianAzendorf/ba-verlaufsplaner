import {AfterViewInit, ChangeDetectorRef, Component, DoCheck, Inject, ViewChild} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {PlanProviderService} from "../../services/plan-provider.service";
import {AuthenticationService} from "../../services/authentication.service";
import {ErrorService} from "../../services/error.service";
import {environment} from "../../environments/environment";
import {UndoService} from "../../services/undo.service";
import {PlanSettingsComponent} from "../plan-settings/plan-settings.component";
import {PlanAddComponent} from "../plan-add/plan-add.component";
import {SingletonComponentsService} from "../../services/singleton-components.service";
import log from "loglevel";
import {PlanChangeService} from "../../services/plan-change.service";
import {PlanManagerService} from "../../services/plan-manager.service";
import {PlanMetaService} from "../../services/plan-meta.service";
import {ModuleEditComponent} from "../module-edit/module-edit.component";
import {ModuleAddComponent} from "../module-add/module-add.component";
import {InitService} from "../../services/init.service";
import {BasePlanManagerComponent} from "../base-plan-manager/base-plan-manager.component";

/**
 * This component is the root component of the actual application.
 */
@Component({
    selector: "vp-root",
    templateUrl: "./root.component.html",
    styleUrls: ["./root.component.scss"]
})
export class RootComponent implements AfterViewInit, DoCheck
{
    /**
     * This is true if this is a production build.
     */
    public readonly _production = environment.production;

    /**
     * A view child for the singleton plan settings component.
     * @private
     */
    @ViewChild("planSettings", {
        static: true,
        read: PlanSettingsComponent
    })
    private _planSettings: PlanSettingsComponent;

    /**
     * A view child for the singleton plan add component.
     * @private
     */
    @ViewChild("planAdd", {
        static: true,
        read: PlanAddComponent
    })
    private _planAdd: PlanAddComponent;

    /**
     * A view child for the singleton module edit component.
     * @private
     */
    @ViewChild("moduleEdit", {
        static: true,
        read: ModuleEditComponent
    })
    private _moduleEdit: ModuleEditComponent;

    /**
     * A view child for the singleton module add component.
     * @private
     */
    @ViewChild("moduleAdd", {
        static: true,
        read: ModuleAddComponent
    })
    private _moduleAdd: ModuleAddComponent;

    /**
     * A view child for the singleton base plan manager component.
     * @private
     */
    @ViewChild("basePlanManager", {
        static: true,
        read: BasePlanManagerComponent
    })
    private _basePlanManager: BasePlanManagerComponent;

    public _initialized = false;

    /**
     * Constructor used for injection.
     */
    constructor(
        @Inject(DOCUMENT) private document: Document,
        private _init: InitService,
        public _error: ErrorService,
        public _planProvider: PlanProviderService,
        public _planManager: PlanManagerService,
        private _planMeta: PlanMetaService,
        public _planChange: PlanChangeService,
        public _authentication: AuthenticationService,
        private _singleton: SingletonComponentsService,
        private _changeDetector: ChangeDetectorRef)
    {
        _planProvider.dbChange.subscribe(() => _changeDetector.detectChanges());
    }

    /**
     * Removes access tokens and reloads the page.
     */
    public _reload()
    {
        this._authentication.logout();
        window.location.reload();
    }

    ngAfterViewInit()
    {
        this._singleton.planSettings = this._planSettings;
        this._singleton.planAdd = this._planAdd;
        this._singleton.moduleEdit = this._moduleEdit;
        this._singleton.moduleAdd = this._moduleAdd;
        this._singleton.basePlanManager = this._basePlanManager;

        this._planChange.planChanged.subscribe(RootComponent, "last", _ =>
        {
            log.debug("Detecting changes after plan change");
            this._changeDetector.detectChanges()
        });

        if (this._authentication.ready)
        {
            this._init.init().then(() => this._changeDetector.detectChanges());
        }
    }

    // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
    ngDoCheck()
    {
        //log.debug("Change detection cycle");
    }
}
