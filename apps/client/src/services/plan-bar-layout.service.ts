import {Injectable} from "@angular/core";
import {PlanChangeService} from "./plan-change.service";
import {PlanMetaService} from "./plan-meta.service";
import {PlanManagerService} from "./plan-manager.service";
import {partitionIntervals} from "@vp/utility";
import {Plan} from "@vp/api-interfaces";
import {isEqual, max} from "lodash";
import log from "loglevel";

/**
 * An interface for the layout entries that are used to describe the bar layout.
 */
export interface BarLayoutEntry
{
    /**
     * The plan that this bar represents. If this bar is a spacer, this property is undefined instead.
     */
    plan: Plan | undefined;

    /**
     * The first offset of this bar.
     */
    start: number;

    /**
     * The last offset of this bar.
     */
    end: number
}

/**
 * This service handles the layout of the plan bars that are shown at the top of the plan table.
 */
@Injectable({
    providedIn: "root"
})
export class PlanBarLayoutService
{
    /**
     * Contains the interval array that got layouted the last time the layout got calculated. This is used to check if
     * the layout has to be recalculated.
     */
    private _layoutIntervals: [Plan, number, number][];

    /**
     * Contains the layout, where each sub-array _layout[n] contains a list of bars (or graps, if the plan property of
     * the entry is undefined).
     */
    public layout: BarLayoutEntry[][];

    /**
     * Constructor used for injection.
     */
    constructor(
        private _planManager: PlanManagerService,
        private _planChange: PlanChangeService,
        private _planMeta: PlanMetaService)
    {
        _planChange.planChanged.subscribe(
            PlanBarLayoutService,
            [PlanMetaService],
            _ => this._checkLayout());
    }

    /**
     * Returns the interval with the given index.
     */
    public getInterval(index: number): [number, number]
    {
        return this._layoutIntervals[index].slice(1) as [number, number];
    }

    /**
     * Checks if the layout should be recalculated and does it if necessary.
     */
    private _checkLayout()
    {
        let currentIntervals = this._calculatePlanIntervals();

        // If we still have the same intervals we are done here.
        if (isEqual(currentIntervals, this._layoutIntervals))
        {
            log.debug("Don't need to recalculate plan bar layout");
            return;
        }

        this._layoutIntervals = currentIntervals;
        this._recalculateLayout();

        log.debug("Plan bar layout recalculated");
    }

    /**
     * Calculates the offset intervals of all active plans.
     */
    private _calculatePlanIntervals(): [Plan, number, number][]
    {
        let intervals: [Plan, number, number][] = [];
        for (let plan of this._planManager.activePlans)
        {
            intervals.push([plan, this._planMeta.startOffsetOfPlan(plan), this._planMeta.maxOffsetOfPlan(plan)]);
        }

        return intervals;
    }

    /**
     * Recalculates the layout.
     */
    private _recalculateLayout()
    {
        this.layout = [];
        if (this._planManager.allPlans.length <= 1) return;

        let groups = partitionIntervals(this._layoutIntervals.map(l => l.slice(1) as [number, number]));
        let numberOfGroups = max(groups) + 1;

        for (let group = 0; group < numberOfGroups; group++)
        {
            let entries: BarLayoutEntry[] = [];
            for (let planIndex = 0; planIndex < this._planManager.activePlans.length; planIndex++)
            {
                if (groups[planIndex] != group) continue;
                entries.push({
                    plan: this._planManager.activePlans[planIndex],
                    start: this._layoutIntervals[planIndex][1],
                    end: this._layoutIntervals[planIndex][2],
                });
            }
            entries.sort((a, b) => a.start - b.start);

            // We now add the gap bars to the entries.
            let gappedEntries: BarLayoutEntry[] = [];
            for (let entryIndex = 0; entryIndex < entries.length; entryIndex++)
            {
                let lastEnd = entryIndex == 0 ? -1 : entries[entryIndex - 1].end;
                let nextStart = entries[entryIndex].start;

                if (nextStart - lastEnd > 1)
                {
                    gappedEntries.push({plan: undefined, start: lastEnd + 1, end: nextStart - 1});
                }
                gappedEntries.push(entries[entryIndex]);
            }
            this.layout.push(gappedEntries);
        }
    }
}
