import {Component, Input} from "@angular/core";
import {Plan, PlanAlternative, PlanChoice} from "@vp/api-interfaces";
import {ModuleAccessService} from "../../services/module-access.service";
import {LocalizationService} from "../../services/localization.service";

@Component({
    selector: "vp-plan-choices-editor",
    templateUrl: "./plan-choices-editor.component.html",
    styleUrls: ["./plan-choices-editor.component.scss"]
})
export class PlanChoicesEditorComponent
{
    @Input() plan: Plan;

    constructor(
        private _loc: LocalizationService)
    {
    }

    public isValid()
    {
        for (let choice of Object.values(this.plan.choices))
        {
            if (!this._loc.isComplete(choice.name)) return false;

            let alternatives = Object.values(choice.alternatives);
            if (alternatives.length == 0) return false;

            for (let alternative of alternatives)
            {
                if (!this._loc.isComplete(alternative.name)) return false;
            }
        }

        return true;
    }

    _choices(): [string, PlanChoice][]
    {
        return Object.entries(this.plan.choices);
    }

    _trackFn(item)
    {
        return item[0];
    }

    _alternatives(choice: string): [string, PlanAlternative][]
    {
        return Object.entries(this.plan.choices[choice].alternatives);
    }

    _deleteChoice(id: string)
    {
        delete this.plan.choices[id];
    }

    _deleteAlternative(choiceId: string, alternativeId: string)
    {
        delete this.plan.choices[choiceId].alternatives[alternativeId];
    }

    _addChoice(choiceIdElem: HTMLInputElement)
    {
        if (!this._isValidChoiceId(choiceIdElem.value || "")) return;

        this.plan.choices[choiceIdElem.value] = {name: null, alternatives: {}};
        choiceIdElem.value = "";
    }

    _addAlternative(choiceId: string, alternativeIdElem: HTMLInputElement)
    {
        if (!this._isValidAlternativeId(choiceId, alternativeIdElem.value || "")) return;

        this.plan.choices[choiceId].alternatives[alternativeIdElem.value] = {name: null, modules: {}};
        alternativeIdElem.value = "";
    }

    _isValidAlternativeId(choiceId: string, value: string): boolean
    {
        return !!value && !(value in this.plan.choices[choiceId].alternatives);
    }

    _isValidChoiceId(value: string): boolean
    {
        return !!value && !(value in this.plan.choices);
    }
}
