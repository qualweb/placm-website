import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { POSSIBLE_FILTERS } from 'utils/constants';

@Component({
  selector: 'app-graphic-header',
  templateUrl: './graphic-header.component.html',
  styleUrls: ['./graphic-header.component.css']
})
export class GraphicHeaderComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
  }
  // Function called after submitted button on app-graphic-picker
  submittedCategory(cat: string, extra?: any){
    if(!extra){
      this.router.navigate([cat], {
        relativeTo: this.activatedRoute
      });
    } else {
      let queryParamsString = '{"'.concat(extra.filter).concat('":"').concat(extra.id).concat('"');

      let actualExtras = this.activatedRoute.snapshot.queryParams;
      if(actualExtras){
        for(let params in actualExtras){
          if(POSSIBLE_FILTERS.includes(params) && params !== extra.filter && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString.concat(',"')
                    .concat(params).concat('":"').concat(actualExtras[params]).concat('"');
          }
        }
      }
      queryParamsString = queryParamsString.concat('}');

      this.router.navigate([cat], {
        relativeTo: this.activatedRoute,
        queryParams: JSON.parse(queryParamsString)
      });
    }
  }

}
