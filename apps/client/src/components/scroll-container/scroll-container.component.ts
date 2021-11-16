import {Component, DoCheck, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild} from "@angular/core";
import {PlanTableLogicService} from "../../services/plan-table-logic.service";

/**
 * This components contains the plan table and handles its scrolling capabilities, including the scroll indicators.
 */
@Component({
    selector: "vp-scroll-container",
    templateUrl: "./scroll-container.component.html",
    styleUrls: ["./scroll-container.component.scss"]
})
export class ScrollContainerComponent implements OnInit, OnDestroy, DoCheck
{
    /**
     * The amount of pixels of scroll distance remaining to the bottom of the component before the scroll indicators
     * get hidden.
     */
    static readonly SCROLL_INDICATOR_THRESHOLD_PX = 20;

    /**
     * A view child reference for the scroll indicator pointing upwards. We have to hide the scroll indicators
     * manually because the scroll event is running outside the Angular zone for performance reasons.
     */
    @ViewChild("scrollIndicatorUp") _scrollIndicatorUp: ElementRef;

    /**
     * A view child reference for the scroll indicator pointing downwards. We have to hide the scroll indicators
     * manually because the scroll event is running outside the Angular zone for performance reasons.
     */
    @ViewChild("scrollIndicatorDown") _scrollIndicatorDown: ElementRef;

    /**
     * A view child reference for the scroll indicator pointing right. We have to hide the scroll indicators
     * manually because the scroll event is running outside the Angular zone for performance reasons.
     */
    @ViewChild("scrollIndicatorRight") _scrollIndicatorRight: ElementRef;

    /**
     * A view child reference for the scroll indicator pointing right. We have to hide the scroll indicators
     * manually because the scroll event is running outside the Angular zone for performance reasons.
     */
    @ViewChild("scrollIndicatorLeft") _scrollIndicatorLeft: ElementRef;

    /**
     * A view child reference for the scroll container, which handles overflow scrolling of the component. We use this
     * to detect if the component is overflowing and to enable or disable scroll indicators accordingly.
     */
    @ViewChild("scrollContainer", {static: true}) _scrollContainer: ElementRef;


    /**
     * A ResizeObserver to detect size changes of the scroll container. On every resize, we check if scroll indicators
     * should be shown or not.
     */
    private _scrollContainerResizeObserver: ResizeObserver;

    /**
     * This is true if the component content is overflowing horizontally.
     */
    public _componentOverflowingX: boolean;

    /**
     * This is true if the component content is overflowing vertically.
     */
    public _componentOverflowingY: boolean;

    /**
     * Constructor used for injection.
     */
    constructor(
        private _logic: PlanTableLogicService,
        private _renderer: Renderer2,
        private _zone: NgZone)
    {
    }

    /**
     * An event callback that is called whenever the component content changes its size.
     */
    public _scrollContainerResized(): void
    {
        this._componentOverflowingX =
            this._scrollContainer.nativeElement.scrollWidth > this._scrollContainer.nativeElement.clientWidth;
        this._componentOverflowingY =
            this._scrollContainer.nativeElement.scrollHeight > this._scrollContainer.nativeElement.clientHeight;
        this._scrollPositionChanged();
    }

    /**
     * An event callback to retrieve the scroll position off the scroll container to conditionally show or hide scroll
     * indicators. We do this with the Angular renderer because this runs outside of the Angular zone.
     */
    public _scrollPositionChanged(): void
    {
        let target = this._scrollContainer.nativeElement;
        let topTotal = target.scrollHeight - target.clientHeight;
        let leftTotal = target.scrollWidth - target.clientWidth;

        if (this._scrollIndicatorDown && this._scrollIndicatorUp)
        {
            if (topTotal - target.scrollTop < ScrollContainerComponent.SCROLL_INDICATOR_THRESHOLD_PX)
            {
                this._renderer.addClass(this._scrollIndicatorDown.nativeElement, "hidden");
            }
            else
            {
                this._renderer.removeClass(this._scrollIndicatorDown.nativeElement, "hidden");
            }

            if (target.scrollTop == 0)
            {
                this._renderer.addClass(this._scrollIndicatorUp.nativeElement, "hidden");
            }
            else
            {
                this._renderer.removeClass(this._scrollIndicatorUp.nativeElement, "hidden");
            }
        }

        if (this._scrollIndicatorLeft && this._scrollIndicatorRight)
        {
            if (leftTotal - target.scrollLeft < ScrollContainerComponent.SCROLL_INDICATOR_THRESHOLD_PX)
            {
                this._renderer.addClass(this._scrollIndicatorRight.nativeElement, "hidden");
            }
            else
            {
                this._renderer.removeClass(this._scrollIndicatorRight.nativeElement, "hidden");
            }

            if (target.scrollLeft == 0)
            {
                this._renderer.addClass(this._scrollIndicatorLeft.nativeElement, "hidden");
            }
            else
            {
                this._renderer.removeClass(this._scrollIndicatorLeft.nativeElement, "hidden");
            }
        }
    }

    /**
     * Updates the scroll indicator states.
     */
    private _update()
    {
        this._scrollContainerResized();

        if (this._scrollIndicatorUp)
        {
            this._renderer.setStyle(
                this._scrollIndicatorUp.nativeElement, "top", `${this._logic.headerHeight - 30}px`);
        }

        if (this._scrollIndicatorLeft)
        {
            this._renderer.setStyle(
                this._scrollIndicatorLeft.nativeElement, "top", `${this._logic.headerHeight / 2}px`);
        }

        if (this._scrollIndicatorRight)
        {
            this._renderer.setStyle(
                this._scrollIndicatorRight.nativeElement, "top", `${this._logic.headerHeight / 2}px`);
        }
    }

    /**
     * Scrolls the scroll container to the given position. The parameters given can be undefined (in which case we do
     * not scroll in the respective direction) or a number between 0 (meaning the top of the view) or 1 (meaning the
     * bottom of the view).
     */
    public _scrollTo(xScrollPercentage: number | undefined, yScrollPercentage: number | undefined)
    {
        let scrollNative = this._scrollContainer.nativeElement;
        scrollNative.scrollTo({
            left: xScrollPercentage == undefined
                ? scrollNative.scrollLeft
                : xScrollPercentage * (scrollNative.scrollWidth - scrollNative.clientWidth),
            top: yScrollPercentage == undefined
                ? scrollNative.scrollTop
                : yScrollPercentage * (scrollNative.scrollHeight - scrollNative.clientHeight),
            behavior: "smooth"
        });
    }

    ngOnInit(): void
    {
        // After the view is initialized, we set up the ResizeObserver for our scroll container to detect content size
        // changes of the component.

        this._scrollContainerResizeObserver = new ResizeObserver(_ =>
        {
            this._zone.run(() =>
            {
                this._scrollContainerResized();
            });
        });

        this._scrollContainerResizeObserver.observe(this._scrollContainer.nativeElement);
        setTimeout(() => this._scrollPositionChanged(), 0);

        this._logic.scrollContainerRef = this._scrollContainer;
    }

    ngOnDestroy(): void
    {
        // We unregister the resize observer.
        this._scrollContainerResizeObserver.unobserve(this._scrollContainer.nativeElement);
    }

    ngDoCheck(): void
    {
        this._zone.runOutsideAngular(() =>
        {
            setTimeout(() =>
            {
                this._update();
            }, 0);
        })
    }
}
