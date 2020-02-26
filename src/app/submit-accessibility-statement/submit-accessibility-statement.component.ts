import { Component, OnInit } from '@angular/core';
import { trim } from 'lodash';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { EarlService } from 'src/services/earl.service';

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
  linkToRead: any;
  fileToRead: any;
  jsonFromLink: string;
  jsonFromFile: string;
  linkErrorMessage: string;
  fileErrorMessage: string;

  labelVal: any;

  constructor(
    private formBuilder: FormBuilder,
    private earl: EarlService,
  ) {
    this.accessStatement = this.formBuilder.group({
        file: new FormControl(),
        link: new FormControl()});
    this.selection = new SelectionModel<any>(true, []);
  };

  ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('statementFile')).nextElementSibling).innerHTML;
  }

  addFile(e: Event): void {
    this.fileToRead = (<HTMLInputElement>e.target).files[0];
    console.log(this.fileToRead);
    if(this.fileToRead && this.fileToRead.name){
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.fileToRead.name.length > 30 ? this.fileToRead.name.substring(0,27).concat('...') : this.fileToRead.name;
    } else {
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.labelVal;
    }
  }

  async sendFile(): Promise<void> {
    this.linkToRead = trim(this.accessStatement.controls.link.value);
    if (!this.fileToRead && !this.linkToRead) {
      this.accessStatement.reset();
      return;
    }

    if(/^https?:\/\/.*\.(json|html)$/.test(this.linkToRead)){
      this.jsonFromLink = <string> await fetch(this.linkToRead)
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
        console.log(this.jsonFromLink);
    } else {
      this.linkErrorMessage = "invalidUrl";
      this.jsonFromLink = "";
    }
    /*
    let href;
    for(let link of /href="https?:\/\/.*\.json"/.match(this.jsonFromLink)){
      href = link.substring(6, link.length-1);
      reportFromStatement = <string> await fetch(href)
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
    }

    */

    try {
      switch (this.fileToRead.type) {
        case "application/json":
          this.jsonFromFile = await this.parseJSON(this.fileToRead);
          break;
        default:
          this.jsonFromFile = "";
          this.fileErrorMessage = "invalidType";
          break;
      } 
    } catch (err) {
      this.jsonFromFile = "";
      this.fileErrorMessage = "parseError";
    }

    this.loadingResponse = true;
    /*this.earl.sendEARLReport(this.jsonFromFile).subscribe(response => {
      if (response) {
        console.log("oh que maravilha");
        ((<HTMLInputElement>document.getElementById('odfFile')).nextElementSibling).innerHTML = this.labelVal;
        this.fileToRead = null;
        this.accessStatement.reset();
      } else {
        console.log("oh ohhhhhhhhh");
        this.fileToRead = null;
        this.accessStatement.reset();
        this.error = true;
      }
      this.loadingResponse = false;
    });*/
  }

  parseJSON(file: File): Promise<any> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
  
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsText(file);
    });
  }
}