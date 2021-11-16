import {Component} from "@angular/core";
import {PlanProblemSeverity, PlanProblemsService} from "../../services/plan-problems.service";

/**
 * This components displays the sum of plan problems currently present.
 */
@Component({
    selector: "vp-errors-indicator",
    templateUrl: "./errors-indicator.component.html",
    styleUrls: ["./errors-indicator.component.scss"]
})
export class ErrorsIndicatorComponent
{
    /**
     * Constructor used for injection.
     */
    constructor(
        public _planProblems: PlanProblemsService)
    {
    }

    /**
     * Returns the number of problems with the given severity.
     */
    private _count(severity: PlanProblemSeverity)
    {
        return this._planProblems.problems.filter(p => p.severity == severity).length;
    }

    /**
     * Returns the number of question problems.
     */
    public _questionCount()
    {
        return this._count("question");
    }

    /**
     * Returns the number of warning problems.
     */
    public _warningCount()
    {
        return this._count("warning");
    }

    /**
     * Returns the number of error problems.
     */
    public _errorCount()
    {
        return this._count("error");
    }
}
