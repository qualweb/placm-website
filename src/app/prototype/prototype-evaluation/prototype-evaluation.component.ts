import { Component, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { EvaluationService } from 'src/services/evaluation.service';
import { FormGroup } from '@angular/forms';
import * as cloneDeep from 'lodash.clonedeep';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'src/app/dialogs/drilldown-dialog/drilldown-dialog.component';

@Component({
  selector: 'app-prototype-evaluation',
  templateUrl: './prototype-evaluation.component.html',
  styleUrls: ['./prototype-evaluation.component.css']
})
export class PrototypeEvaluationComponent implements OnInit {
  chart: Chart;
  number: number;
  rawData: any;
  preparedData = [];
  evaluationTools = [];

  form: FormGroup;
  selectedPageUrls = [];
  variableIds = [];

  constructor(private evaluationService: EvaluationService, 
    private dialog: MatDialog) { }

  async ngOnInit() {    
    await this.fetchData();
    this.prepareData();

    this.chart = new Chart({
      chart: {
        type: 'column'
      },
      title: {
        text: 'Evaluation tools column chart'
      },
      subtitle: {
        text: 'Click each column and check console'
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
        categories: this.evaluationTools,
      },
      yAxis: {
      },
      scrollbar: {
        enabled: true
      },
      plotOptions: {
        series: {
          // disabling graphic animations
            animation: false,
            cursor: 'pointer',
            events: {
                click: function (e) {
                  const dialogConfig = new MatDialogConfig();
                  dialogConfig.autoFocus = true;
                  dialogConfig.data = {
                    category: e.point.category,
                    variable: e.point.series['userOptions'].id
                  }
                }
            },
            compare: 'value',
            showInNavigator: true
        }
      }
      /*series: [{
        //useless?
        id: 'myNameID',
        name: 'myName',
        data: [1,2,3],
        //useless?
        cursor: 'pointer',
        //useless?
        type: 'column'
      }]*/
    });
    for(let data of this.preparedData){
      this.chart.addSeries(data, true, true);
    }
  }

  onPointSelect(e){
    if(e.point){
      const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        category: e.point.category,
        variable: e.point.series['userOptions'].id
      }
      this.dialog.open(DrilldownDialogComponent, dialogConfig);
    }
  }

  private async fetchData() {
    let data;

    data = await this.evaluationService.getAll();

    if(data['success'] === 1){
      this.rawData = data['result'];
      console.log(this.rawData);
    } else {
      //todo rip query
    }
  }

  private prepareData() {
    let nApps = [], nPages = [], nPassed = [],
        nFailed = [], nCantTell = [], 
        nInapplicable = [], nUntested = [];
    for(let et of this.rawData){
      this.evaluationTools.push(et.name);
      nPassed.push(et.nPassed);
      nFailed.push(et.nFailed);
      nCantTell.push(et.nCantTell);
      nInapplicable.push(et.nInapplicable);
      nUntested.push(et.nUntested);
    }

    if(nApps.length){
      this.preparedData.push({
        id: 'nApps',
        name: '# applications',
        data: nApps
      });
      this.variableIds.push('nApps');
    }

    if(nPages.length){
      this.preparedData.push({
        id: 'nPages',
        name: '# pages',
        data: nPages
      });
      this.variableIds.push('nPages');
    }

    this.preparedData.push({
      id: 'nPassed',
      name: '# passed assertions',
      data: nPassed,
    });
    this.variableIds.push('nPassed');

    this.preparedData.push({
      id: 'nFailed',
      name: '# failed assertions',
      data: nFailed,
    });
    this.variableIds.push('nFailed');

    this.preparedData.push({
      id: 'nCantTell',
      name: '# cantTell assertions',
      data: nCantTell,
    });
    this.variableIds.push('nCantTell');

    this.preparedData.push({
      id: 'nInapplicable',
      name: '# inapplicable assertions',
      data: nInapplicable,
    });
    this.variableIds.push('nInapplicable');

    this.preparedData.push({
      id: 'nUntested',
      name: '# untested assertions',
      data: nUntested,
    });
    this.variableIds.push('nUntested');
    
    for(let et of this.evaluationTools){
      this.selectedPageUrls.push({et: et, checked: true});
    }
  }

  updateEvaluationToolSelection(e: any, et: string){
    let beforeChecked = this.selectedPageUrls.filter(function(x){
      return x.checked === true;
    }).map(function(x){
      return x.et;
    });

    let clickedTagIndex = this.selectedPageUrls.findIndex(function(item, i){
      return item.et === et;
    });
    this.selectedPageUrls[clickedTagIndex].checked = e.checked;

    let afterChecked = this.selectedPageUrls.filter(function(x){
      return x.checked === true;
    }).map(function(x){
      return x.et;
    });
    
    let actualData, index;
    let toChangeData = cloneDeep(this.preparedData);

    for(let i = 0; i < this.chart.ref.series.length; i++){
      actualData = cloneDeep(this.chart.ref.series[i]['yData']);
      if(e.checked) {
        index = afterChecked.indexOf(et);
        actualData.splice(index, 0, toChangeData[i].data[clickedTagIndex]);
      } else {
        index = beforeChecked.indexOf(et);
        actualData.splice(index, 1);
      }
      toChangeData[i].data = actualData;
      toChangeData[i].visible = this.chart.ref.series[i].visible;
    }

    removeAllSeries(this.chart);

    for(let data of toChangeData){
      this.chart.addSeries(data, false, false);
    }

    this.chart.ref.xAxis[0].setCategories(afterChecked);
  }
}

function removeAllSeries(chart: Chart): void{
  while(chart.ref.series.length > 0)
    chart.ref.series[0].remove(false, false);
}