import { Component, OnInit } from '@angular/core';
import { trim } from 'lodash';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { StatementService } from 'src/services/statement.service';

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
  textFromLink: string;
  textFromFile: string;
  linkErrorMessage: string;
  fileErrorMessage: string;

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

  async sendFile(): Promise<void> {
    this.linkToRead = trim(this.accessStatement.controls.asLink.value);
    if (!this.fileToRead && !this.linkToRead) {
      this.accessStatement.reset();
      return;
    }

    if(/^https?:\/\/.*\.html$/.test(this.linkToRead)){
      this.textFromLink = <string> await fetch(this.linkToRead)
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
        console.log(this.textFromLink);
    } else {
      this.linkErrorMessage = "invalidUrl";
      this.textFromLink = "";
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
        case "text/html":
          this.textFromFile = await this.parseFile(this.fileToRead);
          break;
        default:
          this.textFromFile = "";
          this.fileErrorMessage = "invalidType";
          break;
      } 
    } catch (err) {
      this.textFromFile = "";
      this.fileErrorMessage = "parseError";
    }

    this.loadingResponse = true;
    this.statement.sendAccessibilityStatement(this.textFromFile, this.textFromLink).subscribe(response => {
      if (response) {
        console.log("oh que maravilha");
        ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML = this.labelVal;
        this.fileToRead = null;
        this.accessStatement.reset();
      } else {
        console.log("oh ohhhhhhhhh");
        ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML = this.labelVal;
        this.fileToRead = null;
        this.accessStatement.reset();
        this.error = true;
      }
      this.loadingResponse = false;
    });
  }

  parseFile(file: File): Promise<any> {
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