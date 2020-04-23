import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const evaluationUrl = BASE_URL.concat('evaluation/');

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  
  constructor(private http: HttpClient) { }

  getAll(): Promise<any> {
    return this.http.get(evaluationUrl.concat('byTool'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
