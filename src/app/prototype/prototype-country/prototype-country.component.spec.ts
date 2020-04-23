import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeCountryComponent } from './prototype-country.component';

describe('PrototypeCountryComponent', () => {
  let component: PrototypeCountryComponent;
  let fixture: ComponentFixture<PrototypeCountryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeCountryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeCountryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
