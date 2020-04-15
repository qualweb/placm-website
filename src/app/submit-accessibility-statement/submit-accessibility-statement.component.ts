import { Component, OnInit } from '@angular/core';
import { trim } from 'lodash';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { StatementService } from 'src/services/statement.service';
import { parseFile } from 'src/utils/file';

@Component({
  selector: 'app-submit-accessibility-statement',
  templateUrl: './submit-accessibility-statement.component.html',
  styleUrls: ['./submit-accessibility-statement.component.css']
})
export class SubmitAccessibilityStatementComponent implements OnInit {
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
  };

  ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('asFile')).nextElementSibling).innerHTML;
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