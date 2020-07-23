import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const evaluationUrl = BASE_URL.concat('evaluation/');

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  
  constructor(private http: HttpClient) { }

  getAll(): Promise<any> {
    return this.http.get(evaluationUrl.concat('byTool'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getEvalutionToolData(serverName: string, type?: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(evaluationUrl + 'evalToolData' + types, {params: opts})
      .pipe(
        retry(3),
        map(res => {
          if (res['success'] !== 1 || res['errors'] !== null) {
            throw new PLACMError(res['success'], res['message']);
          }
          return res;
        }),
        catchError(err => {
          console.log(err);
          return throwError(err);
        })
      )
      .toPromise();
  }
}
