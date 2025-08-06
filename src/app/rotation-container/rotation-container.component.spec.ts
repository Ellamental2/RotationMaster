import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotationContainerComponent } from './rotation-container.component';

describe('RotationContainerComponent', () => {
  let component: RotationContainerComponent;
  let fixture: ComponentFixture<RotationContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RotationContainerComponent]
    });
    fixture = TestBed.createComponent(RotationContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
