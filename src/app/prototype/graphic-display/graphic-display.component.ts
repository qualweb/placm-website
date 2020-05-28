import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'app/dialogs/drilldown-dialog/drilldown-dialog.component';
import { Chart } from 'angular-highcharts';
import { POSSIBLE_FILTERS, TITLES } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as filter from 'lodash.filter';

@Component({
  selector: 'app-graphic-display',
  templateUrl: './graphic-display.component.html',
  styleUrls: ['./graphic-display.component.css']
})
export class GraphicDisplayComponent implements OnInit {

  @Input() actualCategory: string;
  @Output() closedDialog = new EventEmitter();
  actualFilter: string;
  options: any;
  xAxisVars: any[] = [];
  chart: any;
  allDataPrepared = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private combinedService: CombinedService
    ) { }

  ngOnInit(): void {
    this.actualFilter = this.actualCategory.concat('Ids');
    
    //this.prepareLegend();

    this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
  }

  updateCheckboxSelection(event: any, id: number): void {

    // --- com o 'filter' no url, em vez do this.actualFilter --- //
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let queryParamsArray = [];
    let actualFilterExists = false;

    if(!isEmpty(actualParams)){
      // search in all queryParams
      for(let params in actualParams){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== 'filter'){
            queryParamsArray.push('"'.concat(params).concat('":"').concat(actualParams[params]).concat('"'));
          } /*else {
            // did this to remove '.includes' loss of performance in line 113
            actualFilterExists = true;
          }*/
          else if(params === 'filter'){
            actualFilterExists = true;
          }
        }
      }

      // if this category's filter is in queryParams, add or remove id from it
      if(actualFilterExists){
        let idsArray = actualParams['filter'].split(',');
        let indexId = idsArray.indexOf(id.toString());

        // if this id already exists, needs to be removed
        if(indexId >= 0){
          idsArray.splice(indexId, 1);
        } 
        // if it doesnt, needs to be added
        else {
          idsArray.push(id.toString());
        }

        if(idsArray.length) {
          idsArray = idsArray.sort(function(a,b) {
            return +a - +b;
          });
          queryParamsArray.push('"'.concat('filter').concat('":"').concat(idsArray.join(',').concat('"')));
        }
      } else {
        queryParamsArray.push('"'.concat('filter').concat('":"').concat(id.toString().concat('"')));
      }

    } else {
      queryParamsArray.push('"'.concat('filter').concat('":"').concat(id.toString().concat('"')));
    }

    let jsonNavExtras = JSON.parse('{'.concat(queryParamsArray.join(',')).concat('}'));

    this.router.navigate([this.router.url.split('?')[0]], {queryParams: jsonNavExtras});
  }

  getFilterParamsArray(): string[] {
    //let filter = this.activatedRoute.snapshot.queryParams[this.actualFilter];
    let filter = this.activatedRoute.snapshot.queryParams['filter'];
    // if there were any filters active (in the url)
    if(filter){
      return filter.split(',');
    } else {
      return [];
    }
  }

  onPointSelect(e: any): void {
    if(e.point){
      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        category: this.actualCategory,
        filter: this.actualFilter,
        name: e.point.category,
        variable: e.point.series['userOptions'].id,
        id: filter(this.xAxisVars, 'checked')[e.point.index].id
      }
      let dialogRef = this.dialog.open(DrilldownDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(cat => {
        if(cat){
          this.closedDialog.emit(cat);
        }
      })
    }
  }
  
  private async prepareApplicationGraphic(input: any){

    let data;
    let rawData;
    let filterArray;
    let idInParams;
    let resultData = [];
    let subtitle = "";
    let sqlInjectRegex = new RegExp('^[0-9]([,]?[0-9])*$');

    if(!isEmpty(input)){
      
      // removing actual filter from queryParams, because
      // we want to query all data and manipulate this data in the client
      let removed;
      ({[this.actualFilter]: removed, ...input} = input);

      // search in all queryParams
      for(let params in input){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== 'filter'){
            if(input[params]){
              if(!sqlInjectRegex.test(input[params])){
                // remove all queryParams without numbers or commas
                ({[params]: removed, ...input} = input);
              } else {
                // preparing graphic subtitle
                if(subtitle)
                  subtitle = subtitle.concat('; ');
                subtitle = subtitle.concat(params).concat('=').concat(input[params]);
              }
            }
          }
        }
      }
    }    

    // input can be sent as '{}' in this function
    data = await this.combinedService.getData(this.actualCategory, input);
    filterArray = this.getFilterParamsArray();

    if(data['success'] === 1){
      rawData = data['result'];
    } else {
      //todo query error
    }

    let names = [], nApps = [], nPages = [], nPassed = [],
        nFailed = [], nCantTell = [], 
        nInapplicable = [], nUntested = [];

    // todo sorting
    rawData = rawData.sort(function (a,b) {
      let comparison = 0;
      if (a.name > b.name) {
        comparison = 1;
      } else if (a.name < b.name) {
        comparison = -1;
      }
      return comparison;
    });

    for(let vars of rawData){
      idInParams = filterArray.includes(vars.id.toString());
      this.xAxisVars.push({name: vars.name, id: vars.id, checked: !idInParams});
      if(!idInParams){
        names.push(vars.name);
        nPages.push(vars.nPages);
        nPassed.push(vars.nPassed);
        nFailed.push(vars.nFailed);
        nCantTell.push(vars.nCantTell);
        nInapplicable.push(vars.nInapplicable);
        nUntested.push(vars.nUntested);
      }
    }

    if(nApps.length){
      resultData.push({
        id: 'nApps',
        name: '# applications',
        data: nApps
      });
    }

    resultData.push({
      id: 'nPages',
      name: '# pages',
      data: nPages
    });

    resultData.push({
      id: 'nPassed',
      name: '# passed assertions',
      data: nPassed,
      visible: false
    });

    resultData.push({
      id: 'nFailed',
      name: '# failed assertions',
      data: nFailed,
      visible: false
    });

    resultData.push({
      id: 'nCantTell',
      name: '# cantTell assertions',
      data: nCantTell,
      visible: false
    });

    resultData.push({
      id: 'nInapplicable',
      name: '# inapplicable assertions',
      data: nInapplicable,
      visible: false
    });

    resultData.push({
      id: 'nUntested',
      name: '# untested assertions',
      data: nUntested,
      visible: false
    });
    
    //console.log(resultData);
    //console.log(this.xAxisVars); 
    
    this.chart = new Chart({
      chart: {
        type: 'column',
        zoomType: 'y',
      },
      title: {
        text: TITLES[this.actualCategory].concat(' column chart')
      },
      //to enable a single tooltip to all series at one point
      tooltip: { 
        shared: true
      },
      credits: {
        enabled: false
      },
      accessibility: {
        announceNewData: {
            enabled: true
        }
      },
      //eixo dos x - nomes de cada coluna
      xAxis: {
        categories: names,
        crosshair: true
      },
      plotOptions: {
        series: {
          // disabling graphic animations
          animation: false,
          cursor: 'pointer',
          events: {
              legendItemClick: function (e){
                /*console.log(e.target['_i']);
                console.log(filter(this.chart.series, function(o) { return o.visible; }));
                //_i da me o index
                let params = input['p'];
                let queryString = '';
                console.log(inputKeys);
                if(inputKeys.length){
                  queryString = queryString.concat('&p=');
                } else {
                  queryString = queryString.concat('?p=');
                }
                console.log(params);
                console.log(!!params);
                if(params !== undefined){
                  let paramsArray = params.split(',');
                  let indexId = paramsArray.indexOf(e.target['_i']);

                  // if this id already exists, needs to be removed
                  if(indexId >= 0){
                    paramsArray.splice(indexId, 1);
                  } 
                  // if it doesnt, needs to be added
                  else {
                    paramsArray.push(e.target['_i']);
                  }

                  if(paramsArray.length) {
                    paramsArray = paramsArray.sort(function(a,b) {
                      return +a - +b;
                    });
                    queryString = queryString.concat(paramsArray.join(','));
                  }
                } else {
                  queryString = queryString.concat(e.target['_i']);
                }
                
                window.history.pushState({}, '', window.location.href.concat(queryString));*/

              }
              /*click: function (e) {
                const dialogConfig = new MatDialogConfig();
                dialogConfig.autoFocus = true;
                dialogConfig.data = {
                  category: e.point.category,
                  variable: e.point.series['userOptions'].id
                }
              }*/
          },
          compare: 'value',
          showInNavigator: true
          
        }
      }
    });
    
    if(subtitle)
      this.chart.options.subtitle = {text: subtitle};

    for(let data of resultData){
      this.chart.addSeries(data, true, true);
    }
    this.allDataPrepared = true;
  }
}
