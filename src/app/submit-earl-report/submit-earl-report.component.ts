import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { EarlService } from 'src/services/earl.service';
import { parseFile } from 'src/assets/utils/file';
import { trim } from 'lodash';
import { ErrorDialogComponent } from '../dialogs/error-dialog/error-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material';

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
  linkErrorMessage: string;
  fileErrorMessage: string;

  filesFromInput: FileList;

  labelVal: any;

  dialogConfig: MatDialogConfig;

  errorsLinks: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private earl: EarlService,
    private dialog: MatDialog
  ) {
    this.earlReport = this.formBuilder.group({
        earlFile: new FormControl(),
        earlLink: new FormControl()});
    this.selection = new SelectionModel<any>(true, []);
    this.dialogConfig = new MatDialogConfig();
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.width = '300px';
    this.dialogConfig.position = {
      'top': '0',
      'left': '0'
    };
  };

  ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('earlFile')).nextElementSibling).innerHTML;
  }

  addFile(e: Event): void {
    this.filesFromInput = (<HTMLInputElement>e.target).files;
    let selectedFiles = this.filesFromInput.length;
    let firstFile = this.filesFromInput[0];

    if(selectedFiles > 1){
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = selectedFiles + " selected files";
    } else {
      if(firstFile && firstFile.name){
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = firstFile.name.length > 30 ? firstFile.name.substring(0,27).concat('...') : firstFile.name;
      } else {
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = this.labelVal;
      }
    }
  }

  //todo acrescentar botao para limpar ficheiro

  async sendFile(): Promise<void> {
    let textareaLinks = trim(this.earlReport.controls.earlLink.value);
    if (!this.filesFromInput && !textareaLinks) {
      this.earlReport.reset();
      return;
    }

    let linksToRead = textareaLinks.split('\n');
    let jsonFromLink: string;
    let jsonsFromLinks: string[] = [];
    let jsonsFromFiles: string[] = [];

    this.errorsLinks = [];

    for(let link of linksToRead){
      if(/^https?:\/\/.*\.json$/.test(link)){
        jsonFromLink = <string> await fetch(link)
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
        if(jsonFromLink){
          jsonsFromLinks.push(jsonFromLink);
        } else {
          this.dialogConfig.data = {
            
          };
          this.errorsLinks.push(link);
          // todo link deu erro a dar fetch - mandar popup? escrever mensagem?
        }
      } else {
        this.errorsLinks.push(link);
        // todo link nao comeca por http - mandar popup? escrever mensagem?
        this.linkErrorMessage = "invalidUrl";
      }
    }

    if(this.errorsLinks.length) {
      this.dialogConfig.data = {
        links: this.errorsLinks
      };
      this.dialog.open(ErrorDialogComponent, this.dialogConfig);
    }

    try {
      for(let file of Array.from(this.filesFromInput)){
        switch (file.type) {
          case "application/json":
            let jsonFromFile = await parseFile(file);
            if(jsonFromFile){
              jsonsFromFiles.push(jsonFromFile);
            }
            break;
          default:
            // todo ficheiro nao tem tipo correto - mandar popup? escrever mensagem?
            this.fileErrorMessage = "invalidType";
            break;
        } 
      };
    } catch (err) {
      // todo ficheiro nao foi possivel ler - mandar popup? escrever mensagem?
      this.fileErrorMessage = "parseError";
    }

    let jsonsFromBothInputs = jsonsFromLinks.concat(jsonsFromFiles);
    let jsonsFromBothInputsJson = JSON.stringify(jsonsFromBothInputs);

    this.loadingResponse = true;
    this.earl.sendEARLReport(jsonsFromBothInputsJson).subscribe(response => {
      if (response) {
        console.log("oh que maravilha");
        ((<HTMLInputElement>document.getElementById('earlFile')).nextElementSibling).innerHTML = this.labelVal;
        this.filesFromInput = null;
        this.earlReport.reset();
      } else {
        console.log("oh ohhhhhhhhh");
        ((<HTMLInputElement>document.getElementById('earlFile')).nextElementSibling).innerHTML = this.labelVal;
        this.filesFromInput = null;
        this.earlReport.reset();
        this.error = true;
      }
      this.loadingResponse = false;
    });
  }
}
