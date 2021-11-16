/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {Logger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";

import {ApiAppModule} from "./api-app.module";
import {NestExpressApplication} from "@nestjs/platform-express";

async function bootstrap()
{
    const app = await NestFactory.create<NestExpressApplication>(ApiAppModule);
    const globalPrefix = "api";
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT || 3333;

    app.disable("etag");

    await app.listen(port, () =>
    {
        Logger.log("Listening at http://localhost:" + port + "/" + globalPrefix);
    });
}

// noinspection JSIgnoredPromiseFromCall
bootstrap();
