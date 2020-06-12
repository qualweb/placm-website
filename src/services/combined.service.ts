import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { CountryService } from './country.service';
import { EvaluationService } from './evaluation.service';
import { RuleService } from './rule.service';
import { TagService } from './tag.service';
import { SessionStorage } from '@cedx/ngx-webstorage';
import { POSSIBLE_FILTERS, SERVER_NAME } from 'utils/constants';

@Injectable({
  providedIn: 'root'
})
export class CombinedService {

  constructor(
    private appService: AppService,
    private countryService: CountryService,
    private evalService: EvaluationService,
    private ruleService: RuleService,
    private tagService: TagService,
    private session: SessionStorage
  ) { }

  async getData(category: string, queryParams: any): Promise<any> {
    let sessionName = this.getStorageName(category, [queryParams]);
    let sessionData = this.session.getObject(sessionName);
    let data;
    if(sessionData === undefined){
      switch(category){
        case 'continent':
          data = await this.countryService.getContinentData(SERVER_NAME);
          break;
        case 'country':
          if(Object.keys(queryParams).length){
            data = await this.countryService.getCountryData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.countryService.getCountryData(SERVER_NAME);
          }
          break;
        case 'tag':
          if(Object.keys(queryParams).length){
            data = await this.tagService.getData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.tagService.getData(SERVER_NAME);
          }
          break;
        case 'sector':
          if(Object.keys(queryParams).length){
            data = await this.appService.getSectorData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.appService.getSectorData(SERVER_NAME);
          }
          break;
        case 'org':
          if(Object.keys(queryParams).length){
            data = await this.appService.getOrganizationData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.appService.getOrganizationData(SERVER_NAME);
          }
          break;
        case 'app':
          if(Object.keys(queryParams).length){
            data = await this.appService.getAppData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.appService.getAppData(SERVER_NAME);
          }
          break;
        case 'eval':
          if(Object.keys(queryParams).length){
            data = await this.evalService.getEvalutionToolData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.evalService.getEvalutionToolData(SERVER_NAME);
          }
          break;
        case 'rule':
          if(Object.keys(queryParams).length){
            data = await this.ruleService.getRuleData(SERVER_NAME, JSON.stringify(queryParams));
          } else {
            data = await this.ruleService.getRuleData(SERVER_NAME);
          }
          break;
        default:
          //todo error
          data = await this.countryService.getContinentData(SERVER_NAME);
          break;
      }
      if(data.success === 1){
        this.session.setObject(sessionName, data);
      }
    }
    return this.session.getObject(sessionName);
  }

  private getStorageName(category: string, queryParams: any): string {
    let result = category;
    queryParams = this.sortObject(queryParams);
    for(let param in queryParams[0]){
      if(POSSIBLE_FILTERS.includes(param) && param !== 'filter' && param !== 'p')
        result = result.concat(';').concat(param.substring(0, 3)).concat('=').concat(queryParams[0][param]);
    }
    return result;
  }

  private sortObject(obj) {
    if (typeof obj !== "object" || obj === null)
        return obj;

    if (Array.isArray(obj))
        return obj.map((e) => this.sortObject(e)).sort();

    return Object.keys(obj).sort().reduce((sorted, k) => {
        sorted[k] = this.sortObject(obj[k]);
        return sorted;
    }, {});
  }
}
