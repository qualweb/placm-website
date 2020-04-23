import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrototypeEvaluationComponent } from './prototype-evaluation.component';

describe('PrototypeEvaluationComponent', () => {
  let component: PrototypeEvaluationComponent;
  let fixture: ComponentFixture<PrototypeEvaluationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrototypeEvaluationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrototypeEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
