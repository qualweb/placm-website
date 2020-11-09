import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { CompareDialogComponent } from 'app/dialogs/compare-dialog/compare-dialog.component';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS, queryParamsRegex } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as Highcharts from 'highcharts';
//import * as R from 'ramda';

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
  checkboxClick = false;

  homepageUrl: string; 

  sCriteriaVisible: boolean;

  charts: any[];
  actualCharts: any[] = [];

  chartsReady: boolean = false;
  tableReady: boolean = false;

  comparingSameType: boolean;
  //oneCheckboxSelected: boolean;
  colSpan: number;
  rowIndex: number;

  table: any[];
  showTable: boolean = false;

  failedIds: any[] = [];
  unitedChart: boolean = false;

  breadcrumbsData = {
    comparing: true
  };
  
  error: boolean = false;
  errorMessage: number = 0;

  legendAlreadyClicked: boolean = false;

  //loadingBackground: boolean = false;

  /* selectAllClicked: boolean = false;
  unselectAllClicked: boolean = false;
  checkboxData: any;
  loadingCharts: boolean = false; */

  // these two variables can store either one resultData/names array (unitedChart) 
  // or multiple (comparingSameType || !comparingSameType)
  /* chartResultData: any = [];
  chartNames: any = [];
  actualChartResultData: any = [];
  actualChartNames: any = []; */

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

    this.clearExistentCharts();
    // if queryparams changed (even if first load!), but it was a legend change from united charts, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        // make it a bit faster but showing and hiding charts instead of loading them all
        if(this.checkboxClick && this.comparingSameType && !this.unitedChart){
          this.handleCheckboxClick();
          this.afterCheckboxClick();
        } else {
          // load all charts again
          this.clearExistentCharts();
          await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
          if(this.checkboxClick){
            this.afterCheckboxClick();
          }
        }
      }
    });
  }

  afterCheckboxClick() {
    let element = document.getElementById("checkboxes");
    element.scrollIntoView();
    this.checkboxClick = false;
  }

  handleCheckboxClick(){
    let resetIds = [];
    let hideIds = [];
    let pArray = this.getPParamsArray();
    let filterArray = this.getFilterParamsArray();

    // get to know which indexes of checkboxes are clicked
    for(let x = 0; x < this.xAxisVars.length; x++){
      let id = this.xAxisVars[x].id;
      let toHide = !this.unitedChart ? filterArray.indexOf(id.toString()) >= 0 : pArray.indexOf(x.toString()) < 0;
      if(!toHide){
        resetIds.push('chart'+x);
      } else {
        hideIds.push('chart'+x);
      }
      this.xAxisVars[x].checked = !toHide;
    }

    // make charts visible if checkbox clicked
    let chart;
    for(let chartId of hideIds){
      chart = document.getElementById(chartId).style.display = 'none';
    }
    for(let chartId of resetIds){
      chart = document.getElementById(chartId).style.display = 'block';
    }
  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number, e?: any): void {
    this.legendChange = type === 1 && !this.unitedChart;
    this.checkboxClick = type === 0 || (type === 1 && this.unitedChart);
    //this.checkboxData = e;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let queryParamsArray = [];
    let actualFilterExists = false;
    let workingParam = type === 0 ? (!this.unitedChart ? 'filter' : 'p') : 'p';
    let assertionsGraphic = this.actualGraphicType === 'assertions';
    
    let emptyParamString = '';
    if(this.legendChange){
      if(assertionsGraphic){
        if(id === 0){
          if(this.legendAlreadyClicked){
            emptyParamString = '"' + workingParam + '":"';
            emptyParamString += id.toString() + '"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!this.legendAlreadyClicked)
            emptyParamString += '0,';
          emptyParamString += id.toString() + '"';
        }
      } else {
        if([0,1].includes(id)){
          emptyParamString = '"' + workingParam + '":"';
          if(this.legendAlreadyClicked){
            emptyParamString += id.toString() + '"';
          } else {
            emptyParamString += id === 0 ? '1"' : '0"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!this.legendAlreadyClicked)
            emptyParamString +=  '0,1,';
          emptyParamString += id.toString() + '"';
        }
      }
      this.legendAlreadyClicked = true;
    } else {
      emptyParamString = '"' + workingParam + '":"';
      emptyParamString += id.toString() + '"';
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

    for(let c of this.actualCharts){
      // if legend click and click not on chart clicked
      // to make all charts update legend
      if(type === 1 && e.target.chart.renderTo !== c['renderTo']){
        // setVisible toggles visibility
        c.series[id].setVisible();
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

  getPParamsArray(): string[] {
    let p = this.activatedRoute.snapshot.queryParams['p'];
    // if there were any filters active (in the url)
    if(p){
      return p.split(',');
    } else {
      return [];
    }
  }

  getOrderByParam(input: any): string {
    let result;
    let params = Object.keys(input);
    if(params.length && !params[0].includes(this.actualCategory)){
      this.comparingSameType = false;
      // usually categoryId (eg. tagId or continentId)
      result = params[0].substring(0, params[0].length - 1);
    } else {
      this.comparingSameType = true;
      if(this.actualCategory === 'rule'){
        result = 'name';
      } else {
        result = 'id';
      }
    }
    return result;
  }

  // paramArgInfo here can be all ids of paramArg or id of paramArg
  onPointSelect(e: any, paramArgInfo: number|string, outsideClick: boolean = false, xAxisIndex?: number, chartIndex?: number): void {
    // outsideClick - mouse click outside of column
    // e.point - mouse click on column
    // e.target - keyboard press on column
    if(outsideClick || e.point || e.target){
      let data = outsideClick ? {} : (e.point ? e.point : e.target);
      let checkedCheckboxes = this.xAxisVars.filter(x => {if(x.checked === true) return x;});

      let titleString = outsideClick ? e.title.textStr : data.series.chart.title.textStr;
      for(let value of Object.values(LABELS_SINGULAR)){
        titleString = titleString.replace(value, '');
      }
      let graphTitle = titleString.replace(' column chart','').trim();

      // manually assigning data if clicked outside
      if(outsideClick){
        data.category = checkedCheckboxes[xAxisIndex].name;
        // no variable clicked, so its empty
        data.series = {
          'userOptions': {
            id: ''
          }
        };
        data.index = xAxisIndex;
      }
      
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
        id: checkedCheckboxes[data.index].id,
        queryParams: this.activatedRoute.snapshot.queryParams,
        graphTitle: graphTitle,
        graphId: outsideClick ? +paramArgInfo[chartIndex] : +paramArgInfo
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
    /* this.chartResultData = [];
    this.chartNames = []; */
    this.breadcrumbsData = {
      comparing: true
    };
    let assertionsGraphic = this.actualGraphicType === 'assertions';
    this.breadcrumbsData['names'] = [];
    let data, rawData;
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

    // 1. prepare legend names and table headers //
    if(assertionsGraphic){
      variableName = this.actualGraphicType;
      tableHeaders = ['# pages']
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
    // 1. -------------------------------------- //
  
    // 2. clear dirty queryParams //
    if(!isEmpty(input)){
      let removed;
      for(let params in input){
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
        } else {
          // remove all queryParams that not possible
          ({[params]: removed, ...input} = input);
        }
      }
    }
    // 2. ----------------------- //

    // 3. get data and send errors //
    // only send first queryParam while comparing!
    let firstParam = Object.keys(input)[0];
    let firstParamInput;
    if(!!firstParam){
      //firstParamInput = JSON.parse('{"' + firstParam + '":"' + input[firstParam] + '"}')
    } else {
      // we need to have queryParams while comparing!
      this.error = true;
      this.errorMessage = -1;
    }

    if(!this.error){  
      try{
        // input can't be sent as '{}' in this function
        data = await this.combinedService.getData(this.actualCategory, this.actualGraphicType, input, true);
      } catch (err){
        this.error = true;
        this.errorMessage = 3;
      }

      if(data && data['success'] === 1){
        if(data['result'].length){
          rawData = data['result'];
        } else {
          this.error = true;
          this.errorMessage = -2;
        }
      } else {
        this.error = true;
        this.errorMessage = 4;
      }
    }
    
    // 3. ------------------------ //

    let existentIds = [];
    let filterArray, pArray;
    let titleCategory, paramArg, orderByParam, orderByParamName;

    if(!this.error){
      filterArray = this.getFilterParamsArray();
      pArray = this.getPParamsArray();
      orderByParam = this.getOrderByParam(input);
      //this.comparingSameType = orderByParam === 'id' || orderByParam === 'name';
      // ^ now being done in getOrderByParam()
      this.unitedChart = this.comparingSameType && 
        this.activatedRoute.snapshot.queryParams.graph === '1';

      if(this.comparingSameType){
        titleCategory = this.actualCategory;
        paramArg = this.actualCategory + 'Ids';
        orderByParamName = 'name';
      } else {
        titleCategory = orderByParam.replace('Id','');
        paramArg = orderByParam + 's';
        orderByParamName = titleCategory + 'Name';
      }
      let paramArgIds = input[paramArg].split(',');

      // fill null with unspecified (only happens in continent, country or tags)
      if(['continent', 'country', 'tag'].includes(titleCategory)){
        rawData = rawData.map(x => {
          // if not comparingSameType
          if(x[orderByParam] === null){
            x[orderByParam] = 0;
            x[orderByParamName] = 'Unspecified'
          }
          // if comparingSameType
          if(x.id == null){
            x.id = 0;
          }
          return x;
        });
      }

      // sort data based on order of ids in sorting filter param
      // extremely necessary while not comparingSameType
      /* rawData.sort(function(a, b){
        return paramArgIds.indexOf(a[orderByParam].toString()) - paramArgIds.indexOf(b[orderByParam].toString());
      }); */

      // splitting result by paramArgIds and storing it in graphSplitData
      let graphSplitData: IHash = {};
      for(let i = 0; i < paramArgIds.length; i++){
        graphSplitData[paramArgIds[i]] = [];
      }

      for(let vars of rawData) {
        if(this.comparingSameType){
          if(graphSplitData[vars.id]){
            graphSplitData[vars.id].push(vars);
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          }
        } else {
          if(!existentIds.includes(vars.id))
            existentIds.push(vars.id);
          if(!this.breadcrumbsData['names'].includes(vars[orderByParamName]))
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          graphSplitData[vars[orderByParam]].push(vars);
        }
      }

      /* let selectedCheckboxes = existentIds.filter(x => {if(!filterArray.includes(x)) return x});
      this.oneCheckboxSelected = !this.comparingSameType && selectedCheckboxes.length === 1; */

      this.breadcrumbsData['category'] = this.actualCategory;
      this.breadcrumbsData['title'] = titleCategory;
      this.breadcrumbsData['type'] = this.actualGraphicType;

      // 4. load charts in dom //
      this.charts = paramArgIds.filter(id => {
        if(graphSplitData[id].length > 0) 
          return id;
      });
      this.chartsReady = true;
      this.cd.detectChanges();
      // 4. ------------------ //
      
      // 5. fill graphSplitData with nulls in empty spaces to make data correlation easier //
      // only happens while not comparingSameType
      for(let i = 0; i < existentIds.length; i++){
        paramArgIds.forEach(id => {
          // if theres any data
          let value = graphSplitData[id];
          if(value.length > 0){
            if(value[i]){
              if(value[i]['id'] !== existentIds[i]){
                let correctIndex = value.findIndex((item, index) => {
                  return item.id === existentIds[i];
                });
                if(correctIndex >= i) {
                  value.splice(i, 0, value[correctIndex]);
                  value.splice(correctIndex+1, 1);
                } else {
                  value.splice(i, 0, {id: existentIds[i], index: i});
                }
              }
            } else {
              value.splice(i, 0, {id: existentIds[i], index: i});
            }
          }
        });
      }
      // 5. ------------------------------------------------------------------------------ //

      let names = [], nApps = [], nPages = [], nPassed = [],
          nFailed = [], nCantTell = [], 
          nInapplicable = [], nUntested = [];

      this.xAxisVars = [];
      let test, testId;
      let chart, chartIndex = 0;
      let dataIndex = 0;
      this.table = [[...tableHeaders]];
      let columnIndex;
      this.colSpan = this.comparingSameType ? 1 : this.charts.length;
      this.rowIndex = 1;
      let tableData: any[];
      let columnHeaders: string[] = [];
      let name;
      let titleName;
      let checkboxIndex = 0;
      let maxValue = 0;

      let chartData: IHashString = {};

      paramArgIds.forEach((key) => {
        if(graphSplitData[key].length > 0){
          columnIndex = this.comparingSameType ? 0 : this.charts.indexOf(key);
          this.rowIndex = this.comparingSameType ? this.rowIndex : 2;
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
            
            idInParams = filterArray.includes(testId.toString()) || (this.unitedChart && !pArray.includes(checkboxIndex.toString()));
            if(test !== '-' && !checkboxesPossibilities.includes(test)){
              checkboxesPossibilities.push(test);
              let checkId = this.unitedChart ? checkboxIndex : testId;
              this.xAxisVars.push({name: test, id: checkId, dbId: testId, checked: !idInParams, groupById: +key});
              checkboxIndex++;
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
                if(assertionsGraphic){
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
                if(assertionsGraphic){
                  tableData.push(vars.nPages);
                  if(!this.unitedChart)
                    nPages.push(vars.nPages);
                }
                tableData.push(vars.nPassed);
                tableData.push(vars.nFailed);
                tableData.push(vars.nCantTell);
                tableData.push(vars.nInapplicable);
                tableData.push(vars.nUntested);
                let max = Math.max(...tableData);
                maxValue = max > maxValue ? max : maxValue;

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
              this.table = this.addDataToTable(tableData, this.rowIndex, columnIndex, this.colSpan, this.table);
              this.table = this.addRowHeaderToTable(name, this.rowIndex, this.table);
              this.rowIndex++;
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

            if(!this.unitedChart){
              let i = 0;
              for(let i = 0; i <= 5; i++){
                visibleSeries.push(this.isSeriesVisible(i));
              }

              if(assertionsGraphic){
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
              let i = 0;
              Object.keys(chartData).forEach((k) => {
                resultData.push({
                  id: k,
                  name: k,
                  data: chartData[k],
                  visible: this.isSeriesVisible(i)
                });
                i++;
              });
            }
            
            if(!(this.unitedChart && resultData.length !== paramArgIds.length)){
              /* this.chartResultData.push(resultData);
              this.chartNames.push(names);

              this.actualChartResultData.push(resultData);
              this.actualChartNames.push(names); */

              chart = Highcharts.chart({
                chart: {
                  type: 'column',
                  animation: false,
                  renderTo: 'chart'+chartIndex,
                  events: {
                    click: (e: any) =>  {
                      if(!this.comparingSameType){
                        let xAxisValue = Math.abs(Math.round(e.xAxis[0].value));
                        let chartIndex = +e.path[3].id.replace('chart','');
                        this.onPointSelect(this.actualCharts[chartIndex], paramArgIds, true, xAxisValue, chartIndex);
                      }
                    }
                  },
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
                  buttons: {
                    contextButton: {
                      menuItems: ['viewData', 'separator', "viewFullscreen", "printChart", "separator", "downloadPNG", "downloadPDF", "downloadSVG", 'separator', 'downloadCSV', 'downloadXLS']
                    }
                  }
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
                yAxis: {
                  min: 0 
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
                          this.updateBySelection(e.target['index'], 1, e);
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
      
      let checkedCheckboxes = this.xAxisVars.filter(x => {if(x.checked === true) return x;});
      if(checkedCheckboxes.length === 1){
        this.breadcrumbsData['comparingByOne'] = checkedCheckboxes[0].name;
      }
      //console.log('failedIds', this.failedIds);
      this.tableReady = true;

      if(this.actualCategory === 'eval' || this.actualCategory === 'type'){
        this.xAxisVars.sort(function(a, b){
          return a.name.localeCompare(b.name);
        });
      }

      // set the maximum yaxis value and set it to all charts
      /* let yAxisMax = 0;
      for(let chart of this.actualCharts){
        yAxisMax = chart.yAxis[0].max > yAxisMax ? chart.yAxis[0].max : yAxisMax;
      }  */
      for(let chart of this.actualCharts) {
        chart.yAxis[0].update({
          max: maxValue
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
      if(!this.unitedChart){
        if(this.actualGraphicType === 'assertions'){
          result = index === 0;
        } else {
          result = index === 0 || index === 1;
        }
      } else {
        result = false;
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
    let newQueryParams = {};
    if(this.actualGraphicType === 'assertions'){
      if(!this.unitedChart){
        newQueryParams = {p: '0,1'};
      }
      this.router.navigate(['/compare/scriteria/'+this.actualCategory], {
        queryParams: newQueryParams,
        queryParamsHandling: 'merge'
      });
    } else {
      if(!this.unitedChart){
        newQueryParams = {p: '0'};
      }
      this.router.navigate(['/compare/assertions/'+this.actualCategory], {
        queryParams: newQueryParams,
        queryParamsHandling: 'merge'
      });
    }
  }

  changeGraphicType() {
    let futureFilters = []; 
    if(!this.unitedChart){
      // nVars here is equal to the number of checkboxes
      let nVars = this.xAxisVars.length;
      let filters = this.getFilterParamsArray();
      futureFilters = [...Array(nVars).keys()];
      if(filters.length){
        for(let filter of filters){
          let idIndex = this.xAxisVars.findIndex(x => +x.dbId === +filter);
          if(idIndex >= 0){
            futureFilters = futureFilters.filter(x => x !== idIndex);
          }
        }
      }
    } else {
      let pFilters = this.getPParamsArray();
      if(pFilters.length){
        futureFilters = this.xAxisVars.map(x => x.dbId);
        for(let p of pFilters){
          futureFilters = futureFilters.filter(x => x !== this.xAxisVars[+p].dbId);
        }
      }
      this.legendAlreadyClicked = false;
    }
    
    this.router.navigate([], {
      queryParams: {
        graph: this.unitedChart ? 0 : 1,
        // if its not united chart, it will fill p parameter with 0,1,2,... 
        // to make the checkbox click equal to the legend click
        p: this.unitedChart ? null : futureFilters.join(','),
        // if its united chart, it will fill filter parameter with all ids... 
        // to make the legend click equal to the checkbox click
        filter: this.unitedChart ? (futureFilters.length ? futureFilters.join(',') : null) : null
      },
      queryParamsHandling: 'merge'
    });
  }

  selectAllCheckboxes() {
    // p is a positive filter - if its in 'p', it is on the chart
    // filter is a negative filter - if its in 'filter', its not on the chart
    this.checkboxClick = true;
    //this.selectAllClicked = true;
    if(this.unitedChart) {
      let nVars = this.xAxisVars.length;
      this.router.navigate([], {
        queryParams: {
          p: [...Array(nVars).keys()].join(',')
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        queryParams: {
          filter: null
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  unselectAllCheckboxes() {
    // p is a positive filter - if its in 'p', it is on the chart
    // filter is a negative filter - if its in 'filter', its not on the chart
    this.checkboxClick = true;
    //this.unselectAllClicked = true;
    if(this.unitedChart) {
      this.router.navigate([], {
        queryParams: {
          p: null
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        queryParams: {
          filter: this.xAxisVars.map(x => x.id).join(',')
        },
        queryParamsHandling: 'merge'
      });
    }
    this.showTable = false;
  }

  // toAdd - true if add clickedId to series, false if remove clickedId from series
  /* oldHandleCheckboxClick() {
    let oldIndex, toAdd, clickedId;
    if(this.checkboxData){
      oldIndex = this.checkboxData.index;
      toAdd = this.checkboxData.checked;
      clickedId = this.checkboxData.id;
    }
    let checkedCheckboxesIds = [];
    // if its clicked, its data to show
    //let checkboxesClickedIndexes = [];
    let resetIds = [];
    let hideIds = [];
    let pArray = this.getPParamsArray();
    let filterArray = this.getFilterParamsArray();

    // get to know which indexes of checkboxes are clicked
    for(let x = 0; x < this.xAxisVars.length; x++){
      let id = this.xAxisVars[x].id;
      let toHide = !this.unitedChart ? filterArray.indexOf(id.toString()) >= 0 : pArray.indexOf(x.toString()) < 0;
      if(!toHide){
        //checkboxesClickedIndexes.push(x);
        checkedCheckboxesIds.push(id);
        resetIds.push('chart'+x);
      } else {
        hideIds.push('chart'+x);
      }
      this.xAxisVars[x].checked = !toHide;
      //if(this.unitedChart){
      //  // make series visible if checkbox clicked
      //  this.actualCharts[0].series[x].setVisible(!toHide);
      //}
      //if(this.selectAllClicked){
      //  this.xAxisVars[x].checked = true;
      //} else if(this.unselectAllClicked){
      //  this.xAxisVars[x].checked = false;
      //}
    }
    let actualIndex = checkedCheckboxesIds.indexOf(clickedId);

    if(this.comparingSameType && !this.unitedChart){
      // make charts visible if checkbox clicked
      let chart;
      for(let chartId of hideIds){
        chart = document.getElementById(chartId).style.display = 'none';
      }
      for(let chartId of resetIds){
        chart = document.getElementById(chartId).style.display = 'block';
      }
    }
    
    if(!this.comparingSameType){
      let firstTime = Date.now();
      if(this.selectAllClicked || this.unselectAllClicked){
        this.actualChartResultData = R.clone(this.chartResultData);
        if(this.selectAllClicked){
          this.actualChartNames = R.clone(this.chartNames);
        } else if(this.unselectAllClicked){
          for(let i = 0; i < this.actualChartResultData.length; i++){
            for(let series of this.actualChartResultData[i]){
              series.data = [];
            }
            this.actualChartNames[i] = [];
          }
        }
      }
      let secondTime = Date.now();
      let thirdTime, fifthTime, sixthTime;
      console.log("all buttons", secondTime - firstTime);
      for(let i = 0; i < this.chartResultData.length; i++){
        console.log(this.actualChartNames);
        thirdTime = Date.now();
        // show all data if selectAllCheckboxes clicked
        // hide all data if unselectAllCheckboexes clicked
        // make data of series visible (in every chart) if checkbox clicked
        //if(this.selectAllClicked){
        //   this.actualChartResultData[i] = R.clone(this.chartResultData[i]);
        //  this.actualChartNames[i] = R.clone(this.chartNames[i]);
        //} else if(this.unselectAllClicked){
        //  this.actualChartResultData[i] = R.clone(this.chartResultData[i]);
        //  for(let series of this.actualChartResultData[i]){
        //    series.data = [];
        //  }
        //  this.actualChartNames[i] = [];
        //} else {
        //  for(let s = 0; s < this.actualChartResultData[i]; s++){
        //     if(!toAdd){
        //      this.actualChartResultData[i][s].data.splice(actualIndex, 1);
        //    } else {
        //      this.actualChartResultData[i][s].data.splice(actualIndex, 0, this.chartResultData[i][s][oldIndex]);
        //    }
        //    this.actualCharts[i].series[s].setData(this.actualChartResultData[i][s].data);
        //  }
        if(!(this.selectAllClicked || this.unselectAllClicked)){
          for(let s = 0; s < this.chartResultData[i].length; s++){
            fifthTime = Date.now();
            //console.log(this.actualCharts[i].series, oldIndex);
            //this.actualCharts[i].series[s].data[oldIndex].visible = toAdd;
            if(!toAdd){
              this.actualChartResultData[i][s].data.splice(actualIndex, 1);
            } else {
              this.actualChartResultData[i][s].data.splice(actualIndex, 0, this.chartResultData[i][s][oldIndex]);
            }
            sixthTime = Date.now();
            console.log("series splice", sixthTime - fifthTime);
            this.actualCharts[i].series[s].setData(this.actualChartResultData[i][s].data, false, false, false);
            console.log("series SET", Date.now() - sixthTime);
          }
          if(!toAdd){
            this.actualChartNames[i].splice(actualIndex, 1);
          } else {
            this.actualChartNames[i].splice(actualIndex, 0, this.chartNames[i][oldIndex]);
          }
        } else {
          this.actualCharts[i].update({
            series: this.actualChartResultData[i]
          }); 
        }
        let fourthTime = Date.now();
        console.log(this.actualChartNames);
        console.log("chart", fourthTime - thirdTime);
        this.actualCharts[i].xAxis[0].setCategories(this.actualChartNames[i], false);
        this.actualCharts[i].redraw(false);
        console.log("redraw", Date.now() - fourthTime);
      }
      console.log("all", Date.now() - firstTime);
      this.selectAllClicked = false;
      this.unselectAllClicked = false;
    }
  } */
}

export interface IHash {
  [index: number] : any[];
} 
export interface IHashString {
  [index: string] : any[];
} 

