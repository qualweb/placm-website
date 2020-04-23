import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-drilldown-dialog',
  templateUrl: './drilldown-dialog.component.html',
  styleUrls: ['./drilldown-dialog.component.css']
})
export class DrilldownDialogComponent implements OnInit {

  category: string;
  variable: string;

  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DrilldownDialogComponent>) {
      this.category = data.category;
      this.variable = data.variable;
    }

  ngOnInit(): void {
    
  }

  close() {
    this.dialogRef.close();
  }

}
