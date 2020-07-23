import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const criteriaUrl = BASE_URL + 'sc/';

@Injectable({
  providedIn: 'root'
})
export class CriteriaService {

  constructor(private http: HttpClient) { }

  getData(serverName: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(criteriaUrl + 'scData', {params: opts})
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