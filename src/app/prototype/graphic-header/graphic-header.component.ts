import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { POSSIBLE_FILTERS } from 'utils/constants';

@Component({
  selector: 'app-graphic-header',
  templateUrl: './graphic-header.component.html',
  styleUrls: ['./graphic-header.component.css']
})
export class GraphicHeaderComponent implements OnInit {

  type: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router) { 
      this.router.events.subscribe(event => {
        if(event instanceof NavigationEnd ){
          let splittedUrl = event.url.split('/');
          if(splittedUrl.length > 1){
            if(splittedUrl[1] === 'assertions' || splittedUrl[1] === 'scriteria'){
              this.type = splittedUrl[1];
            } else {
              this.type = 'assertions';
            }
          }
        }
      });
    }

  ngOnInit(): void {
  }
  
  // Function called after submitted button on app-graphic-picker
  submittedCategory(event: any, extra?: any){
    if(!extra){
      this.router.navigate(['/' + event.type + '/' + event.cat]);
    } else {
      let queryParamsString = '{"' + extra.filter + '":"' + extra.id + '"';

      let actualExtras = this.activatedRoute.snapshot.queryParams;
      if(actualExtras){
        for(let params in actualExtras){
          if(POSSIBLE_FILTERS.includes(params) && params !== extra.filter && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString + ',"'
                     + params + '":"' + actualExtras[params] + '"';
          }
        }
      }
      queryParamsString = queryParamsString + '}';

      this.router.navigate(['/' + event.type + '/' + event.cat], {
        queryParams: JSON.parse(queryParamsString)
      });
    }
  }

}
