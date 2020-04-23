import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartModule } from 'angular-highcharts';

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { PrototypeHomepageComponent } from './prototype/prototype-homepage/prototype-homepage.component';
import { PrototypeTagComponent } from './prototype/prototype-tag/prototype-tag.component';
import { DrilldownDialogComponent } from './dialogs/drilldown-dialog/drilldown-dialog.component';
import { PrototypeApplicationComponent } from './prototype/prototype-application/prototype-application.component';
import { PrototypeCountryComponent } from './prototype/prototype-country/prototype-country.component';
import { PrototypePageComponent } from './prototype/prototype-page/prototype-page.component';
import { PrototypeRuleComponent } from './prototype/prototype-rule/prototype-rule.component';
import { PrototypeEvaluationComponent } from './prototype/prototype-evaluation/prototype-evaluation.component';

const appRoutes: Routes = [
  { path: '', component: AppComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    SubmitEarlReportComponent,
    SubmitAccessibilityStatementComponent,
    ErrorDialogComponent,
    PrototypeHomepageComponent,
    PrototypeTagComponent,
    DrilldownDialogComponent,
    PrototypeApplicationComponent,
    PrototypeCountryComponent,
    PrototypePageComponent,
    PrototypeRuleComponent,
    PrototypeEvaluationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }
    ),
    ReactiveFormsModule,
    HttpClientModule,
    MatIconModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    FlexLayoutModule,
    ChartModule
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
