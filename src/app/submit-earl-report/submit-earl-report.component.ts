import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { EarlService } from 'src/services/earl.service';
import { trim } from 'lodash';

@Component({
  selector: 'app-submit-earl-report',
  templateUrl: './submit-earl-report.component.html',
  styleUrls: ['./submit-earl-report.component.css']
})
export class SubmitEarlReportComponent implements OnInit {
  selection: SelectionModel<any>;
  loadingResponse: boolean;
  earlReport: FormGroup;
  error: boolean;
  linkToRead: any;
  fileToRead: any;
  //0 - link, 1 - file
  jsonsToSubmit: string[] = ["", ""];
  linkErrorMessage: string;
  fileErrorMessage: string;

  labelVal: any;

  constructor(
    private formBuilder: FormBuilder,
    private earl: EarlService,
  ) {
    this.earlReport = this.formBuilder.group({
        earlFile: new FormControl(),
        earlLink: new FormControl()});
    this.selection = new SelectionModel<any>(true, []);
  };

  ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('earlFile')).nextElementSibling).innerHTML;
  }

  addFile(e: Event): void {
    let selectedFiles = (<HTMLInputElement>e.target).files.length;
    this.fileToRead = (<HTMLInputElement>e.target).files[0];

    if(selectedFiles > 1){
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = selectedFiles + " selected files";
    } else {
      if(this.fileToRead && this.fileToRead.name){
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.fileToRead.name.length > 30 ? this.fileToRead.name.substring(0,27).concat('...') : this.fileToRead.name;
      } else {
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.labelVal;
      }
    }
  }

  //todo acrescentar botao para limpar ficheiro

  async sendFile(): Promise<void> {
    this.linkToRead = trim(this.earlReport.controls.earlLink.value);
    if (!this.fileToRead && !this.linkToRead) {
      this.earlReport.reset();
      return;
    }

    if(/^https?:\/\/.*\.json$/.test(this.linkToRead)){
      this.jsonsToSubmit[0] = <string> await fetch(this.linkToRead)
          .then(response => {
            if (response.status === 200) {
              return response.text();
            } else {
              throw new Error(response.statusText);
            }
          })
          .catch(err => {
            this.linkErrorMessage = "failedFetch";
            return "";
        });
    } else {
      this.linkErrorMessage = "invalidUrl";
      this.jsonsToSubmit[0] = "";
    }

    try {
      switch (this.fileToRead.type) {
        case "application/json":
          this.jsonsToSubmit[1] = await this.parseJSON(this.fileToRead);
          break;
        default:
          this.jsonsToSubmit[1] = "";
          this.fileErrorMessage = "invalidType";
          break;
      } 
    } catch (err) {
      this.jsonsToSubmit[1] = "";
      this.fileErrorMessage = "parseError";
    }
    console.log(<string> this.jsonsToSubmit[0]);
    console.log(<string> this.jsonsToSubmit[1]);
    console.log(this.jsonsToSubmit.length);

    this.loadingResponse = true;
    this.earl.sendEARLReport(this.jsonsToSubmit[0], this.jsonsToSubmit[1]).subscribe(response => {
      if (response) {
        console.log("oh que maravilha");
        ((<HTMLInputElement>document.getElementById('earlFile')).nextElementSibling).innerHTML = this.labelVal;
        this.fileToRead = null;
        this.earlReport.reset();
      } else {
        console.log("oh ohhhhhhhhh");
        this.earlReport.reset();
        this.error = true;
      }
      this.loadingResponse = false;
    });
  }

  parseJSON(file: File): Promise<string> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
  
      reader.onload = () => {
        resolve(<string> reader.result);
      };
      reader.readAsText(file);
    });
  }

}
