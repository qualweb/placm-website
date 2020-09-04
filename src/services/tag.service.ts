import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const tagUrl = BASE_URL + 'tag/';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor(
    private http: HttpClient) { }

  getNumber(): Promise<any> {
    return this.http.get(tagUrl + 'numberOf')
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
  
  getAllTagsNames(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get(tagUrl + 'tagNames', {params: opts})
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

  getData(serverName: string, type?: string, filters?: any, comparing?: boolean): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    let compare = comparing ? 'Compare' : ''; 
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(tagUrl + 'tagData' + types + compare, {params: opts})
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
