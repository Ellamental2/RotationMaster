import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotationSetComponent } from './rotation-set.component';

describe('RotationSetComponent', () => {
  let component: RotationSetComponent;
  let fixture: ComponentFixture<RotationSetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RotationSetComponent]
    });
    fixture = TestBed.createComponent(RotationSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
