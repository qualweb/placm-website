import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS, queryParamsRegex } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as filter from 'lodash.filter';
import * as remove from 'lodash.remove';
import * as Highcharts from 'highcharts';
import { filter as filterRxjs} from 'rxjs/internal/operators/filter';
import { CompareDialogComponent } from 'app/dialogs/compare-dialog/compare-dialog.component';

@Component({
  selector: 'app-graphic-compare',
  templateUrl: './graphic-compare.component.html',
  styleUrls: ['./graphic-compare.component.css']
})
export class GraphicCompareComponent implements OnInit {

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

  charts: any[];
  actualCharts: any[] = [];

  chartsReady: boolean = false;
  tableReady: boolean = false;

  comparingSameType: boolean;
  colSpan: number;

  table: any[];
  showTable: boolean = false;

  failedIds: any[] = [];
  unitedChart: boolean = false;

  breadcrumbsData = {
    comparing: true
  };
  
  error: boolean = false;
  errorMessage: number = 0;

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
    this.breadcrumbsData['names'] = [];

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

    // to fill some data when redirected to continent because of an error
    this.router.events.pipe(
      filterRxjs(event => event instanceof NavigationEnd
        && (event.urlAfterRedirects === '/compare/assertions/continent' ||
        event.urlAfterRedirects === '/compare/scriteria/continent')
      )
    ).subscribe((event: NavigationEnd) => {
      const queryParams = {continentIds: "1,2,3,4,5,6"};
      this.router.navigate([], {
        queryParams
      })
    });

