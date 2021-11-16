import {ElementRef, Injectable} from "@angular/core";

/**
 * This service provides methods to measure the geometry of DOM elements in relation to each other.
 */
@Injectable({
    providedIn: "root"
})
export class DomMeasurementService
{
    /**
     * Calculates the offset of the given DOM element relative to the given ancestor.
     */
    public offsetToAncestor(elementRef: ElementRef, ancestorRef: ElementRef): {top: number, left: number}
    {
        let element = elementRef.nativeElement;
        let ancestor = ancestorRef.nativeElement;

        let offset = {top: 0, left: 0};

        while (element != ancestor)
        {
            if (!element)
            {
                throw Error(`Element ${ancestorRef.nativeElement} is not an ancestor of `
                    + `${elementRef.nativeElement} or does not have a non-static position property.`);
            }

            offset.top += element.offsetTop;
            offset.left += element.offsetLeft;
            element = element.offsetParent;
        }

        return offset;
    }

    /**
     * Returns the width of the given DOM element.
     */
    public width(elementRef: ElementRef): number
    {
        return elementRef.nativeElement.offsetWidth;
    }

    /**
     * Returns the height of the given DOM element.
     */
    public height(elementRef: ElementRef): number
    {
        return elementRef.nativeElement.offsetHeight;
    }
}
