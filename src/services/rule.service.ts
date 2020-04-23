import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const ruleUrl = BASE_URL.concat('rule/');

@Injectable({
  providedIn: 'root'
})
export class RuleService {

  constructor(private http: HttpClient) { }

  getAll(): Promise<any> {
    return this.http.get(ruleUrl.concat('allData'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
