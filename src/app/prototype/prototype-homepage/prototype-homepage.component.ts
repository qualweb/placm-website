import { Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, ChangeDetectorRef, Directive } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GraphicDisplayComponent } from '../graphic-display/graphic-display.component';
import { POSSIBLE_FILTERS } from 'src/utils/constants';

@Component({
  selector: 'app-prototype-homepage',
  templateUrl: './prototype-homepage.component.html',
  styleUrls: ['./prototype-homepage.component.css']
})
export class PrototypeHomepageComponent implements OnInit {

  //@ViewChild("graphics", {read: ViewContainerRef}) private divGraphics;
  @Directive({
    selector: '#graphics'
  })

  componentRef: ComponentRef<any>;
  actualCategory: string;
  possibleCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval', 'rule'];

  constructor(
    private vc: ViewContainerRef,
    private resolver: ComponentFactoryResolver,
    private activatedRoute: ActivatedRoute,
    private router: Router) 
    { 
    //vc.constructor.name === 'ViewContainerRef_';
    // override the route reuse strategy
    this.router.routeReuseStrategy.shouldReuseRoute = function() {
      return false;
    };
  }

  ngOnInit() {
    let cat = this.router.url.split('?')[0].replace('/','');
    if(cat === 'home'){
      this.actualCategory = 'continent';
    } else if (this.possibleCategories.includes(cat)){
      this.actualCategory = cat;
    } else {
      //todo erro
    }
    this.loadComponent(this.actualCategory);
  }

  ngAfterViewInit(){
  }

  // Function called after submitted button on app-graphic-picker
  submittedCategory(cat: string, extra?: any){
    if(!extra){
      this.router.navigate(['/'.concat(cat)]);
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
      console.log(queryParamsString);

      let navExtras = { queryParams: JSON.parse(queryParamsString) };
      this.router.navigate(['/'.concat(cat)], navExtras);
    }
   
    this.loadComponent(cat);
    this.actualCategory = cat;
  }

  private loadComponent(category: string){
    let factory: ComponentFactory<any>;

    // only needed if wanted to be cleared
    this.vc.clear(); 

    factory = this.resolver.resolveComponentFactory(GraphicDisplayComponent);
    let componentRef = this.vc.createComponent(factory);
    componentRef.instance.actualCategory = category;
    componentRef.instance.closedDialog.subscribe(cat => {
      if(cat){
        this.submittedCategory(cat.selected, cat);
      }
    });
  }

}
