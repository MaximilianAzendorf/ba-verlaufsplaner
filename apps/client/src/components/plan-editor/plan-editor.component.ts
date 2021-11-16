import {Component} from "@angular/core";
import {AuthenticationService} from "../../services/authentication.service";
import {InitService} from "../../services/init.service";

/**
 * The plan editor component consists of the plan table itself as well as the plan action bar.
 */
@Component({
    selector: "vp-plan-editor",
    templateUrl: "./plan-editor.component.html",
    styleUrls: ["./plan-editor.component.scss"]
})
export class PlanEditorComponent
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _init: InitService,
        public _authentication: AuthenticationService)
    {
    }

    public _confirmLocal()
    {
        this._authentication.localConfirmed = true;
        this._init.init().then();
    }
}
