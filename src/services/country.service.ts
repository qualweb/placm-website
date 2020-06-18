import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { ConfigService } from './config.service';

const countryUrl = BASE_URL.concat('country/');

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(
    private http: HttpClient,
    private config: ConfigService) { }

  /*getAllByCountry(): Promise<any> {
    return this.http.get(countryUrl.concat('byCountry'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getAllByContinent(): Promise<any> {
    return this.http.get(countryUrl.concat('byContinent'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }*/

  getCountryData(serverName: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(countryUrl.concat('allCountryDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getContinentData(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get(countryUrl.concat('allContinentData'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
  

  getAllCountryNames(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get(countryUrl.concat('countryNames'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
