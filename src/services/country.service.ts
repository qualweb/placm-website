import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const countryUrl = BASE_URL + 'country/';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(
    private http: HttpClient) { }

  getCountryData(serverName: string, type?: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(countryUrl + 'countryData' + types, {params: opts})
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

  getContinentData(serverName: string, type?: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    return this.http.get(countryUrl + 'continentData' + types, {params: opts})
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
  

  getAllCountryNames(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get(countryUrl + 'countryNames', {params: opts})
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
