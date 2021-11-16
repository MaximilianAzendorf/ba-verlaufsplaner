import {Component} from "@angular/core";
import {Location} from "@angular/common";
import {AuthenticationService} from "../../services/authentication.service";
import {ActivatedRoute, Router} from "@angular/router";
import log from "loglevel";

/**
 * This component is used as a router endpoint and pulls an access token from the query parameters before redirecting
 * to the actual app.
 */
@Component({
    selector: "vp-authorized",
    template: ""
})
export class AuthorizedComponent
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _location: Location,
        private _auth: AuthenticationService)
    {
        let token = _route.snapshot.queryParamMap.get("token");
        log.info("Received authorization token");

        _auth.token = token;
        _router.navigate(["/"]).then();
        _location.replaceState("/");
    }
}
