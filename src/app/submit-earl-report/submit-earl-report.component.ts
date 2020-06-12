import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { EarlService } from 'services/earl.service';
import { parseFile } from 'utils/file';
import { trim } from 'lodash';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CombinedService } from 'services/combined.service';
import { SECTORS, TYPES, SERVER_NAME } from 'utils/constants';
import { CountryService } from 'services/country.service';
import { TagService } from 'services/tag.service';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ErrorDialogComponent } from 'app/dialogs/error-dialog/error-dialog.component';

@Component({
  selector: 'app-submit-earl-report',
  templateUrl: './submit-earl-report.component.html',
  styleUrls: ['./submit-earl-report.component.css']
})
export class SubmitEarlReportComponent implements OnInit {
  loadingResponse: boolean;
  earlLinks: FormControl;
  sqlData: FormGroup;
  error: boolean;
  linkErrorMessage: string;
  fileErrorMessage: string = '';
  errorFiles: string[];

  filesFromInput: FileList = undefined;

  labelVal: any;

  dialogConfig: MatDialogConfig;

  errorsLinks: string[] = [];

  countriesOptions: Observable<any[]>;
  tagsOptions: Observable<any[]>;
  countries: any[] = [];
  tags: any[] = [];
  sectors: any[] = [];
  types: any[] = [];

  linksError: string[] = [];
  filesError: string[] = [];

  constructor(
    private earl: EarlService,
    private dialog: MatDialog,
    private countryService: CountryService,
    private tagService: TagService
  ) {
    this.initializeForms();
    this.dialogConfig = new MatDialogConfig();
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    /*this.dialogConfig.width = '300px';
    this.dialogConfig.position = {
      'top': '0',
      'left': '0'
    };*/
  };

