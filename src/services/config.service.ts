import { Injectable } from '@angular/core';
import {split} from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  PROTOCOL: string;
  PORT: number;
  HOST: string;
  URI: string;

  constructor() {
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
}
