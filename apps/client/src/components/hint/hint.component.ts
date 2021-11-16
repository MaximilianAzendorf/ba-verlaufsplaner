import {Component, Input} from "@angular/core";

@Component({
    selector: "vp-hint",
    templateUrl: "./hint.component.html",
    styleUrls: ["./hint.component.scss"]
})
export class HintComponent
{
    @Input() text: string;
}