  async ngOnInit(){
    this.labelVal = ((<HTMLInputElement>document.getElementById('earlFiles')).nextElementSibling).innerHTML;
    this.countries = (await this.countryService.getAllCountryNames()).result;
    this.tags = (await this.tagService.getAllTagsNames(SERVER_NAME)).result;
    for(let sec of Object.keys(SECTORS)){
      this.sectors.push({name: SECTORS[sec], value: sec});
      this.types.push({name: TYPES[sec], value: sec});
    }
    this.countriesOptions = this.sqlData.controls.country!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('country', name) : this.countries.slice()));
    this.tagsOptions = this.sqlData.controls.tags!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('tag', name) : this.tags.slice()));
  }

  private initializeForms(){
    this.earlLinks = new FormControl('',[
      this.urlValidator.bind(this)
    ]);
    this.sqlData = new FormGroup({
      'appName': new FormControl('', 
        Validators.required),
      'appUrl': new FormControl(),
      'org': new FormControl('', 
        Validators.required),
      'type': new FormControl('', 
        Validators.required),
      'sector': new FormControl('', 
        Validators.required),
      'country': new FormControl(),
      'tags': new FormControl()
    });
  }
  
  urlValidator(control: AbstractControl): any {
    const urls = control.value;
    
    if(urls.length === 0){
      return null;
    }

    for(let url of urls.split('\n')){
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!url.endsWith('.json')) {
          return {'url': true};
        }
      } else {
        return {'url': true};
      }
    }

    return null;
  }

  displayFn(cat: any): string {
    return cat && cat.name ? cat.name : '';
  }

  inputControl(event: any) {
    setTimeout(() => {
      let isValueTrue = this.countries.filter(myAlias => myAlias.name === event.target.value);
      if (isValueTrue.length === 0) {
          this.sqlData.get('country').setValue('');
      }
    }, 100);
  }

  private _filter(type: string, value: any): string[] {
    const filterValue = value.toLowerCase();
    let filter;
    switch(type){
      case 'country':
        filter = this.countries.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
      case 'tag':
        filter = this.tags.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
    }
    return filter;
  }

  addFile(e: Event): void {
    this.filesFromInput = (<HTMLInputElement>e.target).files;
    let selectedFiles = this.filesFromInput.length;
    let firstFile = this.filesFromInput[0];

    this.errorFiles = [];

    if(selectedFiles > 1){
      for(let i = 0; i < selectedFiles; i++){
        if(this.filesFromInput[i].type !== 'application/json'){
          this.errorFiles.push(this.filesFromInput[i].name);
        }
      }
      ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = selectedFiles + " selected files";
    } else {
      if(firstFile && firstFile.name){
        if(firstFile.type !== 'application/json'){
          this.errorFiles.push(firstFile.name);
        }
        ((<HTMLInputElement>e.target).nextElementSibling).innerHTML = firstFile.name;
      } else {
        this.clearFileInput();
      }
    }
    if(this.errorFiles.length){
      this.fileErrorMessage = 'The following chosen files are not .json files:';
    } else {
      this.fileErrorMessage = '';
    }
  }

  clearFileInput(): void {
    this.filesFromInput = undefined;
    ((<HTMLInputElement>document.getElementById('earlFiles')).nextElementSibling).innerHTML = this.labelVal;
    (<HTMLInputElement>document.getElementById('earlFiles')).value = "";
    this.fileErrorMessage = '';
  }

  isInputEmptyOrWithErrors(): boolean {
    return (!trim(this.earlLinks.value) && this.filesFromInput === undefined) ||
    (this.earlLinks.hasError('url') || !!this.fileErrorMessage.length);
  }

  isDisabledButton(): boolean {
    return this.isInputEmptyOrWithErrors() || this.sqlData.status === 'INVALID';
  }

  async sendFile(): Promise<void> {
    let textareaLinks = trim(this.earlLinks.value);
    if (!this.filesFromInput && !textareaLinks) {
      this.earlLinks.reset();
      return;
    }

    let linksToRead = textareaLinks.split('\n');
    let dataFromLink: string;
    let dataFromLinks: string[] = [];
    let dataFromFiles: string[] = [];

    this.linksError = [];
    this.filesError = [];

    if(linksToRead.length > 0 && linksToRead[0] !== ''){
      for(let link of linksToRead){
        dataFromLink = <string> await fetch(link)
          .then(response => {
            if (response.status === 200) {
              return response.text();
            } else {
              throw new Error(response.statusText);
            }
          })
          .catch(err => {
            //this.linkErrorMessage = "failedFetch";
            if(!this.linksError.includes(link))
              this.linksError.push(link);
        });
        if(dataFromLink){
          dataFromLinks.push(dataFromLink);
        } else {
          if(!this.linksError.includes(link))
            this.linksError.push(link);
        }
      }
    } 

    try {
      for(let file of Array.from(this.filesFromInput)){
        let dataFromFile = await parseFile(file);
        if(dataFromFile){
          dataFromFiles.push(dataFromFile);
        } else {
          this.filesError.push(file.name);
        }
      };
    } catch (err) {
      this.fileErrorMessage = "parseError";
    }

    if(!!this.filesError.length || !!this.linksError.length || !!this.fileErrorMessage){
      this.dialogConfig.data = {
        links: this.linksError,
        files: this.filesError,
        message: this.fileErrorMessage
      };
      this.dialog.open(ErrorDialogComponent, this.dialogConfig);
    } else {
      let dataFromBothInputs = dataFromLinks.concat(dataFromFiles);
      let dataFromBothInputsJson = JSON.stringify(dataFromBothInputs);
  
      this.loadingResponse = true;
      this.earl.sendEARLReport(SERVER_NAME, dataFromBothInputsJson).subscribe(response => {
        if (!response) {
          this.error = true;
        } else {
          ((<HTMLInputElement>document.getElementById('earlFiles')).nextElementSibling).innerHTML = this.labelVal;
          this.filesFromInput = undefined;
          this.initializeForms();
        }
        this.loadingResponse = false;
      });
    }
  }
}