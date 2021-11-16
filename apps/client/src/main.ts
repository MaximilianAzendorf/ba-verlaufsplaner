import {ApplicationRef, enableProdMode} from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { ClientAppModule } from "./client-app.module";
import { environment } from "./environments/environment";
import {enableDebugTools} from "@angular/platform-browser";
import log, {LogLevelDesc} from "loglevel";

log.setLevel(environment.logLevel as LogLevelDesc, false);

if (environment.production)
{
    enableProdMode();
}

platformBrowserDynamic()
    .bootstrapModule(ClientAppModule)
    .then(moduleRef =>
    {
        if (!environment.production)
        {
            const appRef = moduleRef.injector.get(ApplicationRef);
            const componentRef = appRef.components[0];
            enableDebugTools(componentRef);
        }
    }).catch((err) => console.error(err));
