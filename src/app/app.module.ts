import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as accessibility from 'highcharts/modules/accessibility.src';
import * as exporting from 'highcharts/modules/exporting.src';

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { PrototypeHomepageComponent } from './prototype/prototype-homepage/prototype-homepage.component';
import { DrilldownDialogComponent } from './dialogs/drilldown-dialog/drilldown-dialog.component';
import { GraphicPickerComponent } from './prototype/graphic-picker/graphic-picker.component';
import { GraphicDisplayComponent } from './prototype/graphic-display/graphic-display.component';
import { GraphicHeaderComponent } from './prototype/graphic-header/graphic-header.component';
import { AdminComponent } from './prototype/admin/admin.component';
import { InformationDialogComponent } from './dialogs/information-dialog/information-dialog.component';
//import { LocationStrategy, PathLocationStrategy } from '@angular/common';

const appRoutes: Routes = [
  { path: '', 
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  { path: 'admin', component: AdminComponent },
  { path: 'continent', component: GraphicDisplayComponent },
  { path: 'country', component: GraphicDisplayComponent },
  { path: 'tag', component: GraphicDisplayComponent },
  { path: 'sector', component: GraphicDisplayComponent },
  { path: 'org', component: GraphicDisplayComponent },
  { path: 'app', component: GraphicDisplayComponent },
  { path: 'rule', component: GraphicDisplayComponent },
  { path: 'eval', component: GraphicDisplayComponent },
  // Error handling path
  //{ path: '**', component: PrototypeHomepageComponent },  
  { path: '**', 
    redirectTo: 'admin',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    SubmitEarlReportComponent,
    SubmitAccessibilityStatementComponent,
    ErrorDialogComponent,
    PrototypeHomepageComponent,
    DrilldownDialogComponent,
    GraphicPickerComponent,
    GraphicDisplayComponent,
    GraphicHeaderComponent,
    AdminComponent,
    InformationDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }
    ),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatIconModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatSelectModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatAutocompleteModule,
    FlexLayoutModule,
    ChartModule,
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [
    //{ provide: HIGHCHARTS_MODULES, useFactory: () => [ accessibility ] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
