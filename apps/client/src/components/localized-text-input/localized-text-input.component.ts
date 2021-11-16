import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {LocalizableString} from "@vp/api-interfaces";

@Component({
    selector: "vp-localized-text-input",
    templateUrl: "./localized-text-input.component.html",
    styleUrls: ["./localized-text-input.component.scss"]
})
export class LocalizedTextInputComponent
{
    @Input() emptyAllowed = true;

    @Input() locString: LocalizableString;
    @Output() locStringChange: EventEmitter<LocalizableString> = new EventEmitter();

    public get _isPlainString()
    {
        return typeof this.locString != "object" || this.locString == null;
    }

    _expand()
    {
        this.locString = {"en": this.locString as string, "de": this.locString as string};
        this.locStringChange.emit(this.locString);
    }

    _collapse()
    {
        this.locString = this.locString["de"] || this.locString["en"];
        this.locStringChange.emit(this.locString);
    }
}
