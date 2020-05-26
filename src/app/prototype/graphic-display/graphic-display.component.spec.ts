import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicDisplayComponent } from './graphic-display.component';

describe('GraphicDisplayComponent', () => {
  let component: GraphicDisplayComponent;
  let fixture: ComponentFixture<GraphicDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
