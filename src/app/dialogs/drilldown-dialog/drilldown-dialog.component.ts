import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LABELS_SINGULAR } from 'utils/constants';

@Component({
  selector: 'app-drilldown-dialog',
  templateUrl: './drilldown-dialog.component.html',
  styleUrls: ['./drilldown-dialog.component.css']
})
export class DrilldownDialogComponent implements OnInit {

  category: string;
  categoryName: string;
  filterName: string;
  name: string;
  variable: string;
  id: string;
  type: string;
  selectedCategory: string;
  lastDrilldown: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DrilldownDialogComponent>) {
      this.category = data.category;
      this.categoryName = LABELS_SINGULAR[this.category].toLowerCase();
      this.type = data.type;
      this.filterName = data.filter;
      this.name = data.name;
      this.variable = data.variable;
      this.id = data.id;
      this.lastDrilldown = this.category === 'rule' || (this.type === 'scriteria' && this.category === 'eval');
    }

  ngOnInit(): void {    
  }

  close() {
    this.dialogRef.close();
  }

  changedCategorySelection(category: any){
    this.selectedCategory = category;
  }

  submittedCategory(){
    this.dialogRef.close({selected: this.selectedCategory, filter: this.filterName, id: this.id});
  }

}
