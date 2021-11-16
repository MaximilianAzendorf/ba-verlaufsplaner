import {Component} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {LocalizeFn} from "@angular/localize/init";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This is the top-most component of the app and just contains a router outlet.
 */
@Component({
    selector: "vp-app",
    template: "<router-outlet></router-outlet>",
})
export class AppComponent
{
    constructor(
        private _title: Title)
    {
        _title.setTitle($localize `RWTH Curriculum Planner`);
    }
}
