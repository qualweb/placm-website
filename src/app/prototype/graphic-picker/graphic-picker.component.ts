import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-graphic-picker',
  templateUrl: './graphic-picker.component.html',
  styleUrls: ['./graphic-picker.component.css']
})
export class GraphicPickerComponent implements OnInit {

  selectedCategory: string;
  categories: any[];

  @Input() actualCategory: string;
  @Input() showAll: boolean;
  @Output() submit = new EventEmitter();
  @Output() change = new EventEmitter();

  constructor(
    private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.categories = [];
    if(this.showAll){
      this.categories = [
        {
          name: 'Continent',
          abbr: 'continent'
        },
        {
          name: 'Country',
          abbr: 'country'
        },
        {
          name: 'Tag',
          abbr: 'tag'
        },
        {
          name: 'Sector',
          abbr: 'sector'
        },
        {
          name: 'Organization',
          abbr: 'org'
        },
        {
          name: 'App/Website',
          abbr: 'app'
        },
        {
          name: 'Evaluation Tool',
          abbr: 'eval'
        },
        {
          name: 'Rule',
          abbr: 'rule'
        }
      ];
    } else {
      switch(this.actualCategory){
        case 'home':
        case 'continent':
          this.categories = [
            {
              name: 'Country',
              abbr: 'country'
            },
            {
              name: 'Tag',
              abbr: 'tag'
            },
            {
              name: 'Sector',
              abbr: 'sector'
            },
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'App/Website',
              abbr: 'app'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          ];
          break;
        case 'country':
          if(!this.activatedRoute.snapshot.queryParams['tagIds']){
            this.categories.push(
              {
                name: 'Tag',
                abbr: 'tag'
              }
            );
          }
          this.categories.push(
            {
              name: 'Sector',
              abbr: 'sector'
            },
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'App/Website',
              abbr: 'app'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          );
          break;
        case 'tag':
          if(!this.activatedRoute.snapshot.queryParams['countryIds']){
            this.categories.push(
              {
                name: 'Country',
                abbr: 'country'
              }
            );
          }
          if(!this.activatedRoute.snapshot.queryParams['sectorIds']){
            this.categories.push(
              {
              name: 'Sector',
              abbr: 'sector'
              }
            );
          }
          this.categories.push(
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'App/Website',
              abbr: 'app'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          );
          break;
        case 'sector':
          if(!this.activatedRoute.snapshot.queryParams['tagIds']){
            this.categories.push(
              {
                name: 'Tag',
                abbr: 'tag'
              }
            );
          }
          this.categories.push(
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'App/Website',
              abbr: 'app'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          );
          break;
        case 'org':
          this.categories = [
            {
              name: 'App/Website',
              abbr: 'app'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          ];
          break;
        case 'app':
          this.categories = [
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          ];
          break;
        case 'eval':
          this.categories = [
            {
              name: 'Rule',
              abbr: 'rule'
            }];
          break;
        case 'rule':
          this.categories = [];
          break;
        default:
          this.categories = [];
          break;
      }
    }
  }

  clickedSubmit(value?: any) {
    if(value)
      this.changeCategory(value);
    this.submit.emit(this.selectedCategory);
  }

  changeCategory(value: any){
    this.selectedCategory = value;
    this.change.emit(this.selectedCategory);
  }

}
