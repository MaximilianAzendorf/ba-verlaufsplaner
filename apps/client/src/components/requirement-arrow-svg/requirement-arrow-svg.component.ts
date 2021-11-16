import {Component, Input} from "@angular/core";

/**
 * This component is used to display a requirement arrow without any kind of logic. It is directly fed with its geometry
 * and appearance parameters.
 */
@Component({
    selector: "vp-requirement-arrow-svg",
    templateUrl: "./requirement-arrow-svg.component.html",
    styleUrls: ["./requirement-arrow-svg.component.scss"]
})
export class RequirementArrowSvgComponent
{
    /**
     * The path string of the arrow. This typically is a cubic bezier SVG descriptor.
     */
    @Input() path: string;

    /**
     * A unique id of the arrow. This is needed to uniquely name the arrow tip definition of this arrow.
     */
    @Input() id: string;

    /**
     * If this is set to false, the arrow will be dashed.
     */
    @Input() required: boolean;

    /**
     * If this is set to true, the arrow will not be visible.
     */
    @Input() hidden = false;

    /**
     * If this is set to true, the arrow will be red. If this is set to false, it will be green.
     */
    @Input() violated = false;
}
