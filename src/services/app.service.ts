import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
