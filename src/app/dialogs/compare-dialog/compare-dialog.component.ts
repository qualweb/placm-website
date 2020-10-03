import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LABELS_SINGULAR, POSSIBLE_FILTERS, LABELS_PLURAL } from 'utils/constants';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { startWith } from 'rxjs/internal/operators/startWith';
import { map } from 'rxjs/internal/operators/map';
import { CombinedService } from 'services/combined.service';
import { query } from '@angular/animations';

@Component({
  selector: 'app-compare-dialog',
  templateUrl: './compare-dialog.component.html',
  styleUrls: ['./compare-dialog.component.css']
})
export class CompareDialogComponent implements OnInit {

  category: string;
  categoryName: string;
  categoryNamePlural: string;
  filterName: string;
  name: string;
  variable: string;
  id: string;
  type: string;
  queryParams: any[];

  graphTitle: string;
  graphId: number;
  
  form: FormGroup;
  names: any[] = [];
  namesOptions: Observable<any[]>;

  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<CompareDialogComponent>,
    private combinedService: CombinedService) {
      this.category = data.category;
      this.categoryName = LABELS_SINGULAR[this.category].toLowerCase();
      this.categoryNamePlural = LABELS_PLURAL[this.category].toLowerCase();
      this.type = data.type;
      this.filterName = data.filter;
      this.name = data.name;
      this.variable = data.variable;
      this.id = data.id;
      this.queryParams = data.queryParams;

      this.graphTitle = data.graphTitle;
      this.graphId = data.graphId;
      console.log(data);

      this.initializeForms();
  }

  async ngOnInit(): Promise<void> {
    await this.prepareNames();
    this.namesOptions = this.form.controls.names!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('names', name) : this.names.slice()));

    this.form.controls.radio!.valueChanges.subscribe( (x) => {
      this.prepareNames();
    })
  }

  private initializeForms(){
    this.form = new FormGroup({
      'names': new FormControl('',
        Validators.required),
      'radio': new FormControl("1",
      Validators.required)
    });
  }
  private _filter(type: string, value: any): string[] {
    const filterValue = value.toLowerCase();
    let filter;
    switch(type){
      case 'names':
        filter = this.names.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
    }
    return filter;
  }
  
  async prepareNames(): Promise<void> {
    let queryPar = this.queryParams;
    if(this.form.controls.radio.value === '0'){
      let firstParam = Object.keys(this.queryParams)[0];
      let queryParamsString = '{"' + firstParam + '":"' + this.graphId + '"';
      if(this.queryParams){
        for(let params in this.queryParams){
          if(POSSIBLE_FILTERS.includes(params) && params !== firstParam && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString + ',"'
                      + params + '":"' + this.queryParams[params] + '"';
          }
        }
      }
      queryParamsString = queryParamsString + '}';
      queryPar = JSON.parse(queryParamsString);
    }
    this.names = await this.combinedService.getNames(this.category, queryPar);
    if(this.names['success'] === 1){
      this.names = this.names['result'];
      this.form.get('names').setValue(this.names.filter(x => {if(x.id === this.id) return x}));
    } else {
      this.names = [];
    }
  }

  goToCompPageSame(){
    let idsSelected = this.form.controls.names.value.map(x => x.id);
    this.dialogRef.close({comparing: true,
                          selected: this.category,
                          ids: idsSelected,
                          queryParams: this.prepareQueryParams(this.category, idsSelected)})
  }
  
  prepareQueryParams(cat: string, ids: number[]): any {
    let selectedParam = cat + 'Ids';
    let queryParamsString = '{"' + selectedParam + '":"' + ids.join(',') + '"';
    if(this.queryParams){
      for(let params in this.queryParams){
        if(POSSIBLE_FILTERS.includes(params) && params !== selectedParam && params !== 'filter' && params !== 'p'){
          queryParamsString = queryParamsString + ',"'
                    + params + '":"' + this.queryParams[params] + '"';
        }
      }
    }
    queryParamsString = queryParamsString + '}';
    return JSON.parse(queryParamsString);
  }

  close() {
    this.dialogRef.close();
  }

}
