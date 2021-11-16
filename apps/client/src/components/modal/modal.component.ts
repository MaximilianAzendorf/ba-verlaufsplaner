import {Component, ElementRef, Input, OnInit, Output} from "@angular/core";

@Component({
    selector: "vp-modal",
    templateUrl: "./modal.component.html",
    styleUrls: ["./modal.component.scss"]
})
export class ModalComponent
{
    private _visible = false;

    @Input() hidden = false;

    public get visible(): boolean
    {
        return this._visible && !this.hidden;
    }

    constructor(
        public readonly element: ElementRef)
    {
    }

    public show(): void
    {
        this._visible = true;
    }

    public close(): void
    {
        this._visible = false;
    }
}
