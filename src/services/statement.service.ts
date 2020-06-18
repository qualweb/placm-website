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

  sendAccessibilityStatement(serverName: string, numLinks: number, formData: string, links: string, htmls: string): Observable<boolean> {
    //console.log(htmls);
    //console.log(numLinks);
    return ajax
      .post(this.config.getServer("/admin/statement/add"), {serverName, numLinks, formData, links, htmls})
      .pipe(
        retry(3),
        map(res => {
          console.log(res);
          if (!res.response || res.status === 404) {
            console.log(res);
            throw new PLACMError(404, "Service not found", "SERIOUS");
          }

          const response = <Response>res.response;

          if (response.success !== 1) {
            console.log(response);
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