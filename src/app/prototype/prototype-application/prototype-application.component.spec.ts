import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeApplicationComponent } from './prototype-application.component';

describe('PrototypeApplicationComponent', () => {
  let component: PrototypeApplicationComponent;
  let fixture: ComponentFixture<PrototypeApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeApplicationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
