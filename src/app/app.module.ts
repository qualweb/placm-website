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
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartModule } from 'angular-highcharts';

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { PrototypeHomepageComponent } from './prototype/prototype-homepage/prototype-homepage.component';
import { DrilldownDialogComponent } from './dialogs/drilldown-dialog/drilldown-dialog.component';
import { GraphicPickerComponent } from './prototype/graphic-picker/graphic-picker.component';
import { GraphicDisplayComponent } from './prototype/graphic-display/graphic-display.component';
import { GraphicHeaderComponent } from './prototype/graphic-header/graphic-header.component';
//import { LocationStrategy, PathLocationStrategy } from '@angular/common';

const appRoutes: Routes = [
  { path: '', 
    redirectTo: 'continent',
    pathMatch: 'full'
  },
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
    redirectTo: 'continent',
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
    GraphicHeaderComponent
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
    MatSelectModule,
    MatToolbarModule,
    MatMenuModule,
    FlexLayoutModule,
    ChartModule,
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
