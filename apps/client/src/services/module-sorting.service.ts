import {Injectable} from "@angular/core";
import {ModuleDescription} from "@vp/api-interfaces";
import shallowEqual from "shallowequal";
import {LocalizationService} from "./localization.service";

/**
 * This service provides functionality to handle ordering of module collections as well as the reflection of that
 * ordering through the sortKey property of the module descriptions.
 */
@Injectable({
    providedIn: "root"
})
export class ModuleSortingService
{
    constructor(
        private _loc: LocalizationService)
    {
    }

    /**
     * This function is used as a sorting function for module descriptions that is solely based on the module
     * description itself, disregarding sort keys.
     */
    public lexicalModuleSortFn(a: ModuleDescription, b: ModuleDescription)
    {
        let aName = this._loc.select(a.name);
        let bName = this._loc.select(b.name);
        if (aName == bName)
        {
            if (a.ects == b.ects)
            {
                return JSON.stringify(a) < JSON.stringify(b) ? -1 : 1;
            }
            return a.ects - b.ects;
        }
        return aName < bName ? -1 : 1;
    }

    /**
     * This function is used as a sorting function for module descriptions. We especially have to account for the fact
     * that module descriptions can have an optional sort key. Module descriptions will get sorted in the following way
     * by this function:
     *
     *      1. All module descriptions that do NOT have a sort key, ordered by the lexical sort function.
     *      2. All module descriptions that DO have a sort key, ordered by this sort key in ascending order.
     */
    public moduleSortFn(a: ModuleDescription, b: ModuleDescription)
    {
        if (a.sortKey == undefined && b.sortKey == undefined)
        {
            return this.lexicalModuleSortFn(a, b);
        }
        else if (a.sortKey == undefined)
        {
            return -1;
        }
        else if (b.sortKey == undefined)
        {
            return 1;
        }
        else
        {
            return a.sortKey - b.sortKey;
        }
    }

    /**
     * With this function we modify the sort keys of the given modules in such a way that the order of the given
     * modules is not changed, but every module has a defined sort key afterwards.
     */
    public applySortKeys(modules: ModuleDescription[]): void
    {
        modules.sort(this.moduleSortFn.bind(this));
        for (let i = 0; i < modules.length; i++)
        {
            modules[i].sortKey = i;
        }
    }

    /**
     * We try to remove sort keys from modules where they are redundant to reduce the size of the plan diff.
     */
    public reduceSortKeys(modules: ModuleDescription[]): void
    {
        let lexModules = Array.from(modules);
        lexModules.sort(this.lexicalModuleSortFn.bind(this));
        modules.sort(this.moduleSortFn.bind(this));

        if (shallowEqual(modules, lexModules))
        {
            for (let m of modules)
            {
                delete m.sortKey;
            }
        }
    }
}
