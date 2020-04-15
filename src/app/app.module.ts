import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartModule } from 'angular-highcharts';

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { PrototypeHomepageComponent } from './prototype/prototype-homepage/prototype-homepage.component';
import { PrototypeTagComponent } from './prototype/prototype-tag/prototype-tag.component';

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
    PrototypeTagComponent
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
    FlexLayoutModule,
    ChartModule
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
