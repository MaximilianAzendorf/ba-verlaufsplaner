import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";

import {RootComponent} from "./components/root/root.component";
import {HttpClientModule} from "@angular/common/http";
import {ModuleComponent} from "./components/module/module.component";
import {PlanTableComponent} from "./components/plan-table/plan-table.component";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {OrdinalPipe} from "./pipes/ordinal.pipe";
import {FormsModule} from "@angular/forms";
import {PlanChangeService} from "./services/plan-change.service";
import {ModuleSortingService} from "./services/module-sorting.service";
import {PlanMetaService} from "./services/plan-meta.service";
import {PlanManagerService} from "./services/plan-manager.service";
import {PlanProviderService} from "./services/plan-provider.service";
import {SemesterNameService} from "./services/semester-name.service";
import {SafeHtmlPipe} from "./pipes/safe-html.pipe";
import {PlanTableColumnHeaderComponent} from "./components/plan-table-column-header/plan-table-column-header.component";
import {PlanTableLastColumnComponent} from "./components/plan-table-last-column/plan-table-last-column.component";
import {PlanTableCellComponent} from "./components/plan-table-cell/plan-table-cell.component";
import {PlanTableBarLineComponent} from "./components/plan-table-bar-line/plan-table-bar-line.component";
import {PlanTableHeaderComponent} from "./components/plan-table-header/plan-table-header.component";
import {ScrollContainerComponent} from "./components/scroll-container/scroll-container.component";
import {ZonelessEventDirective} from "./directives/zoneless-event.directive";
import {PlanBarLayoutService} from "./services/plan-bar-layout.service";
import {PlanTableLogicService} from "./services/plan-table-logic.service";
import {RequirementsLayerComponent} from "./components/requirements-layer/requirements-layer.component";
import {RequirementArrowComponent} from "./components/requirement-arrow/requirement-arrow.component";
import {ModuleBadgesComponent} from "./components/module-badges/module-badges.component";
import {RequirementArrowSvgComponent} from "./components/requirement-arrow-svg/requirement-arrow-svg.component";
import {FailedAttemptHintComponent} from "./components/failed-attempt-hint/failed-attempt-hint.component";
import {RouterModule} from "@angular/router";
import {AppComponent} from "./components/app/app.component";
import {AuthorizedComponent} from "./components/authorized/authorized.component";
import {TopNavbarComponent} from "./components/top-navbar/top-navbar.component";
import {PlanActionBarComponent} from "./components/plan-action-bar/plan-action-bar.component";
import {PlanEditorComponent} from "./components/plan-editor/plan-editor.component";
import {PlanSettingsComponent} from "./components/plan-settings/plan-settings.component";
import {SemesterInputComponent} from "./components/semester-input/semester-input.component";
import {PlanAddComponent} from "./components/plan-add/plan-add.component";
import {FocusToggleDirective} from "./directives/focus-toggle.directive";
import {ErrorsIndicatorComponent} from "./components/errors-indicator/errors-indicator.component";
import {ErrorsHubTableComponent} from "./components/errors-hub-table/errors-hub-table.component";
import {ModuleBadgeComponent} from "./components/module-badge/module-badge.component";
import { ModuleEditComponent } from "./components/module-edit/module-edit.component";
import { LocalizedTextInputComponent } from "./components/localized-text-input/localized-text-input.component";
import { ModuleAddComponent } from "./components/module-add/module-add.component";
import { PlanMaintainerSettingsComponent } from "./components/plan-maintainer-settings/plan-maintainer-settings.component";
import { PlanChoicesEditorComponent } from "./components/plan-choices-editor/plan-choices-editor.component";
import { HintComponent } from "./components/hint/hint.component";
import { BasePlanManagerComponent } from "./components/base-plan-manager/base-plan-manager.component";

/**
 * The routes of the app.
 */
const routes = [
    {path: "authorized", component: AuthorizedComponent},
    {path: "", component: RootComponent}
];

/**
 * The top level module of the app.
 */
@NgModule({
    declarations: [
        AppComponent,
        RootComponent,
        ModuleComponent,
        PlanTableComponent,
        OrdinalPipe,
        ZonelessEventDirective,
        SafeHtmlPipe,
        PlanTableColumnHeaderComponent,
        PlanTableLastColumnComponent,
        PlanTableCellComponent,
        PlanTableBarLineComponent,
        PlanTableHeaderComponent,
        ScrollContainerComponent,
        RequirementsLayerComponent,
        RequirementArrowComponent,
        ModuleBadgesComponent,
        RequirementArrowSvgComponent,
        FailedAttemptHintComponent,
        AuthorizedComponent,
        TopNavbarComponent,
        PlanActionBarComponent,
        PlanEditorComponent,
        PlanSettingsComponent,
        SemesterInputComponent,
        PlanAddComponent,
        FocusToggleDirective,
        ErrorsIndicatorComponent,
        ErrorsHubTableComponent,
        ModuleBadgeComponent,
        ModuleEditComponent,
        LocalizedTextInputComponent,
        ModuleAddComponent,
        PlanMaintainerSettingsComponent,
        PlanChoicesEditorComponent,
        HintComponent,
        BasePlanManagerComponent
    ],
    imports: [
        RouterModule.forRoot(routes),
        BrowserModule,
        HttpClientModule,
        DragDropModule,
        FormsModule
    ],
    providers: [
        ModuleSortingService,
        PlanChangeService,
        PlanManagerService,
        PlanMetaService,
        PlanProviderService,
        SemesterNameService,
        PlanBarLayoutService,
        PlanTableLogicService,
    ],
    bootstrap: [AppComponent],
})
export class ClientAppModule
{
}
