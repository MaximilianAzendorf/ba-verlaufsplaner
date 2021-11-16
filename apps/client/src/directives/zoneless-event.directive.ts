import {Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, Renderer2} from "@angular/core";

/**
 * This directive is used to bind to native javascript events outside of the angular zone, so that these events don't
 * trigger the Angular change detection.
 */
@Directive({
    selector: "[vpZonelessEvent]"
})
export class ZonelessEventDirective implements OnInit, OnDestroy
{
    /**
     * The event emitter that gets emitted every time the specified events are triggered.
     */
    @Output() eventHandler = new EventEmitter<any>();

    /**
     * The name of the events that should be listened for.
     */
    @Input() events: string[];

    /**
     * The un-listen function of the native event listener.
     */
    private readonly _teardownFunctions: Function[] = [];

    /**
     * Constructor used for injection.
     */
    constructor(
        private _zone: NgZone,
        private _element: ElementRef,
        private _renderer: Renderer2)
    {
    }

    ngOnInit(): void
    {
        this._zone.runOutsideAngular(() =>
        {
            for (let event of this.events)
            {
                this._teardownFunctions.push(this._renderer.listen(this._element.nativeElement, event, e =>
                {
                    this.eventHandler.emit(e);
                }));
            }
        });
    }

    ngOnDestroy(): void
    {
        for (let teardownFn of this._teardownFunctions)
        {
            teardownFn();
        }
    }
}
