import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeRuleComponent } from './prototype-rule.component';

describe('PrototypeRuleComponent', () => {
  let component: PrototypeRuleComponent;
  let fixture: ComponentFixture<PrototypeRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
