import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';

const tagUrl = BASE_URL.concat('tag/');;

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor(private http: HttpClient) { }

  getAll(): Promise<any> {
    return this.http.get(tagUrl.concat('allData'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getNumber(): Promise<any> {
    return this.http.get(tagUrl.concat('numberOf'))
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  /*get(id: number) {
    return this.http.get(tagUrl.concat(id.toString()));
  }

  create(data: any) {
    return this.http.post(baseUrl, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  deleteAll() {
    return this.http.delete(baseUrl);
  }*/

}
