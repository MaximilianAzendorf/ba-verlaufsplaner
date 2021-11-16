import {Component, EventEmitter, Input, Output} from "@angular/core";
import {SemesterName, SemesterTerm} from "@vp/api-interfaces";
import {SemesterNameService} from "../../services/semester-name.service";

/**
 * This component is an inline input field for a single semester name.
 */
@Component({
    selector: "vp-semester-input",
    templateUrl: "./semester-input.component.html",
    styleUrls: ["./semester-input.component.scss"]
})
export class SemesterInputComponent
{
    /**
     * The minimum year allowed as the year of the semester name.
     */
    public readonly _minYear = new Date().getFullYear() - 40;

    /**
     * The maximum year allowed as the year of the semester name.
     */
    public readonly _maxYear = new Date().getFullYear() + 40;

    /**
     * The semester name that is currently put in to the component.
     * @private
     */
    private _semester: SemesterName;

    /**
     * The allowed terms. Only terms contained in this array are valid.
     */
    private _allowedTerms: SemesterTerm[] = ["winter", "summer"];

    /**
     * The output emitter for the semester name.
     */
    @Output() readonly semesterChange = new EventEmitter<SemesterName>();

    /**
     * Sets the allowed terms of the component.
     */
    @Input() set allowedTerms(value: SemesterTerm[])
    {
        if (value.length == 0) throw Error("At least one term must be allowed.");

        this._allowedTerms = value;
        this._fixSemester();
    }

    get allowedTerms()
    {
        return this._allowedTerms;
    }

    /**
     * Sets the semester of the component.
     */
    @Input() set semester(value: SemesterName)
    {
        this._semester = {term: value.term, year: value.year};
        this._fixSemester();
    }

    get semester()
    {
        return this._semester;
    }

    /**
     * Constructor used for injection.
     */
    constructor(
        private _semesterName: SemesterNameService)
    {
    }

    /**
     * Fixes the term by moving it to an allowed one if the current one is not allowed.
     */
    private _fixSemester()
    {
        if (!this._semester) return;
        if (!this.allowedTerms.includes(this._semester.term))
        {
            this._semester = this._semesterName.offset(this._semester, 1);
            this.semesterChange.emit(this.semester);
        }
    }

    /**
     * Checks the validity of the semester name and emits the change emitter.
     */
    public _checkAndEmit()
    {
        if (this.semester.year < this._minYear || this.semester.year > this._maxYear) return;

        this.semesterChange.emit(this.semester);
    }
}
