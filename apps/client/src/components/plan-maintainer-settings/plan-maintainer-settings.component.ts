import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {Plan, SemesterTerm} from "@vp/api-interfaces";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {map} from "lodash";
import {PlanChoicesEditorComponent} from "../plan-choices-editor/plan-choices-editor.component";
import {LocalizationService} from "../../services/localization.service";

@Component({
    selector: "vp-plan-maintainer-settings",
    templateUrl: "./plan-maintainer-settings.component.html",
    styleUrls: ["./plan-maintainer-settings.component.scss"]
})
export class PlanMaintainerSettingsComponent
{
    @Input() plan: Plan;

    _categoriesShown: boolean;
    _choicesShown: boolean;

    @ViewChild("choicesEditor", {static: false, read: PlanChoicesEditorComponent}) _choicesEditor: PlanChoicesEditorComponent;

    constructor(
        private _loc: LocalizationService,
        private _modules: ModuleAccessService)
    {
    }

    public isValid()
    {
        return this._loc.isComplete(this.plan.name)
            && this._validVersion()
            && this._validStartTerms()
            && this._validCategories()
            && (!this._choicesEditor || this._choicesEditor.isValid());
    }

    _validVersion()
    {
        return !!this.plan.version;
    }

    _validStartTerms()
    {
        return this.plan.startTerms.length > 0;
    }

    _validCategories()
    {
        for (let category of this.plan.categories)
        {
            if (!this._loc.isComplete(category)) return false;
        }

        return true;
    }

    _setStartTerm(term: SemesterTerm, value: boolean)
    {
        if (value && !this.plan.startTerms.includes(term))
        {
            this.plan.startTerms.push(term);
            this.plan.startTerms = this.plan.startTerms.sort();
        }
        else if (!value && this.plan.startTerms.includes(term))
        {
            this.plan.startTerms = this.plan.startTerms.filter(t => t != term);
        }
    }

    _setMigratableTo(listString: string)
    {
        this.plan.migratableTo = listString.match(/^\s*$/)
            ? []
            : listString.split(", ").map(t => t.trim());
    }

    _addCategory()
    {
        this.plan.categories.push("");
    }

    public _dragDropped(event: CdkDragDrop<number>): void
    {
        let fromIndex = event.previousIndex;
        let toIndex = event.currentIndex;

        let element = this.plan.categories.splice(fromIndex, 1)[0];
        this.plan.categories.splice(toIndex, 0, element);

        for (let moduleKey of this._modules.moduleKeysOfPlan(this.plan, true))
        {
            let module = this._modules.getFrom(this.plan, moduleKey);
            if (module.category == null) continue;

            if (module.category == fromIndex)
            {
                module.category = toIndex;
                continue;
            }

            if (module.category > fromIndex) module.category--;
            if (module.category >= toIndex) module.category++;
        }
    }

    _deleteCategory(index: number)
    {
        this.plan.categories.splice(index, 1);

        for (let moduleKey of this._modules.moduleKeysOfPlan(this.plan, true))
        {
            let module = this._modules.getFrom(this.plan, moduleKey);
            if (module.category == null) continue;

            if (module.category > index) module.category--;
        }
    }
}
