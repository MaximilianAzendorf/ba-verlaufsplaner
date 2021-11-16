import {DomSanitizer} from "@angular/platform-browser";
import {PipeTransform, Pipe} from "@angular/core";

/**
 * This pipe is used to bypass the Angular HTML sanitation mechanism when using the innerHTML binding.
 */
@Pipe({
    name: "safeHtml"
})
export class SafeHtmlPipe implements PipeTransform
{
    /**
     * Constructor used for injection.
     */
    constructor(
        private sanitized: DomSanitizer)
    {
    }

    /**
     * Returns the given HTML code without going through sanitation fist.
     */
    transform(value)
    {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}
