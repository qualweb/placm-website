import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LABELS_SINGULAR, LABELS_PLURAL, POSSIBLE_FILTERS, queryParamsRegex } from 'utils/constants';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { startWith } from 'rxjs/internal/operators/startWith';
import { map } from 'rxjs/internal/operators/map';
import { CombinedService } from 'services/combined.service';

@Component({
  selector: 'app-drilldown-dialog',
  templateUrl: './drilldown-dialog.component.html',
  styleUrls: ['./drilldown-dialog.component.css']
})
export class DrilldownDialogComponent implements OnInit {

  category: string;
  categoryName: string;
  categoryNamePlural: string;
  filterName: string;
  name: string;
  variable: string;
  id: string;
  type: string;
  selectedCategory: string;
  lastDrilldown: boolean;
  scApp: boolean;
  queryParams: any[];

  compareForm: FormGroup;
  sameNames: any[] = [];
  categories: any[] = [];
  names: any[] = [];
  sameNamesOptions: Observable<any[]>;
  categoriesOptions: Observable<any[]>;
  namesOptions: Observable<any[]>;

  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DrilldownDialogComponent>,
    private combinedService: CombinedService) {
      console.log(data);
      this.category = data.category;
      this.categoryName = LABELS_SINGULAR[this.category].toLowerCase();
      this.categoryNamePlural = LABELS_PLURAL[this.category].toLowerCase();
      this.type = data.type;
      this.filterName = data.filter;
      this.name = data.name;
      this.variable = data.variable;
      this.id = data.id;
      this.lastDrilldown = this.category === 'rule' || (this.type === 'scriteria' && this.category === 'eval');
      this.scApp = this.category === 'app' && this.type === 'scriteria';
      this.queryParams = data.queryParams;

      this.prepareCategories();
      this.initializeForms();
    }

  async ngOnInit(): Promise<void> {
    await this.prepareNames();
    this.sameNamesOptions = this.compareForm.controls.sameNames!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('names', name) : this.sameNames.slice()));   

    this.categoriesOptions = this.compareForm.controls.category!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('category', name) : this.categories.slice()));

    this.namesOptions = this.compareForm.controls.names!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('names', name) : this.names.slice()));   
  }

  close() {
    this.dialogRef.close();
  }

  changedCategorySelection(category: any){
    this.selectedCategory = category;
  }

  goToSCDetailsPage(){
    this.dialogRef.close({selected: 'scApp', filter: this.filterName, id: this.id});
  }

  async goToCompPageSame(){
    let idsSelected = this.compareForm.controls.sameNames.value.map(x => x.id);
    this.dialogRef.close({comparing: true,
                          selected: this.category,
                          ids: idsSelected,
                          queryParams: await this.prepareQueryParams(this.category, idsSelected)})
  }

  async goToCompPageDifferent(){
    let categorySelected = this.compareForm.controls.category.value ?
                            this.compareForm.controls.category.value.value :
                            this.category;
    let idsSelected = this.compareForm.controls.names.value.map(x => x.id);
    this.dialogRef.close({comparing: true,
                          selected: categorySelected,
                          ids: idsSelected,
                          queryParams: await this.prepareQueryParams(categorySelected, idsSelected, true)})
  }

  submittedCategory(){
    this.dialogRef.close({selected: this.selectedCategory, filter: this.filterName, id: this.id});
  }

  private initializeForms(){
    this.compareForm = new FormGroup({
      'category': new FormControl(''),
      'names': new FormControl(''),
      'sameNames': new FormControl(''),
    });
  }

  async prepareNames(): Promise<void> {
    this.sameNames = await this.combinedService.getData(this.category, this.type, this.queryParams);
    if(this.sameNames['success'] === 1){
      this.sameNames = this.sameNames['result'];
      this.compareForm.get('sameNames').setValue(this.sameNames.filter(x => {if(x.id === this.id) return x}));
    } else {
      this.sameNames = [];
    }
  }

  prepareCategories(): void {
    this.categories = [];
    let futureCategories = [];
    switch(this.category){
      case 'continent':
        futureCategories = ['country', 'tag'];
        break;
      case 'country':
        futureCategories = ['continent', 'tag'];
        break;
      case 'tag':
        futureCategories = ['continent', 'country', 'sector'];
        break;
      case 'sector':
        futureCategories = ['continent', 'country', 'tag', 'org', 'app'];
        break;
      case 'org':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'app'];
        break;
      case 'app':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org'];
        break;
      case 'eval':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app'];
        break;
      case 'sc':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval'];
        break;
      case 'type':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval', 'sc'];
        break;
      case 'rule':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval', 'sc', 'type'];
        break;
      default:
        futureCategories = [];
        break;
    }

    for(let cat of futureCategories){
      this.categories.push(
        {
          name: LABELS_SINGULAR[cat],
          value: cat
        }
      );
    }
  }
  
  async prepareQueryParams(cat: string, ids: number[], filter?: boolean): Promise<any> {
    let selectedParam = cat + 'Ids';
    let queryParamsString = '{"' + selectedParam + '":"' + ids.join(',') + '"';
    if(this.queryParams){
      for(let params in this.queryParams){
        if(POSSIBLE_FILTERS.includes(params) && params !== selectedParam && params !== 'filter' && params !== 'p'){
          queryParamsString += ',"' + params + '":"' + this.queryParams[params] + '"';
        }
      }
    }

    let data, filters: any[] = [];
    if(filter){
      data = await this.combinedService.getData(this.category, this.type, this.queryParams);
      if(data['success'] === 1){
        filters = data['result'].map(x => x.id).filter(id => id !== this.id);
        if(filters.length)
          queryParamsString += ',"filter":"' + filters.join(',') + '"';
      }
    }

    queryParamsString += '}';
    console.log(queryParamsString);
    return JSON.parse(queryParamsString);
  }

  clearInput(inputName: string) {
    this.compareForm.get(inputName).setValue('');
  }

  displayFn(cat: any): string {
    return cat && cat.name ? cat.name : '';
  }

  inputControl(event: any) {
    setTimeout(async () => {      
      let isValueTrue = this.categories.filter(myAlias => myAlias.name === event.target.value);
      
      if (isValueTrue.length === 0){
          this.compareForm.get('category').setValue('');
      } else {
        let selectedCategory = this.compareForm.controls['category'].value.value;
        let selectedCategoryIds = selectedCategory + 'Ids';
        this.names = await this.combinedService.getData(selectedCategory, this.type, this.queryParams);
        if(this.names['success'] === 1){
          this.names = this.names['result'];
          if(Object.keys(this.queryParams).includes(selectedCategoryIds)){
            this.compareForm.get('names').setValue(this.names.filter(x => {if(this.queryParams[selectedCategoryIds].includes(x.id)) return x}));
          } else {
            this.compareForm.get('names').setValue('');
          }
        } else {
          this.names = [];
        }
      }
    }, 100);
  }

  private _filter(type: string, value: any): string[] {
    const filterValue = value.toLowerCase();
    let filter;
    switch(type){
      case 'category':
        filter = this.categories.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
      case 'names':
        filter = this.names.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
    }
    return filter;
  }

}
