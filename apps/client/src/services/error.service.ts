import {Injectable} from "@angular/core";

/**
 * This service is used to report global application errors and show them to the user. Reported errors cause the app to
 * become blocked until reload.
 */
@Injectable({
    providedIn: "root"
})
export class ErrorService
{
    /**
     * The reason or "message" of the reported error.
     */
    private _errorReason: {human: string, technical?: string};

    /**
     * The stacktrace at the time when the error got reported. This is only shown in non-production builds.
     */
    private _errorStacktrace: string;

    /**
     * Reports an error. If an error was already reported beforehand, we discard all further ones.
     */
    public report(reason: string, technicalReason: string = undefined)
    {
        if (this._errorReason) return;

        this._errorReason = {human: reason, technical: technicalReason};
        this._errorStacktrace = new Error().stack;
    }

    /**
     * Returns true if an error was reported.
     */
    public get hasError()
    {
        return this._errorReason != undefined;
    }

    /**
     * Returns the human-readable reason of the error.
     */
    public get reason()
    {
        return this._errorReason?.human;
    }

    /**
     * Returns the technical reason of the error, if applicable.
     */
    public get technicalReason()
    {
        return this._errorReason?.technical;
    }

    /**
     * Returns the error stack trace.
     */
    public get stacktrace()
    {
        return this._errorStacktrace;
    }
}
