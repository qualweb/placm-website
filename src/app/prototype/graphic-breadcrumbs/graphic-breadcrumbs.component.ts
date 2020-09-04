import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { POSSIBLE_FILTERS, LABELS_SINGULAR, LABELS_PLURAL } from 'utils/constants';

@Component({
  selector: 'app-graphic-breadcrumbs',
  templateUrl: './graphic-breadcrumbs.component.html',
  styleUrls: ['./graphic-breadcrumbs.component.css']
})
export class GraphicBreadcrumbsComponent implements OnInit {

  breadcrumbs: any = [];
  graphicType: string;
  category: string;
  comparing: boolean;

  @Input('appNames') appNames: string[] = [];
  @Input('data') data: any;
  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    /* this.comparing = this.activatedRoute.snapshot.parent.parent.url.length > 0 &&
      this.activatedRoute.snapshot.parent.parent.url[0].path &&
      this.activatedRoute.snapshot.parent.parent.url[0].path === 'compare';
    this.actualGraphicType = this.activatedRoute.snapshot.parent.url[0].path;
    this.actualCategory = this.activatedRoute.snapshot.url[0].path; */
    this.comparing = this.data.comparing;
    this.graphicType = this.data.type;
    this.category = this.data.category;

    this.activatedRoute.queryParams.subscribe(() => {
      if(this.comparing)
        this.prepareComparingBreadcrumbs();
      else
        this.prepareBreadcrumbs();
    });
  }

  prepareBreadcrumbs(): void {
    this.breadcrumbs = [];
    let queryParams = this.activatedRoute.snapshot.queryParams;
    let removed;
    let removableFilters = ['filter', 'p'];
    for(let f of removableFilters){
      if(queryParams[f])
        ({[f]: removed, ...queryParams} = queryParams);
    }

    let keys = (Object.keys(queryParams)).reverse();
    let route = "";
    let queryParamsToBe = []

    for(let i = 0; i < keys.length; i++){
      if(POSSIBLE_FILTERS.includes(keys[i])){
        queryParamsToBe = [];
        for(let j = i; j >= 0; j--) {
          if(j === i){
            route = keys[j].replace('Ids', '');
          } else {
            queryParamsToBe.push('"' + keys[j] + '":"' + queryParams[keys[j]] + '"');
          }
        }
        this.breadcrumbs.push(
          {
            name: LABELS_SINGULAR[route],
            route: '/' + this.graphicType + '/' + route,
            queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
          });
      }
    }

    if(this.category === 'scApp'){
      if(keys.length){
        this.breadcrumbs.push(
          {
            name: this.appNames.join(';')
          }
        );
      }
    } else {
      this.breadcrumbs.push(
        {
          name: LABELS_SINGULAR[this.activatedRoute.snapshot.routeConfig.path]
        }
      );
    }
  }

  prepareComparingBreadcrumbs(): void {
    this.breadcrumbs = [];
    let queryParamsToBe = [];
    let queryParams = this.activatedRoute.snapshot.queryParams;
    let keys = (Object.keys(queryParams));
    for(let i = 1; i < keys.length; i++){
      if(POSSIBLE_FILTERS.includes(keys[i]) && keys[i] !== 'p' && keys[i] !== 'filter'){
        queryParamsToBe.push('"' + keys[i] + '":"' + queryParams[keys[i]] + '"');
      }
    }
    this.breadcrumbs.push(
      {
        name: LABELS_SINGULAR[this.category],
        route: '/' + this.graphicType + '/' + this.category,
        queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
      });
      
    let result = this.prepareComparingText();  
    this.breadcrumbs.push(
      {
        name: result,
      });
  }

  prepareComparingText(): string {
    let names = this.data.names;
    let result = 'Comparing ';
    result += LABELS_PLURAL[this.category];
    if(this.category !== this.data.title){
      result += ' grouped by ' + LABELS_PLURAL[this.data.title];
    }
    result += ' (' + names.slice(0, -1).join(', ') + ' and ' + names.slice(-1) + ')';
    return result;
  }

}
