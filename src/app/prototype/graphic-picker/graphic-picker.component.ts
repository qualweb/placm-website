import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

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

  constructor() { }

  ngOnInit(): void {
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
          name: 'Application',
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
              name: 'Application',
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
          this.categories = [
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
              name: 'Application',
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
        case 'tag':
          this.categories = [
            {
              name: 'Sector',
              abbr: 'sector'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'Application',
              abbr: 'app'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          ];
          break;
        case 'sector':
          this.categories = [
            {
              name: 'Tag',
              abbr: 'tag'
            },
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Organization',
              abbr: 'org'
            },
            {
              name: 'Application',
              abbr: 'app'
            },
            {
              name: 'Rule',
              abbr: 'rule'
            }
          ];
          break;
        case 'org':
          this.categories = [
            {
              name: 'Evaluation Tool',
              abbr: 'eval'
            },
            {
              name: 'Application',
              abbr: 'app'
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
          this.categories = [];
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
  }

}
