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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';

import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import * as Highcharts from 'highcharts';
import * as Highstocks from 'highcharts/highstock';
import HC_accessibility from 'highcharts/modules/accessibility';
import HC_exporting from 'highcharts/modules/exporting';
import HC_exportdata from 'highcharts/modules/export-data';
import HC_boost from 'highcharts/modules/boost';
HC_accessibility(Highcharts);
HC_exporting(Highcharts);
HC_exportdata(Highcharts);
HC_boost(Highcharts);
HC_accessibility(Highstocks);
HC_exporting(Highstocks);
HC_exportdata(Highstocks);
HC_boost(Highstocks);

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { DrilldownDialogComponent } from './dialogs/drilldown-dialog/drilldown-dialog.component';
import { GraphicPickerComponent } from './prototype/graphic-picker/graphic-picker.component';
import { GraphicDisplayComponent } from './prototype/graphic-display/graphic-display.component';
import { GraphicHeaderComponent } from './prototype/graphic-header/graphic-header.component';
import { GraphicCompareComponent } from './prototype/graphic-compare/graphic-compare.component';
import { AdminComponent } from './prototype/admin/admin.component';
import { InformationDialogComponent } from './dialogs/information-dialog/information-dialog.component';
import { DatabaseDialogComponent } from './dialogs/database-dialog/database-dialog.component';
import { AppSCListComponent } from './prototype/app-sclist/app-sclist.component';
import { GraphicBreadcrumbsComponent } from './prototype/graphic-breadcrumbs/graphic-breadcrumbs.component';
import { SuccessDialogComponent } from './dialogs/success-dialog/success-dialog.component';
import { CompareDialogComponent } from './dialogs/compare-dialog/compare-dialog.component';
import { ErrorPageComponent } from './prototype/error-page/error-page.component';
import { GraphicTimelineComponent } from './prototype/graphic-timeline/graphic-timeline.component';
//import { LocationStrategy, PathLocationStrategy } from '@angular/common';

const appRoutes: Routes = [
  { path: '', 
    //redirectTo: 'admin',
    redirectTo: 'assertions/continent',
    pathMatch: 'full'
  },

  { path: 'assertions',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'continent' },
      { path: 'continent', component: GraphicDisplayComponent },
      { path: 'country', component: GraphicDisplayComponent },
      { path: 'tag', component: GraphicDisplayComponent },
      { path: 'sector', component: GraphicDisplayComponent },
      { path: 'org', component: GraphicDisplayComponent },
      { path: 'app', component: GraphicDisplayComponent },
      { path: 'eval', component: GraphicDisplayComponent },
      { path: 'sc', component: GraphicDisplayComponent },
      { path: 'type', component: GraphicDisplayComponent },
      { path: 'rule', component: GraphicDisplayComponent }
    ]
  },

  { path: 'scriteria',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'continent' },
      { path: 'continent', component: GraphicDisplayComponent },
      { path: 'country', component: GraphicDisplayComponent },
      { path: 'tag', component: GraphicDisplayComponent },
      { path: 'sector', component: GraphicDisplayComponent },
      { path: 'org', component: GraphicDisplayComponent },
      { path: 'app', component: GraphicDisplayComponent },
      { path: 'eval', component: GraphicDisplayComponent },
      { path: 'scApp', component: AppSCListComponent}
    ]
  },

  { path: 'compare',
    children: [
    { path: '', pathMatch: 'full', redirectTo: 'assertions' },
    { path: 'assertions', 
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'continent' },
        { path: 'continent', component: GraphicCompareComponent },
        { path: 'country', component: GraphicCompareComponent },
        { path: 'tag', component: GraphicCompareComponent },
        { path: 'sector', component: GraphicCompareComponent },
        { path: 'org', component: GraphicCompareComponent },
        { path: 'app', component: GraphicCompareComponent },
        { path: 'eval', component: GraphicCompareComponent },
        { path: 'sc', component: GraphicCompareComponent },
        { path: 'type', component: GraphicCompareComponent },
        { path: 'rule', component: GraphicCompareComponent }
      ]},
    { path: 'scriteria', 
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'continent' },
        { path: 'continent', component: GraphicCompareComponent },
        { path: 'country', component: GraphicCompareComponent },
        { path: 'tag', component: GraphicCompareComponent },
        { path: 'sector', component: GraphicCompareComponent },
        { path: 'org', component: GraphicCompareComponent },
        { path: 'app', component: GraphicCompareComponent },
        { path: 'eval', component: GraphicCompareComponent },
      ]}
    ]
  },

  { path: 'timeline',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'assertions' },
      { path: 'assertions', component: GraphicTimelineComponent },
      { path: 'scriteria', component: GraphicTimelineComponent }
    ]
  },

  { path: 'admin', component: AdminComponent },
  
  // Error handling path
  { path: '**', 
    //redirectTo: 'admin',
    redirectTo: 'assertions/continent',
    //redirectTo: 'continent',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    SubmitEarlReportComponent,
    SubmitAccessibilityStatementComponent,
    ErrorDialogComponent,
    DrilldownDialogComponent,
    GraphicPickerComponent,
    GraphicDisplayComponent,
    GraphicHeaderComponent,
    GraphicCompareComponent,
    AdminComponent,
    InformationDialogComponent,
    DatabaseDialogComponent,
    AppSCListComponent,
    GraphicBreadcrumbsComponent,
    SuccessDialogComponent,
    CompareDialogComponent,
    ErrorPageComponent,
    GraphicTimelineComponent
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatDividerModule,
    FlexLayoutModule,
    MatRadioModule
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
