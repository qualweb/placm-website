import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const countryUrl = BASE_URL.concat('country/');

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) { }

  getAllByCountry(): Promise<any> {
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
  }
}
