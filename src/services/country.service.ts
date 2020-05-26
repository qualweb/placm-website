import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const countryUrl = BASE_URL.concat('country/');

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) { }

  /*getAllByCountry(): Promise<any> {
    return this.http.get(countryUrl.concat('byCountry'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getAllCountryNames(): Promise<any> {
    return this.http.get(countryUrl.concat('countryNames'))
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

  getCountryData(filters?: any): Promise<any> {
    let opts = new HttpParams();
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(countryUrl.concat('allCountryDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getContinentData(): Promise<any> {
    return this.http.get(countryUrl.concat('allContinentData'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
