import {HttpModule, Module} from "@nestjs/common";

import {ConfigurationController} from "./controllers/configuration.controller";
import {ServeStaticModule} from "@nestjs/serve-static";
import {join} from "path";
import { ConfigurationService } from "./services/configuration.service";
import {UserController} from "./controllers/user.controller";
import {DbTokenService} from "./services/db-token.service";
import {DbService} from "./services/db.service";
import {SsoService} from "./services/sso.service";

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "client", "en"),
            serveRoot: "/en"
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "client", "de"),
            serveRoot: "/de"
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "..", "doc"),
            serveRoot: "/doc",
        }),
        HttpModule
    ],
    controllers: [
        ConfigurationController,
        UserController,
    ],
    providers: [
        ConfigurationService,
        DbTokenService,
        DbService,
        SsoService
    ],
})
export class ApiAppModule
{}
