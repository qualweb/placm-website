import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const appUrl = BASE_URL.concat('application/');

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getAllByName(): Promise<any> {
    return this.http.get(appUrl.concat('byName'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }


  getAllExceptId(parameters: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('id', parameters);
    return this.http.get(appUrl.concat('exceptId'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getAppData(filters?: any): Promise<any> {
    let opts = new HttpParams();
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl.concat('appDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getSectorData(filters?: any): Promise<any> {
    let opts = new HttpParams();
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl.concat('sectorDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getOrganizationData(filters?: any): Promise<any> {
    let opts = new HttpParams();
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(appUrl.concat('orgDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

}
