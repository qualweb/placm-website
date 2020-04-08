import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeTagComponent } from './prototype-tag.component';

describe('PrototypeTagComponent', () => {
  let component: PrototypeTagComponent;
  let fixture: ComponentFixture<PrototypeTagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeTagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
