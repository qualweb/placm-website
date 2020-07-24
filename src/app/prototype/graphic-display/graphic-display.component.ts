import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'app/dialogs/drilldown-dialog/drilldown-dialog.component';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as filter from 'lodash.filter';
import * as remove from 'lodash.remove';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-graphic-display',
  templateUrl: './graphic-display.component.html',
  styleUrls: ['./graphic-display.component.css']
})
export class GraphicDisplayComponent implements OnInit {

  @Output() closedDialog = new EventEmitter();
  actualGraphicType: string;
  actualCategory: string;
  actualFilter: string;
  options: any;
  xAxisVars: any[] = [];
  chart: any;
  allDataPrepared = false;

  initChange = false;
  legendChange = false;

  breadcrumbs: any;

  homepageUrl: string; 

  sCriteriaVisible: boolean;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private combinedService: CombinedService) { }

  ngOnInit(): void {    
    this.initChange = true;
    this.actualGraphicType = this.activatedRoute.snapshot.parent.url[0].path;
    this.actualCategory = this.activatedRoute.snapshot.url[0].path;
    this.actualFilter = this.actualCategory + 'Ids';
    
    switch(this.actualCategory){
      case 'continent':
      case 'country':
      case 'tag':
      case 'sector':
      case 'org':
      case 'app':
      case 'eval':
        this.sCriteriaVisible = true;
        break;
      default:
        this.sCriteriaVisible = false;
        break;
    }

    // if queryparams changed (even if first load!), but it was not from a checkbox change, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
      }
    });
    this.updateBreadcrumbs();
  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number): void {
    this.legendChange = type === 1;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let queryParamsArray = [];
    let actualFilterExists = false;
    let workingParam = type === 0 ? 'filter' : 'p';
    
    let emptyParamString = "";
    // if it wasnt a legend click on the first p
    if(!(type === 1 && id === 0)){
      emptyParamString = '"' + workingParam + '":"';
      // if it was a legend click, there needs to be added the first p (because its always visible in initialization)
      if(type === 1){
        emptyParamString = emptyParamString + '0,';
      }
      emptyParamString = emptyParamString + id.toString() + '"';
    }

    if(!isEmpty(actualParams)){
      // search in all queryParams
      for(let params in actualParams){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== workingParam){
            queryParamsArray.push('"' + params + '":"' + actualParams[params] + '"');
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
          queryParamsArray.push('"' + workingParam + '":"' + idsArray.join(',') + '"');
        }
      } else {
        if(emptyParamString)
          queryParamsArray.push(emptyParamString);
      }
    } else {
      if(emptyParamString)
        queryParamsArray.push(emptyParamString);
    }

    let jsonNavExtras = JSON.parse('{' + queryParamsArray.join(',') + '}');

    // update data table on checkbox click
    if(this.chart.options.exporting.showTable){
      let element = document.getElementsByClassName("highcharts-data-table");
      if(element)
        element[0].removeChild(element[0].childNodes[0]);
    }
    this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: jsonNavExtras // remove to replace all query params by provided
    });
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
    if(e.point || e.target){
      let data = e.point ? e.point : e.target;
      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        category: this.actualCategory,
        type: this.actualGraphicType,
        filter: this.actualFilter,
        name: data.category,
        variable: data.series['userOptions'].id,
        id: filter(this.xAxisVars, 'checked')[data.index].id
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
    data = await this.combinedService.getData(this.actualCategory, this.actualGraphicType, input);
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
    /*rawData = rawData.sort(function (a,b) {
      let comparison = 0;
      if (a.name > b.name) {
        comparison = 1;
      } else if (a.name < b.name) {
        comparison = -1;
      }
      return comparison;
    });*/

    this.xAxisVars = [];

    let test, testId;
    for(let vars of rawData){
      testId = vars.id ? vars.id : 0;
      if(this.actualCategory === 'sc'){
        test = vars.name ? 'SC ' + testId + ' - ' + vars.name : 'Unspecified';
      } else {
        test = vars.name ? vars.name : 'Unspecified';
      }
      idInParams = filterArray.includes(testId.toString());
      this.xAxisVars.push({name: test, id: testId, checked: !idInParams});
      if(!idInParams){
        if(this.actualCategory === 'sc'){
          names.push('SC ' + testId);
        } else {
          names.push(test);
        }
        nPages.push(vars.nPages);
        nPassed.push(vars.nPassed);
        nFailed.push(vars.nFailed);
        nCantTell.push(vars.nCantTell);
        nInapplicable.push(vars.nInapplicable);
        nUntested.push(vars.nUntested);
      }
    }

    let visibleSeries = [];
    for(let i = 0; i <= 5; i++){
      visibleSeries.push(this.isSeriesVisible(i));
    }

    let i = 0;
    let variableName = this.actualGraphicType === 'assertions' ? this.actualGraphicType : 'criteria';

    if(this.actualGraphicType === 'assertions'){
      resultData.push({
        id: 'nPages',
        name: '# pages',
        data: nPages,
        visible: visibleSeries[i]
      });
      i++;
    }

    resultData.push({
      id: 'nPassed',
      name: '# passed ' + variableName,
      data: nPassed,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nFailed',
      name: '# failed ' + variableName,
      data: nFailed,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nCantTell',
      name: '# cantTell ' + variableName,
      data: nCantTell,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nInapplicable',
      name: '# inapplicable ' + variableName,
      data: nInapplicable,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nUntested',
      name: '# untested ' + variableName,
      data: nUntested,
      visible: visibleSeries[i]
    });

    this.chart = Highcharts.chart('chart', {
      chart: {
        type: 'column',
        animation: false
      },
      title: {
        text: LABELS_PLURAL[this.actualCategory] + ' column chart'
      },
      //to enable a single tooltip to all series at one point
      tooltip: {
        shared: true
      },
      credits: {
        enabled: false
      },
      exporting: {
        accessibility:{
          enabled: true
        },
        showTable: this.chart ? this.chart.options.exporting.showTable : false,
        menuItemDefinitions: {
          // toggle data table
          viewData: {
              onclick: () => {
                if(this.chart.options.exporting.showTable){
                  let element = document.getElementsByClassName("highcharts-data-table");
                  if(element)
                    element[0].removeChild(element[0].childNodes[0]);
                  this.chart.reflow();
                }
                this.chart.update({
                  exporting: {
                    showTable: !this.chart.options.exporting.showTable
                  }
                });
              },
              text: 'Toggle data table'
          }
        },
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
      /*legend: {
        accessibility: {
          enabled: true,
          keyboardNavigation: {
            enabled: true
          }
        },
        itemHoverStyle: {}
      },*/
      plotOptions: {
        series: {
          // disabling graphic animations
          animation: false,
          cursor: 'pointer',
          events: {
              legendItemClick: (e) => {
                this.updateBySelection(e.target['_i'], 1);
              }              
          },
          point: {
            events: {
              click: (e) => {
                this.onPointSelect(e);
              }
            }
          },
          compare: 'value',
          showInNavigator: true
          
        }
      },
      series: resultData
    });

    if(subtitle)
      this.chart.setSubtitle({text: subtitle});
  }

  prepareSubtitle(data: any, subs: string[]): string {
    let result = "";
    if(data.length > 0){
      for(let sub of subs){
        let infoQuery = data[0][sub + 'Names'];
        if(infoQuery){
          let arrayInfoQuery = JSON.parse(infoQuery);

          if(result){
            result = result + "; ";
          }

          if(arrayInfoQuery.length > 1) {
            result = result + LABELS_PLURAL[sub];
            let allNames = [];
            for(let name of arrayInfoQuery){
              allNames.push(name);
            }
            result = result + ' ' + allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1);
          } else {
            result = result + LABELS_SINGULAR[sub] + ' ' + arrayInfoQuery[0];
          }
        } else {
          if(sub === 'sector'){
            
            if(result) {
              result = result + "; ";
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
              result = result + allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1);
              result = result + ' ' + LABELS_PLURAL[sub];
            } else {
              result = result + SECTORS[sectorIds[0]] + ' ' + LABELS_SINGULAR[sub];
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
      this.router.navigate(['../' + cat], {
        relativeTo: this.activatedRoute
      });
    } else {
      let queryParamsString = '{"' + extra.filter + '":"' + extra.id + '"';

      let actualExtras = this.activatedRoute.snapshot.queryParams;
      if(actualExtras){
        for(let params in actualExtras){
          if(POSSIBLE_FILTERS.includes(params) && params !== extra.filter && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString + ',"'
                     + params + '":"' + actualExtras[params] + '"';
          }
        }
      }
      queryParamsString = queryParamsString + '}';

      this.router.navigate(['../' + cat], {
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
      if(POSSIBLE_FILTERS.includes(keys[i])){
        queryParamsToBe = [];
        for(let j = i; j >= 0; j--) {
          if(j === i){
            route = keys[j].replace('Ids', '');
          } else {
            queryParamsToBe.push('"' + keys[j] + '":"' + queryParams[keys[j]] + '"');
          }
        }
        this.breadcrumbs.push(
          {
            name: LABELS_SINGULAR[route],
            route: '/' + this.actualGraphicType + '/' + route,
            queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
          });
      }
    }
    this.breadcrumbs.push(
      {
        name: LABELS_SINGULAR[this.activatedRoute.snapshot.routeConfig.path]
      }
    );
  }

  changeType() {
    if(this.actualGraphicType === 'assertions'){
      //todo
      //this.router.navigate(['/scriteria/'+this.actualCategory], { queryParamsHandling: "preserve" });
      this.router.navigate(['/scriteria/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    } else {
      //this.router.navigate(['/assertions/'+this.actualCategory], { queryParamsHandling: "preserve" });
      this.router.navigate(['/assertions/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    }
  }
}
