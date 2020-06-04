import { Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, ChangeDetectorRef, Directive } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { GraphicDisplayComponent } from '../graphic-display/graphic-display.component';
import { POSSIBLE_FILTERS } from 'utils/constants';

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
    this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.router.navigated = true;
      }
    });
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

  private loadComponent(category: string){
    let factory: ComponentFactory<any>;

    // only needed if wanted to be cleared
    //this.vc.clear(); 

    factory = this.resolver.resolveComponentFactory(GraphicDisplayComponent);
    console.log(this.componentRef);
    if(!this.componentRef){
      this.componentRef = this.vc.createComponent(factory);
      this.componentRef.instance.actualCategory = category;
      this.componentRef.instance.closedDialog.subscribe(cat => {
        if(cat){
          //this.submittedCategory(cat.selected, cat);
        }
      });
    }
  }

}
