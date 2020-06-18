import { Injectable } from '@angular/core';
import { retry } from "rxjs/operators";
import { HttpParams, HttpClient } from '@angular/common/http';
import { BASE_URL } from 'utils/constants';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  PROTOCOL: string;
  PORT: number;
  HOST: string;
  URI: string;

  constructor(
    private http: HttpClient) {
    this.PROTOCOL = location.protocol.concat('//');
    this.HOST = location.hostname;

    if (this.HOST === 'localhost') {
      this.PORT = 3443;
    } else {
      if (this.PROTOCOL === 'http://') {
        this.PORT = 80;
      } else {
        this.PORT = 443;
      }
    }

    this.URI = `${this.PROTOCOL}${this.HOST}:${this.PORT}`;
  }

  getServer(service: string): string {
    return `${this.URI}${service}`;
  }

  resetDatabase(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get((BASE_URL.concat('proto/reset')), {params: opts})
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }
}
