import {Directive, ElementRef, HostListener} from "@angular/core";

/**
 * This directive causes its root element to toggle its focus on a click, meaning that clicking again on the already
 * focused element blurs it.
 */
@Directive({
    selector: "[vpFocusToggle]"
})
export class FocusToggleDirective
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private _element: ElementRef)
    {
    }

    /**
     * An event listener binding to the mousedown event of the element.
     */
    @HostListener("mousedown")
    public _onMouseDown()
    {
        if (document.activeElement == this._element.nativeElement)
        {
            setTimeout(() => this._element.nativeElement.blur(), 0);
        }
    }
}
