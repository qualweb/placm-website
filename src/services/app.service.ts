import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const appUrl = BASE_URL + 'application/';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getAllByName(): Promise<any> {
    return this.http.get(appUrl + 'byName')
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }


  getAllExceptId(parameters: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('id', parameters);
    return this.http.get(appUrl + 'exceptId', {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getAppData(serverName: string, type?: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl + 'appData' + types, {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getSectorData(serverName: string, type?: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl + 'sectorData' + types, {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getOrganizationData(serverName: string, type?: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let types = type === 'scriteria' ? 'SC' : '';
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl + 'orgData' + types, {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

}
