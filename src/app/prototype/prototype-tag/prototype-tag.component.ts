import { Component, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { TagService } from 'src/services/tag.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as cloneDeep from 'lodash.clonedeep';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'src/app/dialogs/drilldown-dialog/drilldown-dialog.component';

// to apply theming - must be better to apply in ts
//import * as Highcharts from 'highcharts';
//require('highcharts/themes/dark-blue')(Highcharts);
 
@Component({
  selector: 'app-prototype-tag',
  templateUrl: './prototype-tag.component.html',
  styleUrls: ['./prototype-tag.component.css']
})
export class PrototypeTagComponent implements OnInit {

  chart: Chart;
  number: number;
  rawData: any;
  preparedData = [];
  tagNames = [];

  form: FormGroup;
  selectedTagNames = [];
  variableIds = [];

  constructor(private tagService: TagService, 
    private fb: FormBuilder, private dialog: MatDialog) { }

  async ngOnInit() {    
    await this.fetchData();
    this.prepareData();

    this.chart = new Chart({
      chart: {
        type: 'column'
      },
      title: {
        text: 'Tags column chart'
      },
      subtitle: {
        text: 'Click each column and check console'
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
        categories: this.tagNames,
      },
      // disabling graphic animations
      plotOptions: {
        series: {
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
                  console.log(e.point.category, e.point.series['userOptions'].id);
                }
            }
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
    
    /*data = await this.tagService.getNumber();
    if(data['success'] === 1){
      this.number = data['result'];
    } else {
      //todo rip query
    }*/

    data = await this.tagService.getAll();

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
    this.rawData = this.rawData.sort(function (a,b) {
          return a.name - b.name;
        });
    for(let tag of this.rawData){
      this.tagNames.push(tag.name);
      nApps.push(tag.nApps);
      nPages.push(tag.nPages);
      nPassed.push(tag.nPassed);
      nFailed.push(tag.nFailed);
      nCantTell.push(tag.nCantTell);
      nInapplicable.push(tag.nInapplicable);
      nUntested.push(tag.nUntested);
    }

    this.preparedData.push({
      id: 'nApps',
      name: '# applications',
      data: nApps
    });
    this.variableIds.push('nApps');

    this.preparedData.push({
      id: 'nPages',
      name: '# pages',
      data: nPages
    });
    this.variableIds.push('nPages');

    this.preparedData.push({
      id: 'nPassed',
      name: '# passed assertions',
      data: nPassed,
      visible: false
    });
    this.variableIds.push('nPassed');

    this.preparedData.push({
      id: 'nFailed',
      name: '# failed assertions',
      data: nFailed,
      visible: false
    });
    this.variableIds.push('nFailed');

    this.preparedData.push({
      id: 'nCantTell',
      name: '# cantTell assertions',
      data: nCantTell,
      visible: false
    });
    this.variableIds.push('nCantTell');

    this.preparedData.push({
      id: 'nInapplicable',
      name: '# inapplicable assertions',
      data: nInapplicable,
      visible: false
    });
    this.variableIds.push('nInapplicable');

    this.preparedData.push({
      id: 'nUntested',
      name: '# untested assertions',
      data: nUntested,
      visible: false
    });
    this.variableIds.push('nUntested');
    
    for(let tag of this.tagNames){
      this.selectedTagNames.push({tag: tag, checked: true});
    }
  }

  updateTagSelection(e: any, tag: string){
    let beforeChecked = this.selectedTagNames.filter(function(x){
      return x.checked === true;
    }).map(function(x){
      return x.tag;
    });

    let clickedTagIndex = this.selectedTagNames.findIndex(function(item, i){
      return item.tag === tag;
    });
    this.selectedTagNames[clickedTagIndex].checked = e.checked;

    let afterChecked = this.selectedTagNames.filter(function(x){
      return x.checked === true;
    }).map(function(x){
      return x.tag;
    });
    
    let actualData, index;
    let toChangeData = cloneDeep(this.preparedData);

    for(let i = 0; i < this.chart.ref.series.length; i++){
      actualData = cloneDeep(this.chart.ref.series[i]['yData']);
      if(e.checked) {
        index = afterChecked.indexOf(tag);
        actualData.splice(index, 0, toChangeData[i].data[clickedTagIndex]);
      } else {
        index = beforeChecked.indexOf(tag);
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