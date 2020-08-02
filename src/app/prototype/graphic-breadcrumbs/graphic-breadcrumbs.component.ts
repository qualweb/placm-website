import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { POSSIBLE_FILTERS, LABELS_SINGULAR } from 'utils/constants';

@Component({
  selector: 'app-graphic-breadcrumbs',
  templateUrl: './graphic-breadcrumbs.component.html',
  styleUrls: ['./graphic-breadcrumbs.component.css']
})
export class GraphicBreadcrumbsComponent implements OnInit {

  breadcrumbs: any;
  actualGraphicType: string;
  actualCategory: string;

  @Input('appNames') appNames: string[] = [];
  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.actualGraphicType = this.activatedRoute.snapshot.parent.url[0].path;
    this.actualCategory = this.activatedRoute.snapshot.url[0].path;

    this.activatedRoute.queryParams.subscribe(x => {
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
            route: '/' + this.actualGraphicType + '/' + route,
            queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
          });
      }
    }

    if(this.actualCategory === 'scApp'){
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

}
