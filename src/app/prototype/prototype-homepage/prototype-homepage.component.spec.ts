import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeHomepageComponent } from './prototype-homepage.component';

describe('PrototypeHomepageComponent', () => {
  let component: PrototypeHomepageComponent;
  let fixture: ComponentFixture<PrototypeHomepageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeHomepageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeHomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
