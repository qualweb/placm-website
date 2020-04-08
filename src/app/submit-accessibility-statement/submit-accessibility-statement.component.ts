import { Component, OnInit } from '@angular/core';
import { trim } from 'lodash';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { StatementService } from 'src/services/statement.service';
import { parseFile } from 'src/assets/utils/file';
import chart from 'tui-chart';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";

@Component({
  selector: 'app-submit-accessibility-statement',
  templateUrl: './submit-accessibility-statement.component.html',
  styleUrls: ['./submit-accessibility-statement.component.css']
})
export class SubmitAccessibilityStatementComponent implements OnInit {
  selection: SelectionModel<any>;
  loadingResponse: boolean;
  accessStatement: FormGroup;
  error: boolean;
  linkErrorMessage: string;
  fileErrorMessage: string;

  filesFromInput: FileList;

  labelVal: any;

  constructor(
    private formBuilder: FormBuilder,
    private statement: StatementService,
  ) {
    this.accessStatement = this.formBuilder.group({
        asFile: new FormControl(),
        asLink: new FormControl()});
    this.selection = new SelectionModel<any>(true, []);
  };

  ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML;

    let container = document.getElementById('container-id'),
    data = {
        categories: ['cate1', 'cate2', 'cate3'],
        series: [
            {
                name: 'Legend1',
                data: [20, 30, 50]
            },
            {
                name: 'Legend2',
                data: [40, 40, 60]
            },
            {
                name: 'Legend3',
                data: [60, 50, 10]
            },
            {
                name: 'Legend4',
                data: [80, 10, 70]
            }
        ]
    },
    options = {
        chart: {
            width: 500,
            height: 400,
            title: 'Chart Title'
        },
        yAxis: {
            title: 'Y Axis Title'
        },
        xAxis: {
            title: 'X Axis Title'
        },
        methods: {
          onClick: function(e) {
            console.log(e);
          }
        }
    };

    let chartUI = chart.barChart(container, data, options);
  }

  ngAfterViewInit() {
    let chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    chart.data = [
      {
        country: "United States",
        visits: 725
      },
      {
        country: "United Kingdom",
        visits: 625
      },  
      {
        country: "China",
        visits: 602
      },
      {
        country: "Japan",
        visits: 509
      },
      {
        country: "Germany",
        visits: 322
      },
      {
        country: "France",
        visits: 214
      },
      {
        country: "India",
        visits: 204
      },
      {
        country: "Spain",
        visits: 198
      },
      {
        country: "Netherlands",
        visits: 165
      },
      {
        country: "Russia",
        visits: 130
      },
      {
        country: "South Korea",
        visits: 93
      },
      {
        country: "Canada",
        visits: 41
      }
    ];

    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.dataFields.category = "country";
    categoryAxis.renderer.minGridDistance = 40;
    categoryAxis.fontSize = 11;
    categoryAxis.renderer.labels.template.dy = 5;

    /*let image = new am4core.Image();
    image.horizontalCenter = "middle";
    image.width = 20;
    image.height = 20;
    image.verticalCenter = "middle";
    image.adapter.add("href", (href, target)=>{
      let category = target.dataItem['category'];
      if(category){
        return "https://www.amcharts.com/wp-content/uploads/flags/" + category.split(" ").join("-").toLowerCase() + ".svg";
      }
      return href;
    })
    categoryAxis.dataItems.template.bullet = image;*/

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.baseGrid.disabled = true;

    let series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.categoryX = "country";
    series.dataFields.valueY = "visits";
    series.columns.template.tooltipText = "{valueY.value}";
    series.columns.template.tooltipY = 0;
    series.columns.template.strokeOpacity = 0;

    // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
    series.columns.template.adapter.add("fill", function(fill, target) {
      return chart.colors.getIndex(target.dataItem.index);
    });
    series.columns.template.events.on("hit", function(ev) {
      console.log("clicked on ", ev);
    });
  }

  addFile(e: Event): void {
    this.filesFromInput = (<HTMLInputElement>e.target).files;
    let selectedFiles = this.filesFromInput.length;
    let firstFile = this.filesFromInput[0];

    if(selectedFiles > 1){
      //todo innerhtml estraga a responsividade
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = selectedFiles + " selected files";
    } else {
      if(firstFile && firstFile.name){
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = firstFile.name.length > 30 ? firstFile.name.substring(0,27).concat('...') : firstFile.name;
      } else {
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.labelVal;
      }
    }
  }

  async sendFile(): Promise<void> {
    let textareaLinks = trim(this.accessStatement.controls.asLink.value);
    if (!this.filesFromInput && !textareaLinks) {
      this.accessStatement.reset();
      return;
    }

    //todo manter divisao de links com enters ou tambem por espaços?
    let linksToRead = textareaLinks.split('\n');
    let linksRead: string[] = [];
    let textFromLink: string;
    let textsFromLinks: string[] = [];
    let textsFromFiles: string[] = [];

    for(let link of linksToRead){
      if(/^https?:\/\/.*$/.test(link)){
        textFromLink = <string> await fetch(link)
            .then(response => {
              if (response.status === 200) {
                return response.text();
              } else {
                throw new Error(response.statusText);
              }
            })
            .catch(err => {
              this.linkErrorMessage = "failedFetch";
          });
        if(textFromLink){
          textsFromLinks.push(textFromLink);
          linksRead.push(link);
        } else {
          // todo link deu erro a dar fetch - mandar popup? escrever mensagem?
        }
      } else {
        // todo link nao comeca por http - mandar popup? escrever mensagem?
        this.linkErrorMessage = "invalidUrl";
        //this.textFromLink = "";
      }
    }

    try {
      for(let file of Array.from(this.filesFromInput)){
        switch (file.type) {
          case "text/html":
            let textFromFile = await parseFile(file);
            if(textFromFile){
              textsFromFiles.push(textFromFile);
            }
            break;
          default:
            // todo ficheiro nao tem tipo correto - mandar popup? escrever mensagem?
            //this.textFromFile = "";
            this.fileErrorMessage = "invalidType";
            break;
        }
      };
    } catch (err) {
      // todo ficheiro nao foi possivel ler - mandar popup? escrever mensagem?
      //this.textFromFile = "";
      this.fileErrorMessage = "parseError";
    }

    let textsFromBothInputs = textsFromLinks.concat(textsFromFiles);
    let textsFromBothInputsJson = JSON.stringify(textsFromBothInputs);
    let linksJson = JSON.stringify(linksRead);

    this.loadingResponse = true;
    this.statement.sendAccessibilityStatement(linksRead.length, linksJson, textsFromBothInputsJson).subscribe(response => {
      if (response) {
        console.log("oh que maravilha");
        ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML = this.labelVal;
        this.filesFromInput = null;
        this.accessStatement.reset();
      } else {
        console.log("oh ohhhhhhhhh");
        ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML = this.labelVal;
        this.filesFromInput = null;
        this.accessStatement.reset();
        this.error = true;
      }
      this.loadingResponse = false;
    });
  }
}