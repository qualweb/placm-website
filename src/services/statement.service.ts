import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { Observable, of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { catchError, map, retry } from "rxjs/operators";
import { PLACMError } from "../models/error";
import { Response } from "../models/response";

@Injectable({
  providedIn: "root"
})
export class StatementService {
  constructor(private config: ConfigService) {}

  sendAccessibilityStatement(htmls: any): Observable<boolean> {
    //console.log(htmls);
    return ajax
      .post(this.config.getServer("/admin/statement/add"), {htmls})
      .pipe(
        retry(3),
        map(res => {
          if (!res.response || res.status === 404) {
            throw new PLACMError(404, "Service not found", "SERIOUS");
          }

          const response = <Response>res.response;

          if (response.success !== 1) {
            throw new PLACMError(response.success, response.message);
          }

          return <boolean>response.result;
        }),
        catchError(err => {
          console.log(err);
          return of(null);
        })
      );
  }
}