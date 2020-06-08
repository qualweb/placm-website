import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'app/dialogs/drilldown-dialog/drilldown-dialog.component';
import { Chart } from 'angular-highcharts';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as filter from 'lodash.filter';
import * as remove from 'lodash.remove';

@Component({
  selector: 'app-graphic-display',
  templateUrl: './graphic-display.component.html',
  styleUrls: ['./graphic-display.component.css']
})
export class GraphicDisplayComponent implements OnInit {

  //@Input() actualCategory: string;
  @Output() closedDialog = new EventEmitter();
  actualCategory: string;
  actualFilter: string;
  options: any;
  xAxisVars: any[] = [];
  chart: any;
  allDataPrepared = false;

  initChange = false;
  checkboxChange = false;

  breadcrumbs: any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private combinedService: CombinedService) { }

  ngOnInit(): void {
    this.initChange = true;
    this.actualCategory = this.activatedRoute.snapshot.url[0].path;
    this.actualFilter = this.actualCategory.concat('Ids');

    // if queryparams changed (even if first load!), but it was not from a checkbox change, then refresh data!
    this.activatedRoute.queryParams.subscribe((params: any) => {
      if(this.checkboxChange) {
        this.checkboxChange = false;
      } else {
        this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
      } 
    });
    this.updateBreadcrumbs();
  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number): void {
    this.checkboxChange = true;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let queryParamsArray = [];
    let actualFilterExists = false;
    let workingParam = type === 0 ? 'filter' : 'p';
    
    let emptyParamString = "";
    // if it wasnt a legend click on the first p
    if(!(type === 1 && id === 0)){
      emptyParamString = '"'.concat(workingParam).concat('":"');
      // if it was a legend click, there needs to be added the first p (because its always visible in initialization)
      if(type === 1){
        emptyParamString = emptyParamString.concat('0,');
      }
      emptyParamString = emptyParamString.concat(id.toString().concat('"'));
    }

    if(!isEmpty(actualParams)){
      // search in all queryParams
      for(let params in actualParams){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== workingParam){
            queryParamsArray.push('"'.concat(params).concat('":"').concat(actualParams[params]).concat('"'));
          }
          else if(params === workingParam){
            actualFilterExists = true;
          }
        }
      }

      // if this category's filter is in queryParams, add or remove id from it
      if(actualFilterExists){
        let idsArray = actualParams[workingParam].split(',');
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
          queryParamsArray.push('"'.concat(workingParam).concat('":"').concat(idsArray.join(',').concat('"')));
        }
      } else {
        if(emptyParamString)
          queryParamsArray.push(emptyParamString);
      }
    } else {
      if(emptyParamString)
        queryParamsArray.push(emptyParamString);
    }

    let jsonNavExtras = JSON.parse('{'.concat(queryParamsArray.join(',')).concat('}'));
    this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: jsonNavExtras // remove to replace all query params by provided
    });

    if(type === 0)
      this.prepareApplicationGraphic(jsonNavExtras);
  }

  getFilterParamsArray(): string[] {
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
          //this.closedDialog.emit(cat);
          this.submittedCategory(cat.selected, cat);
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
    let subtitlePossibilities = [];
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
          if(params !== this.actualFilter && params !== 'filter' && params !== 'p'){
            if(input[params]){
              if(!sqlInjectRegex.test(input[params])){
                // remove all queryParams that are not composed of only numbers or commas
                ({[params]: removed, ...input} = input);
              } else {
                // preparing graphic subtitle
                subtitlePossibilities.push(params.replace('Ids', ''));
              }
            }
          } else {
            // remove all queryParams equal to filter, p and filter corresponding to actual category
            ({[params]: removed, ...input} = input);
          }
        }
      }
    }    

    // input can be sent as '{}' in this function
    data = await this.combinedService.getData(this.actualCategory, input);
    filterArray = this.getFilterParamsArray();

    if(data['success'] === 1){
      rawData = data['result'];
      subtitle = this.prepareSubtitle(rawData, subtitlePossibilities);
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

    this.xAxisVars = [];

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

    let visibleSeries = [];
    for(let i = 0; i <= 5; i++){
      visibleSeries.push(this.isSeriesVisible(i));
    }

    resultData.push({
      id: 'nPages',
      name: '# pages',
      data: nPages,
      visible: visibleSeries[0]
    });

    resultData.push({
      id: 'nPassed',
      name: '# passed assertions',
      data: nPassed,
      visible: visibleSeries[1]
    });

    resultData.push({
      id: 'nFailed',
      name: '# failed assertions',
      data: nFailed,
      visible: visibleSeries[2]
    });

    resultData.push({
      id: 'nCantTell',
      name: '# cantTell assertions',
      data: nCantTell,
      visible: visibleSeries[3]
    });

    resultData.push({
      id: 'nInapplicable',
      name: '# inapplicable assertions',
      data: nInapplicable,
      visible: visibleSeries[4]
    });

    resultData.push({
      id: 'nUntested',
      name: '# untested assertions',
      data: nUntested,
      visible: visibleSeries[5]
    });
    
    if(!this.chart){
      this.chart = new Chart({
        chart: {
          type: 'column'
        },
        title: {
          text: LABELS_PLURAL[this.actualCategory].concat(' column chart')
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
                legendItemClick: (e) => {
                  this.updateBySelection(e.target['_i'], 1);
                },
                click: (e) => {
                  console.log(e);
                  this.onPointSelect(e);
                }
            },
            compare: 'value',
            showInNavigator: true
            
          }
        }
      });
    } else {
      //this.chart.ref$.subscribe(console.log);
      while(this.chart.ref.series.length !== 0){
        this.chart.removeSeries(0);
      }
      this.chart.ref.xAxis[0].categories = names;
    }

    if(subtitle)
      this.chart.options.subtitle = {text: subtitle};

    for(let data of resultData){
      this.chart.addSeries(data, true, false);
    }
    this.allDataPrepared = true;
  }

  prepareSubtitle(data: any, subs: string[]): string {
    let result = "";
    if(data.length > 0){
      for(let sub of subs){
        let infoQuery = data[0][sub.concat('Names')];
        if(infoQuery){
          let arrayInfoQuery = JSON.parse(infoQuery);

          if(result){
            result = result.concat("; ");
          }

          if(arrayInfoQuery.length > 1) {
            result = result.concat(LABELS_PLURAL[sub]);
            let allNames = [];
            for(let name of arrayInfoQuery){
              allNames.push(name);
            }
            result = result.concat(' ').concat(allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1));
          } else {
            result = result.concat(LABELS_SINGULAR[sub]).concat(' ').concat(arrayInfoQuery[0]);
          }
        } else {
          if(sub === 'sector'){
            
            if(result) {
              result = result.concat("; ");
            }
            let sectorIds = this.activatedRoute.snapshot.queryParams['sectorIds'];
            sectorIds = sectorIds.split(',');
            
            //remove all sectorIds manually inserted
            sectorIds = remove(sectorIds, function(n) {
              return n !== 0 && n !== 1;
            });

            if(sectorIds.length > 1) {
              let allNames = [];
              for(let id of sectorIds){
                allNames.push(SECTORS[id]);
              }
              result = result.concat(allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1));
              result = result.concat(' ').concat(LABELS_PLURAL[sub]);
            } else {
              result = result.concat(SECTORS[sectorIds[0]]).concat(' ').concat(LABELS_SINGULAR[sub]);
            }
          }
          // Theres no info about this queryParam in this SQL Query!
          //console.log(sub);
        }
      }
    }
    return result;
  }

  isSeriesVisible(index: number): boolean {
    let parameterParam = this.activatedRoute.snapshot.queryParams['p'];
    let i = index.toString();
    return parameterParam ? parameterParam.split(',').includes(i) : (index === 0 ? true : false);
  }

  submittedCategory(cat: string, extra?: any){
    if(!extra){
      this.router.navigate(['/'.concat(cat)], {
        relativeTo: this.activatedRoute
      });
    } else {
      let queryParamsString = '{"'.concat(extra.filter).concat('":"').concat(extra.id).concat('"');

      let actualExtras = this.activatedRoute.snapshot.queryParams;
      if(actualExtras){
        for(let params in actualExtras){
          if(POSSIBLE_FILTERS.includes(params) && params !== extra.filter && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString.concat(',"')
                    .concat(params).concat('":"').concat(actualExtras[params]).concat('"');
          }
        }
      }
      queryParamsString = queryParamsString.concat('}');

      this.router.navigate(['/'.concat(cat)], {
        relativeTo: this.activatedRoute,
        queryParams: JSON.parse(queryParamsString)
      });
    }
  }

  updateBreadcrumbs() {
    this.breadcrumbs = [];
    let queryParams = this.activatedRoute.snapshot.queryParams;

    let removed;
    let removableFilters = [this.actualFilter, 'filter', 'p'];
    for(let f of removableFilters){
      if(queryParams[f])
        ({[f]: removed, ...queryParams} = queryParams);
    }

    let keys = (Object.keys(queryParams)).reverse();
    let route = "";
    let queryParamsToBe = []

    for(let i = 0; i < keys.length; i++){
      if(POSSIBLE_FILTERS[keys[i]]){
        queryParamsToBe = [];
        for(let j = i; j >= 0; j--) {
          if(j === i){
            route = keys[j].replace('Ids', '');
          } else {
            queryParamsToBe.push('"'.concat(keys[j]).concat('":').concat(queryParams[keys[j]]));
          }
        }
        this.breadcrumbs.push(
          {
            name: LABELS_SINGULAR[route],
            route: '/'.concat(route),
            queryParams: JSON.parse('{'.concat(queryParamsToBe.join(',')).concat('}'))
          });
      }
    }
    this.breadcrumbs.push(
      {
        name: LABELS_SINGULAR[this.activatedRoute.snapshot.routeConfig.path]
      }
    );
  }
}
