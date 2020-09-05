import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'app/dialogs/drilldown-dialog/drilldown-dialog.component';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS, queryParamsRegex } from '../../../utils/constants';
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

  homepageUrl: string; 

  sCriteriaVisible: boolean;

  chartsReady: boolean = false;
  
  breadcrumbsData = {};
  
  table: any[];
  showTable: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private combinedService: CombinedService,
    private cd: ChangeDetectorRef) { }

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
        id: filter(this.xAxisVars, 'checked')[data.index].id,
        queryParams: this.activatedRoute.snapshot.queryParams
      }
      let dialogRef = this.dialog.open(DrilldownDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(cat => {
        if(cat){
          if(!cat.comparing){
            //this.closedDialog.emit(cat);
            this.submittedCategory(cat.selected, cat);
          } else {
            this.comparingCategory(cat);
          }
        }
      })
    }
  }
  
  private async prepareApplicationGraphic(input: any){
    this.breadcrumbsData = {};
    let data;
    let rawData;
    let filterArray;
    let idInParams;
    let resultData = [];
    let subtitle = "";
    let subtitlePossibilities = [];
    let variableName, tableHeaders = [];
    this.chartsReady = false;

    /* if(this.chart){
      this.chart.destroy();
      this.chart = undefined;
    } */
    if(this.actualGraphicType === 'assertions'){
      variableName = this.actualGraphicType;
      tableHeaders = ['# pages']
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
    this.table = [[...tableHeaders]];

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
              if(!queryParamsRegex.test(input[params])){
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
        nInapplicable = [], nUntested = [], tableData = [];
    let name;

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
    this.table = [[...tableHeaders]];

    let test, testId, rowIndex = 1;
    for(let vars of rawData){
      tableData = [];
      testId = vars.id ? vars.id : 0;
      if(this.actualCategory === 'sc'){
        test = vars.name ? 'SC ' + testId + ' - ' + vars.name : 'Unspecified';
      } else {
        test = vars.name ? vars.name : 'Unspecified';
      }
      idInParams = filterArray.includes(testId.toString());
      this.xAxisVars.push({name: test, id: testId, checked: !idInParams});
      if(!idInParams){

        // handling x axis
        if(this.actualCategory === 'sc'){
          name = 'SC ' + testId;
        } else {
          name = test;
        }
        names.push(name);

        // handling y axis and table data
        if(this.actualGraphicType === 'assertions'){
          tableData.push(vars.nPages);
          nPages.push(vars.nPages);
        }
        nPassed.push(vars.nPassed);
        nFailed.push(vars.nFailed);
        nCantTell.push(vars.nCantTell);
        nInapplicable.push(vars.nInapplicable);
        nUntested.push(vars.nUntested);
        
        tableData.push(vars.nPassed);
        tableData.push(vars.nFailed);
        tableData.push(vars.nCantTell);
        tableData.push(vars.nInapplicable);
        tableData.push(vars.nUntested);
        
        this.table = this.addDataToTable(name, tableData, rowIndex, this.table);
        rowIndex++;
      }
      
    }

    this.breadcrumbsData['category'] = this.actualCategory;
    this.breadcrumbsData['type'] = this.actualGraphicType;

    this.chartsReady = true;
    this.cd.detectChanges();

    let visibleSeries = [];
    for(let i = 0; i <= 5; i++){
      visibleSeries.push(this.isSeriesVisible(i));
    }

    let i = 0;

    if(this.actualGraphicType === 'assertions'){
      resultData.push({
        id: 'nPages',
        name: tableHeaders[i],
        data: nPages,
        visible: visibleSeries[i]
      });
      i++;
    }

    resultData.push({
      id: 'nPassed',
      name: tableHeaders[i],
      data: nPassed,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nFailed',
      name: tableHeaders[i],
      data: nFailed,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nCantTell',
      name: tableHeaders[i],
      data: nCantTell,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nInapplicable',
      name: tableHeaders[i],
      data: nInapplicable,
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nUntested',
      name: tableHeaders[i],
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
        showTable: false,//this.chart ? this.chart.options.exporting.showTable : false,
        menuItemDefinitions: {
          // toggle data table
          viewData: {
              onclick: () => {
                let element;
                this.showTable = !this.showTable;
                this.cd.detectChanges();
                element = document.getElementById("dataTable");
                
                if(this.showTable){
                  element.focus();
                  element.scrollIntoView();
                } 

                this.updateMenuTableText();
                /* let element;
                // if it was visible - it will be removed
                if(this.showTable){
                  element = document.getElementsByClassName("highcharts-data-table");
                  if(element)
                    element[0].removeChild(element[0].childNodes[0]);
                }
                this.showTable = !this.showTable;
                this.chart.update({
                  exporting: {
                    showTable: this.showTable
                  }
                });
                this.updateMenuTableText(this.showTable); */

                // if it is now visible - change tabindex to 0
                // because default is -1
                /* if(this.chart.options.exporting.showTable){
                  element = document.getElementsByClassName("highcharts-data-table");
                  if(element)
                    element[0].childNodes[0].setAttribute("tabIndex", 0);
                } */
              },
              text: 'Show and go to data table'
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
  
  comparingCategory(data: any){
    this.router.navigate(['../../compare/' + this.actualGraphicType + '/' + this.actualCategory], {
      relativeTo: this.activatedRoute,
      queryParams: data.queryParams
    });
  }

  changeType() {
    if(this.actualGraphicType === 'assertions'){
      this.router.navigate(['/scriteria/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/assertions/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  updateMenuTableText() {
    let updatedText = this.showTable ? 'Hide data table' : 'Show and go to data table';
    this.chart.update(
      {exporting: {
        menuItemDefinitions: {
          viewData: {
            text: updatedText
          }
        }
      }});
  }

  removeAllFilters() {
    this.router.navigate([], {
      queryParams: {
        filter: null
      },
      queryParamsHandling: 'merge'
    });
  }

  addDataToTable(header: string, data: number[], rowIndex: number, table: any[]): any[] {
    if(!table[rowIndex])
      table[rowIndex] = [];

    table[rowIndex][0] = header;

    // +1 because header will be the first column
    let actualColIndex = 1;
    for(let i = 0; i < data.length; i++){
      table[rowIndex][actualColIndex] = data[i];
      actualColIndex++;
    }
    return table;
  }
}