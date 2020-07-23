import { Component, OnInit } from '@angular/core';
import { SERVER_NAME } from 'utils/constants';
import { ConfigService } from 'services/config.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-database-dialog',
  templateUrl: './database-dialog.component.html',
  styleUrls: ['./database-dialog.component.css']
})
export class DatabaseDialogComponent implements OnInit {

  loadingResponse = false;
  allDone = false;
  success: boolean;

  constructor(
    private dialogRef: MatDialogRef<DatabaseDialogComponent>,
    private config: ConfigService) { }

  ngOnInit(): void {
  }

  async emergencyButton(): Promise<void>{
    this.loadingResponse = true;
    try {
      this.success = await this.config.resetDatabase(SERVER_NAME);
    } catch(err){
      this.success = false;
    }
    this.loadingResponse = false;
    this.allDone = true;
  }
  
  close() {
    this.dialogRef.close();
  } 
}