    this.clearExistentCharts();
    // if queryparams changed (even if first load!), but it was not from a checkbox change, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        this.clearExistentCharts();
        await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
      }
    });

  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number, e?: any): void {
    let testCharts = Highcharts.charts.filter(x => {if(x !== undefined) return x;});
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
          if(params !== workingParam){
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

    for(let c of testCharts){
      // if legend click and not chart clicked (because it toggles automatically)
      if(type === 1 && e.target.chart.renderTo !== c['renderTo']){
        c.series[id].setVisible();
      }
      
     // update data table on checkbox click
      if(c.options.exporting.showTable){
        let element = document.getElementsByClassName("highcharts-data-table");
        if(element)
          element[0].removeChild(element[0].childNodes[0]);
      }
    }
    this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: jsonNavExtras
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

  getOrderByParam(input: any): string {
    let result;
    let params = Object.keys(input);
    if(params.length && !params[0].includes(this.actualCategory)){
      result = params[0].substring(0, params[0].length - 1);
    } else {
      if(this.actualCategory === 'rule'){
        result = 'name';
      } else {
        result = 'id';
      }
    }
    return result;
  }

  onPointSelect(e: any, graphId: number): void {
    if(e.point || e.target){
      let data = e.point ? e.point : e.target;

      let graphTitle = data.series.chart.title.textStr.replace(' column chart','').split(' ');
      graphTitle = graphTitle[graphTitle.length - 1];

      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.width = '50rem';
      dialogConfig.position = {
        top: '20vh'
      };
      dialogConfig.data = {
        category: this.actualCategory,
        type: this.actualGraphicType,
        filter: this.actualFilter,
        name: data.category,
        variable: data.series['userOptions'].id,
        id: filter(this.xAxisVars, 'checked')[data.index].id,
        queryParams: this.activatedRoute.snapshot.queryParams,
        graphTitle: graphTitle,
        graphId: +graphId
      }
      let dialogRef = this.dialog.open(CompareDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(cat => {
        if(cat){
          this.comparingCategory(cat);
        }
      })
    }
  }
  
  private async prepareApplicationGraphic(input: any){
    this.breadcrumbsData = {
      comparing: true
    };
    this.breadcrumbsData['names'] = [];
    let data, rawData;
    let orderByParam, orderByParamName;
    let filterArray;
    let idInParams;
    let resultData = [];
    let subtitle = "";
    let subtitlePossibilities = [];
    let checkboxesPossibilities = [];
    // tableHeaders will be used to store variable names of chart and table headers
    let variableName, tableHeaders = [];
    this.actualCharts = [];
    this.failedIds = [];
    this.chartsReady = false;
    this.tableReady = false;

    if(this.actualGraphicType === 'assertions'){
      variableName = this.actualGraphicType;
      tableHeaders = ['# pages']
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
  
    if(!isEmpty(input)){
      
      // removing actual filter from queryParams, because
      // we want to query all data and manipulate this data in the client
      let removed;
      //({[this.actualFilter]: removed, ...input} = input);

      // search in all queryParams
      for(let params in input){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== 'filter' && params !== 'p'){
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
            // remove all queryParams equal to filter and p
            ({[params]: removed, ...input} = input);
          }
        }
      }
    }

    // input can be sent as '{}' in this function
    // only send first queryParam while comparing!
    let firstParam = Object.keys(input)[0];
    let firstParamInput = JSON.parse('{"' + firstParam + '":"' + input[firstParam] + '"}');

    try{
      data = await this.combinedService.getData(this.actualCategory, this.actualGraphicType, firstParamInput, true);
    } catch (err){
      this.error = true;
      this.errorMessage = 3;
    }

    if(data && data['success'] === 1){
      rawData = data['result'];
    } else {
      this.error = true;
      this.errorMessage = 4;
    }

    if(!this.error){    
      filterArray = this.getFilterParamsArray();
      orderByParam = this.getOrderByParam(input);
      this.comparingSameType = orderByParam === 'id' || orderByParam === 'name';
      this.unitedChart = this.comparingSameType && 
        this.activatedRoute.snapshot.queryParams.graph === '1';
      orderByParamName = this.comparingSameType ? 'name' : orderByParam.replace('Id','Name');
      let titleCategory = this.comparingSameType ? this.actualCategory : orderByParam.replace('Id','');

      // splitting result by filter ids and storing it in graphSplitData
      let existentIds = [];
      let paramArg = this.comparingSameType ? this.actualCategory + 'Ids' : orderByParam + 's';
      let paramArgIds = Object.keys(input).length ? input[paramArg].split(',') : [];
      let graphSplitData: IHash = {};
      for(let i = 0; i < paramArgIds.length; i++){
        graphSplitData[paramArgIds[i]] = [];
      }

      // sort data based on order of ids in sorting filter param
      rawData.sort(function(a, b){
        return paramArgIds.indexOf(a[orderByParam].toString()) - paramArgIds.indexOf(b[orderByParam].toString());
      });

      for(let vars of rawData) {
        if(this.comparingSameType){
          if(graphSplitData[vars.id]){
            graphSplitData[vars.id].push(vars);
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          }
        } else {
          if(!existentIds.includes(vars.id)){
            existentIds.push(vars.id);
          }
          if(!this.breadcrumbsData['names'].includes(vars[orderByParamName]))
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          graphSplitData[vars[orderByParam]].push(vars);
        }
      }

      this.breadcrumbsData['category'] = this.actualCategory;
      this.breadcrumbsData['title'] = titleCategory;
      this.breadcrumbsData['type'] = this.actualGraphicType;

      this.charts = Object.keys(graphSplitData).filter(k => {
        if(graphSplitData[k].length > 0) 
          return k;
      });
      this.chartsReady = true;
      this.cd.detectChanges();
      
      // fill graphSplitData with nulls in empty spaces to make data correlation easier
      for(let i = 0; i < existentIds.length; i++){
        paramArgIds.forEach(id => {
          // if theres any data
          let value = graphSplitData[id];
          if(value.length > 0){
            if(!value[i] || (value[i]['id'] !== existentIds[i])){
              value.splice(i, 0, {id: existentIds[i], index: i});
            }
          }
        })
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
      let chart, chartIndex = 0;
      let dataIndex = 0;
      this.table = [[...tableHeaders]];
      let columnIndex;
      this.colSpan = this.comparingSameType ? 1 : this.charts.length;
      let rowIndex = 1;
      let tableData: any[];
      let columnHeaders: string[] = [];
      let name;
      let titleName;

      let chartData: IHashString = {};

      paramArgIds.forEach((key) => {
        if(graphSplitData[key].length > 0){
          columnIndex = this.comparingSameType ? 0 : this.charts.indexOf(key);
          rowIndex = this.comparingSameType ? rowIndex : 2;
          names = [], nApps = [], nPages = [], nPassed = [],
          nFailed = [], nCantTell = [], 
          nInapplicable = [], nUntested = [];
          resultData = [];
          dataIndex = 0;
          titleName = '';
          for(let vars of graphSplitData[key]){
            tableData = [];
            testId = vars.id ? vars.id : 0;
            name = '';

            if(vars.index !== undefined){
              test = '-';
            } else {
              // get name of variable to put on checkboxes and data
              if(this.actualCategory === 'sc'){
                test = vars.name ? 'SC ' + testId + ' - ' + vars.name : 'Unspecified';
              } else {
                test = vars.name ? vars.name : 'Unspecified';
              }
              // get name of orderByParam to put on chart title
              if(titleName.length === 0){
                titleName = vars[orderByParamName];
                // adding titleName to legend
              }

              if(this.unitedChart)
                chartData[titleName] = [];
            }
            
            idInParams = filterArray.includes(testId.toString());
            if(test !== '-' && !checkboxesPossibilities.includes(test)){
              checkboxesPossibilities.push(test);
              this.xAxisVars.push({name: test, id: testId, checked: !idInParams});
            }

            // only passes if [id not in filter] or [it was manually filled with null and not same index]
            if(!idInParams || (vars.index !== undefined && vars.index !== dataIndex)){
    
              // handling x axis
              if(this.actualCategory === 'sc'){
                name = 'SC ' + testId;
              } else {
                name = test;
              }
              names.push(name);
    
              // handling y axis and table data
              if(vars.index !== undefined){
                if(this.actualGraphicType === 'assertions'){
                  tableData.push(0);
                  if(!this.unitedChart)
                    nPages.push(0);
                }
                tableData.push(0,0,0,0,0);

                if(!this.unitedChart){
                  nPassed.push(0);
                  nFailed.push(0);
                  nCantTell.push(0);
                  nInapplicable.push(0);
                  nUntested.push(0);
                } else {
                  chartData[titleName].push(...tableData);
                }
              } else {
                if(this.actualGraphicType === 'assertions'){
                  tableData.push(vars.nPages);
                  if(!this.unitedChart)
                    nPages.push(vars.nPages);
                }
                tableData.push(vars.nPassed);
                tableData.push(vars.nFailed);
                tableData.push(vars.nCantTell);
                tableData.push(vars.nInapplicable);
                tableData.push(vars.nUntested);

                if(!this.unitedChart){
                  nPassed.push(vars.nPassed);
                  nFailed.push(vars.nFailed);
                  nCantTell.push(vars.nCantTell);
                  nInapplicable.push(vars.nInapplicable);
                  nUntested.push(vars.nUntested);
                } else {
                  chartData[titleName].push(...tableData);
                }
    
              }
              this.table = this.addDataToTable(tableData, rowIndex, columnIndex, this.colSpan, this.table);
              this.table = this.addRowHeaderToTable(name, rowIndex, this.table);
              rowIndex++;
            }
            // handling table headers
            if(!this.comparingSameType){
              if(vars[orderByParamName] && !columnHeaders.includes(vars[orderByParamName])){
                columnHeaders.push(vars[orderByParamName]);
                this.table = this.addColumnHeaderToTable(vars[orderByParamName], columnIndex, this.colSpan, this.table);
              }
            }
            dataIndex++;
          }

          // if its united chart, names will be filled only with one name so we need to fill it with the correct xAxis names
          if(this.unitedChart){
            names = [...tableHeaders];
          }

          // if theres data to present -> does not load empty charts
          if(names.length > 0){
      
            let visibleSeries = [];
            for(let i = 0; i <= 5; i++){
              visibleSeries.push(this.isSeriesVisible(i));
            }

            if(!this.unitedChart){
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
            } else {
              Object.keys(chartData).forEach((k) => {
                resultData.push({
                  id: k,
                  name: k,
                  data: chartData[k]
                });
              });
            }
            
            if(!(this.unitedChart && resultData.length !== paramArgIds.length)){
              chart = Highcharts.chart({
                chart: {
                  type: 'column',
                  animation: false,
                  renderTo: 'chart'+chartIndex
                },
                title: {
                  text: !this.unitedChart ? 
                    LABELS_SINGULAR[titleCategory] + ' ' + titleName + ' column chart':
                    LABELS_PLURAL[titleCategory] + ' ' + 
                    Object.keys(chartData).slice(0, -1).join(', ') + ' and ' + Object.keys(chartData).slice(-1) + 
                    ' column chart'
                },
                //to enable a single tooltip to all series at one point
                tooltip: {
                  enabled: true,
                  shared: true
                },
                credits: {
                  enabled: false
                },
                exporting: {
                  accessibility:{
                    enabled: true
                  },
                  showTable: this.actualCharts[chartIndex] ? this.actualCharts[chartIndex].options.exporting.showTable : false,
                  menuItemDefinitions: {
                    // toggle data table
                    viewData: {
                        onclick: () => {
                          let element;
                          this.showTable = !this.showTable;
                          this.cd.detectChanges();
                          if(this.comparingSameType)
                            element = document.getElementById("tableSame");
                          else
                            element = document.getElementById("tableDiff");
                          
                          if(this.showTable){
                            element.focus();
                            element.scrollIntoView();
                          } 
        
                          this.updateMenuTableText();
                          /*if(this.actualCharts[chartIndex] && this.actualCharts[chartIndex].options.exporting.showTable){
                            let element = document.getElementsByClassName("highcharts-data-table");
                            if(element)
                              element[0].removeChild(element[0].childNodes[0]);
                          }
                          this.actualCharts[chartIndex].update({
                            exporting: {
                              showTable: !this.actualCharts[chartIndex].options.exporting.showTable
                            }
                          });*/
                          //testCharts[i].reflow();
                        },
                        text: this.showTable ? 'Hide data table' : 'Show and go to data table'
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
                    cursor: !this.comparingSameType ? 'pointer' : undefined,
                    events: {
                        legendItemClick: (e) => {
                          this.updateBySelection(e.target['_i'], 1, e);
                        }              
                    },
                    point: {
                      events: {
                        click: (e) => {
                          if(!this.comparingSameType)
                            this.onPointSelect(e, key);
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
                chart.setSubtitle({text: subtitle});
        
              this.actualCharts.push(chart);
              chartIndex++;
            }
          }
        } else {
          this.failedIds.push(key);
        }
      });
      console.log('failedIds', this.failedIds);
      this.tableReady = true;

      if(this.actualCategory === 'eval'){
        this.xAxisVars.sort(function(a, b){
          return a.name.localeCompare(b.name);
        });
      }

      // show tooltip on all graphic on mouse hover or keyboard focus
      Array.from(document.getElementsByClassName('chart')).forEach((x) => {
        ['mousemove', 'touchmove', 'touchstart', 'keyup', 'mouseleave'].forEach((eventType) => {
          x.addEventListener( 
            eventType,
            (e) => {
              if(e.type === 'mouseleave'){
                for (let i = 0; i < this.actualCharts.length; i++) {
                  chart = this.actualCharts[i];
                  if (chart) chart.pointer.reset();
                }
              } else {
                if(e.target['point']){
                  let chart, point, i, j, event, serie, points = [];
                  //let chartIndex = +e['path'][5]['id'].replace('chart','');
                  for (i = 0; i < this.actualCharts.length; i++) {
                    points = [];
                    chart = this.actualCharts[i];
                    if (!chart) continue;
    
                    // Find coordinates within the chart
                    event = chart.pointer.normalize(e);
            
                    for (j = 0; j < chart.series.length; j++) {
                      serie = chart.series[j];
                      if (!serie.visible || serie.enableMouseTracking === false) continue;
    
                      point = serie.points[e.target['point']['index']];
    
                      // Get point differently if it's from a keyboard focus ou a mouse hover
                      /*if(e['keyCode'] && [37, 38, 39, 40].includes(e['keyCode'])){
                      point = serie.points[e.target['point']['index']];
                      } else {
                        point = serie.searchPoint(event, false);
                      }*/
    
                      // Get the hovered point
                      if (point) points.push(point); 
                    }
    
                    if (points.length) {
                      if (chart.tooltip.shared) {
                          chart.tooltip.refresh(points);
                      } else {
                          chart.tooltip.refresh(points[0]);
                      }
                      chart.xAxis[0].drawCrosshair(e, points[0]);
                    }
                  }
                }
              }
            }
          );
        });
      });
    }
  }

  addDataToTable(data: number[], rowIndex: number, columnIndex: number, addColumnIndex: number, table: any[]): any[] {
    // +1 because header will be the first column
    let actualColIndex = columnIndex+1;
    for(let i = 0; i < data.length; i++){
      if(!table[rowIndex])
        table[rowIndex] = [];
      table[rowIndex][actualColIndex] = data[i];
      actualColIndex += addColumnIndex;
    }
    return table;
  }
  addRowHeaderToTable(header: string, rowIndex: number, table: any[]): any[] {
    if(header !== undefined && header !== '-' && header !== ''){
      if(!table[rowIndex])
          table[rowIndex] = [];
      table[rowIndex][0] = header;
    }
    return table;
  }
  addColumnHeaderToTable(header: string, columnIndex: number, addColumnIndex: number, table: any[]): any[] {
    let totalColumns = this.actualGraphicType === 'assertions' ? 6 : 5;
    let actualColIndex = columnIndex;
    for(let i = 0; i < totalColumns; i++){
      if(!table[1])
          table[1] = [];
      table[1][actualColIndex] = header;
      actualColIndex += addColumnIndex;
    }
    return table;
  }
  
  updateMenuTableText() {
    let updatedText = this.showTable ? 'Hide data table' : 'Show and go to data table';
    for(let c of this.actualCharts){
      c.update(
        {exporting: {
          menuItemDefinitions: {
            viewData: {
              text: updatedText
            }
          }
        }});
    }
  }

  isSeriesVisible(index: number): boolean {
    let result;
    let parameterParam = this.activatedRoute.snapshot.queryParams['p'];
    let i = index.toString();
    // visible if index exists on p queryParam or
    // if studying assertions, visible nPages (i=0) or
    // if studying scriteria, visible nPassed and nFailed (i=0,1)
    if(parameterParam){
      result = parameterParam.split(',').includes(i);
    } else {
      if(this.actualGraphicType === 'assertions'){
        result = index === 0;
      } else {
        result = index === 0 || index === 1;
      }
    }
    return result;
  }

  comparingCategory(data: any){
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: data.queryParams
    });
  }

  clearExistentCharts() {
    let existentCharts = Highcharts.charts.filter(x => {if(x !== undefined) return x;});
    for(let chart of existentCharts){
      chart.destroy();
    }
  }

  changeType() {
    if(this.actualGraphicType === 'assertions'){
      this.router.navigate(['/compare/scriteria/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/compare/assertions/'+this.actualCategory], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  changeGraphicType() {
    this.router.navigate([], {
      queryParams: {
        graph: this.unitedChart ? 0 : 1
      },
      queryParamsHandling: 'merge'
    });
  }

  removeAllFilters() {
    this.router.navigate([], {
      queryParams: {
        filter: null
      },
      queryParamsHandling: 'merge'
    });
  }
}

export interface IHash {
  [index: number] : any[];
} 
export interface IHashString {
  [index: string] : any[];
} 