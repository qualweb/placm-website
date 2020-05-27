import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-drilldown-dialog',
  templateUrl: './drilldown-dialog.component.html',
  styleUrls: ['./drilldown-dialog.component.css']
})
export class DrilldownDialogComponent implements OnInit {

  category: string;
  filterName: string;
  name: string;
  variable: string;
  id: string;

  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DrilldownDialogComponent>) {
      this.category = data.category;
      this.filterName = data.filter;
      this.name = data.name;
      this.variable = data.variable;
      this.id = data.id;
    }

  ngOnInit(): void {    
  }

  close() {
    this.dialogRef.close();
  }

  submittedCategory(category: any){
    this.dialogRef.close({selected: category, filter: this.filterName, id: this.id});
  }

}