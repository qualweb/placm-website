import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { CountryService } from './country.service';
import { EvaluationService } from './evaluation.service';
import { RuleService } from './rule.service';
import { TagService } from './tag.service';
import { SessionStorage } from '@cedx/ngx-webstorage';
import { POSSIBLE_FILTERS, SERVER_NAME, BASE_URL } from 'utils/constants';
import { throwError } from 'rxjs';
import { CriteriaService } from './criteria.service';
import { PLACMError } from 'models/error';
import { catchError, retry, map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CombinedService {

  constructor(
    private countryService: CountryService,
    private tagService: TagService,
    private appService: AppService,
    private evalService: EvaluationService,
    private ruleService: RuleService,
    private criteriaService: CriteriaService,
    private session: SessionStorage,
    private http: HttpClient
  ) { }

  async getData(category: string, type?: string, queryParams?: any): Promise<any> {
    let sessionName = this.getStorageName(category, type, [queryParams]);
    let sessionData = this.session.getObject(sessionName);
    let data;
    try {
      if(sessionData === undefined){
        switch(category){
          case 'continent':
            data = await this.countryService.getContinentData(SERVER_NAME, type);
            break;
          case 'country':
            if(Object.keys(queryParams).length){
              data = await this.countryService.getCountryData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.countryService.getCountryData(SERVER_NAME, type);
            }
            break;
          case 'tag':
            if(Object.keys(queryParams).length){
              data = await this.tagService.getData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.tagService.getData(SERVER_NAME, type);
            }
            break;
          case 'sector':
            if(Object.keys(queryParams).length){
              data = await this.appService.getSectorData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.appService.getSectorData(SERVER_NAME, type);
            }
            break;
          case 'org':
            if(Object.keys(queryParams).length){
              data = await this.appService.getOrganizationData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.appService.getOrganizationData(SERVER_NAME, type);
            }
            break;
          case 'app':
            if(Object.keys(queryParams).length){
              data = await this.appService.getAppData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.appService.getAppData(SERVER_NAME, type);
            }
            break;
          case 'eval':
            if(Object.keys(queryParams).length){
              data = await this.evalService.getEvalutionToolData(SERVER_NAME, type, JSON.stringify(queryParams));
            } else {
              data = await this.evalService.getEvalutionToolData(SERVER_NAME, type);
            }
            break;
          case 'sc':
            if(Object.keys(queryParams).length){
              data = await this.criteriaService.getData(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.criteriaService.getData(SERVER_NAME);
            }
            break;
          case 'type':
            if(Object.keys(queryParams).length){
              data = await this.ruleService.getElementTypeData(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.ruleService.getElementTypeData(SERVER_NAME);
            }
            break;
          case 'rule':
            if(Object.keys(queryParams).length){
              data = await this.ruleService.getRuleData(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.ruleService.getRuleData(SERVER_NAME);
            }
            break;
          case 'countryNames':
            data = await this.countryService.getAllCountryNames(SERVER_NAME);
            break;
          case 'tagNames':
            data = await this.tagService.getAllTagsNames(SERVER_NAME);
            break;
          case 'scApp':
            data = await this.appService.getSuccessCriteriaData(SERVER_NAME, JSON.stringify(queryParams));
            break;
          default:
            //todo error
            data = await this.countryService.getContinentData(SERVER_NAME);
            break;
        } 
      } else {
        let queryDate = 0;
        if(sessionData.result.length){
          queryDate = new Date(sessionData.result[0]['date']).getTime();
        }
        let currTime = new Date();
        if((currTime.getTime() - queryDate) > 60000){
          switch(category){
            case 'tagNames':
              data = await this.tagService.getAllTagsNames(SERVER_NAME);
              break;
            default:
              //todo error
              break;
          }
        }
      }

      if(data && data.success === 1){
        // because the first 6 items in result array are OkPackets and not RowDataPackets
        if(type === 'scriteria')
          data.result = data.result[6];
        // because the first 8 items in result array are OkPackets and not RowDataPackets
        if(type === 'scApp')
          data.result = data.result[8];
        //
        
        this.session.setObject(sessionName, data);
      }
      return this.session.getObject(sessionName);
    } catch (err){
      return throwError(err);
    }
  }

  fetchDocument(url: string): Promise<any> {
    let param = new HttpParams();
    param = param.append('url', url);
    return this.http.get((BASE_URL + 'proto/fetch'), {params: param})
      .pipe(
        retry(3),
        map(res => {
          if (res['success'] !== 1 || res['errors'] !== null) {
            throw new PLACMError(res['success'], res['message']);
          }
          return res;
        }),
        catchError(err => {
          return throwError(err);
        })
      )
      .toPromise();
  }

  clearStorage(){
    this.session.clear();
  }

  private getStorageName(category: string, type: string, queryParams?: any): string {
    let result = category;
    queryParams = queryParams ? this.sortObject(queryParams) : [];
    for(let param in queryParams[0]){
      if(POSSIBLE_FILTERS.includes(param) && param !== 'filter' && param !== 'p')
        result = result + ';' + param.substring(0, 3) + '=' + queryParams[0][param];
    }
    return type ? type.substring(0, 2) + '_' + result + '_' + SERVER_NAME : result + '_' + SERVER_NAME;
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
