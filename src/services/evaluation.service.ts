import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getEvalutionToolData(serverName: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(evaluationUrl.concat('allEvalToolDataFiltered'), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
