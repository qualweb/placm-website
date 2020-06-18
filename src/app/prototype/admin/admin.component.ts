import { Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DatabaseDialogComponent } from 'app/dialogs/database-dialog/database-dialog.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  constructor(
    private dialog: MatDialog) { }

  ngOnInit(): void {

  }

  openDialog(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    dialogConfig.width = "40vw";
    this.dialog.open(DatabaseDialogComponent, dialogConfig);
  }

}
