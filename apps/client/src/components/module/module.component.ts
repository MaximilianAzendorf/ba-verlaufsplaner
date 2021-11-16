import {
    AfterContentInit,
    Component,
    ElementRef,
    HostListener,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild
} from "@angular/core";
import {ModuleDescription} from "@vp/api-interfaces";
import {PlanMetaService} from "../../services/plan-meta.service";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";
import {ArrowLayoutService} from "../../services/arrow-layout.service";
import {LocalizationService} from "../../services/localization.service";
import {LocalizeFn} from "@angular/localize/init";
import {ModuleAccessService, ModuleKey} from "../../services/module-access.service";
import {map} from "lodash";

/** Angular localize function */
declare var $localize: LocalizeFn;

/**
 * This component is used to display information about a single module and is usually used in the plan table to display
 * the modules of the active plans.
 */
@Component({
    selector: "vp-module",
    templateUrl: "./module.component.html",
    styleUrls: ["./module.component.scss"]
})
export class ModuleComponent implements OnInit, OnDestroy, OnChanges, AfterContentInit
{
    /**
     * The delay in milliseconds after which modules related through this module via requirements are highlighted.
     */
    static readonly REQUIREMENT_HOVER_DELAY_MILLISECONDS = 500;

    /**
     * The duration of the blink animation in milliseconds. This determines when the blink CSS class is removed from
     * the module component.
     */
    static readonly BLINK_DURATION_MILLISECONDS = 1000;

    /**
     * The module description of which the component should display the data.
     */
    @Input() public moduleKey: ModuleKey;

    /**
     * If this is set to true, the component will show less information, but will also be smaller.
     */
    @Input() public compact: boolean;

    /**
     * An element reference to the name element that is used to detect if the name is truncated (by displaying an
     * ellipsis) in order to show a tooltip containing the full name in that case.
     */
    @ViewChild("nameElement", {static: false}) public _nameElement: ElementRef;

    /**
     * This is true if the content of the name element is truncated.
     */
    public _nameIsTruncated = false;

    /**
     * The timeout object that is created when the module is hovered.
     */
    private _hoverTimeout: ReturnType<typeof setTimeout>;

    /**
     * Constructor used for injection.
     */
    public constructor(
        public readonly element: ElementRef,
        public _loc: LocalizationService,
        public _modules: ModuleAccessService,
        private _meta: PlanMetaService,
        private _arrowLayout: ArrowLayoutService,
        private _logic: PlanTableLogicService,
        private _zone: NgZone,
        private _renderer: Renderer2)
    {
    }

    /**
     * When this is called, the blink animation is triggered once.
     */
    public blink()
    {
        this._zone.runOutsideAngular(() =>
        {
            this._renderer.removeClass(this.element.nativeElement, "blink");
            setTimeout(() => this._renderer.addClass(this.element.nativeElement, "blink"), 0);
            setTimeout(
                () => this._renderer.removeClass(this.element.nativeElement, "blink"),
                ModuleComponent.BLINK_DURATION_MILLISECONDS);
        });
    }

    /**
     * This is true if a tooltip containing the full name of the module should be shown. This is the case if (1) the
     * name displayed on the component is not the same as the full name (which can be the case e.g. in compact mode) or
     * (2) if the name is too long and got truncated.
     */
    public get _showNameTooltip(): boolean
    {
        let module = this._modules.get(this.moduleKey);
        return this._moduleCardTitle != this._loc.select(module.name) || this._nameIsTruncated;
    }

    /**
     * Returns a string which gets displayed as the name of the module in the component.
     */
    public get _moduleCardTitle(): string
    {
        let module = this._modules.get(this.moduleKey);
        if (!this.compact) return this._loc.select(module.name);

        return this._loc.select(module.nameShort) || this._loc.select(module.name);
    }

    /**
     * Detects if the module name displayed in the component is too long and got truncated.
     */
    public _detectNameTruncation(): void
    {
        setTimeout(() =>
        {
            let ne = this._nameElement.nativeElement;
            this._nameIsTruncated = ne.offsetHeight < ne.scrollHeight || ne.offsetWidth < ne.scrollWidth;
        }, 0);
    }

    /**
     * Event is fired when the user begins hovering over the module.
     */
    @HostListener("mouseenter")
    public _mouseEnter()
    {
        if (this._logic.offsetPast(this._meta.localToGlobalOffset(this.moduleKey))) return;
        this._logic.hoveredModule = this.moduleKey;
        this._hoverTimeout = setTimeout(() =>
        {
            if (this._logic.draggedModule) return;
            if (this._arrowLayout.relevantModulesOf(this.moduleKey).length <= 1) return;
            this._logic.highlightFunction = m =>
            {
                let keyStrings = map(this._arrowLayout.relevantModulesOf(this.moduleKey), k => k.str);
                return keyStrings.includes(m.str);
            }

        }, ModuleComponent.REQUIREMENT_HOVER_DELAY_MILLISECONDS);
    }

    /**
     * Event is fired when the user leaves hovering over the module.
     */
    @HostListener("mouseleave")
    public _mouseLeave()
    {
        this._logic.hoveredModule = undefined;
        this._logic.highlightFunction = undefined;
        clearTimeout(this._hoverTimeout);
    }

    /**
     * Returns the text of the tooltip shown when hovering over the number of CPs in compact mode
     */
    public get _compactTooltip(): string
    {
        let module = this._modules.get(this.moduleKey);
        let swsTooltip = $localize `${module.sws} SWS`;
        if (module.sws != undefined && module.extraInfo != undefined)
        {
            return `${swsTooltip}, ${this._loc.select(module.extraInfo)}`;
        }
        else if (module.sws == undefined)
        {
            return this._loc.select(module.extraInfo);
        }
        else if (module.extraInfo == undefined)
        {
            return swsTooltip;
        }
        else
        {
            return null;
        }
    }

    ngAfterContentInit(): void
    {
        // After the component is initialized, we have to check initially if the name of the given module description is
        // truncated. Because of the specific lifecycle mechanics of an angular component, we can't do this immediately,
        // so we have to wait for the event loop to cycle beforehand.
        //
        setTimeout(() =>
        {
            this._detectNameTruncation();
        }, 0);
    }

    ngOnChanges(): void
    {
        // If something changes, we have to re-check if the module name is now truncated. We have to check if the name
        // element is truthy because the ngOnChanges is also fired at the beginning of the component lifecycle, when
        // view child references are not set yet.
        //
        if (this._nameElement) this._detectNameTruncation();
    }

    ngOnInit(): void
    {
        this._logic.moduleComponents.set(this.moduleKey.str, this);
    }

    ngOnDestroy(): void
    {
        if (this._logic.moduleComponents.get(this.moduleKey.str) == this)
        {
            this._logic.moduleComponents.delete(this.moduleKey.str);
        }
    }
}
