import { Component, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-prototype-tag',
  templateUrl: './prototype-tag.component.html',
  styleUrls: ['./prototype-tag.component.css']
})
export class PrototypeTagComponent implements OnInit {

  chart: Chart;

  constructor() { }

  ngOnInit() {
    let chart = new Chart({
      chart: {
        type: 'column'
      },
      title: {
        text: 'Colunchart'
      },
      credits: {
        enabled: false
      },
      xAxis: {
        categories: ['Green', 'Pink']
      },
      series: [{
        name: 'Line 1',
        data: [1,2,3]
      }]
    });
    this.chart = chart;
  }

}
