import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicHeaderComponent } from './graphic-header.component';

describe('GraphicHeaderComponent', () => {
  let component: GraphicHeaderComponent;
  let fixture: ComponentFixture<GraphicHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphicHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
