import {Inject, Injectable, LOCALE_ID} from "@angular/core";
import {decode, Jwt} from "jsonwebtoken";
import {UserRoles} from "@vp/api-interfaces";

/**
 * This service handles the client side of the authentication process.
 */
@Injectable({
    providedIn: "root"
})
export class AuthenticationService
{
    /**
     * The storage key under which the access token is stored in the session storage.
     */
    private static readonly STORAGE_TOKEN_KEY = "auth_token";
    /**
     * The storage key under which the access token is stored in the session storage.
     */
    private static readonly STORAGE_LOCAL_CONFIRMED_KEY = "local_confirmed";

    /**
     * The access token.
     */
    private _token: string;

    /**
     * This is set to true if the user has confirmed that he wants to try the app out locally.
     */
    private _localConfirmed: boolean;

    public set localConfirmed(value: boolean)
    {
        window.sessionStorage.setItem(AuthenticationService.STORAGE_LOCAL_CONFIRMED_KEY, JSON.stringify(value));
        this._localConfirmed = value;
    }

    public get localConfirmed()
    {
        return this._localConfirmed || false;
    }

    /**
     * Constructs the service and looks for a token in the session storage.
     */
    constructor(
        @Inject(LOCALE_ID) private _locale: string)
    {
        this._token = window.sessionStorage.getItem(AuthenticationService.STORAGE_TOKEN_KEY);
        this._localConfirmed = window.sessionStorage.getItem(AuthenticationService.STORAGE_LOCAL_CONFIRMED_KEY) === "true";
    }

    /**
     * This method redirects to the server-side authorization endpoint.
     */
    public authenticate(): void
    {
        window.location.href = `../api/user/authorize?lang=${this._locale}`;
    }

    /**
     * Deletes the access token and reloads the page.
     */
    public logout(): void
    {
        window.sessionStorage.removeItem(AuthenticationService.STORAGE_TOKEN_KEY);
        window.sessionStorage.removeItem(AuthenticationService.STORAGE_LOCAL_CONFIRMED_KEY);
        window.location.reload();
    }

    /**
     * Sets the access token and stores it in the session storage.
     */
    public set token(value: string)
    {
        this._token = value;
        window.sessionStorage.setItem(AuthenticationService.STORAGE_TOKEN_KEY, this._token);
    }

    /**
     * Returns the access token.
     */
    public get token(): string
    {
        return this._token;
    }

    /**
     * Returns true if there is an authentication token.
     */
    public get isAuthenticated(): boolean
    {
        return this._token != undefined;
    }

    public get ready(): boolean
    {
        return this.isAuthenticated || this.localConfirmed;
    }

    /**
     * Returns the decoded authentication token.
     */
    public get decodedToken(): Jwt
    {
        return !this._token ? null : decode(this._token, {complete: true});
    }

    /**
     * Returns the username that is authenticated by the authentication token.
     */
    public get username(): string
    {
        return this.decodedToken?.payload?.sub;
    }

    /**
     * Returns true if the authenticated user is a maintainer.
     */
    public get isMaintainer(): boolean
    {
        return this.decodedToken?.payload["_couchdb.roles"].includes(UserRoles.Maintainer);
    }
}
