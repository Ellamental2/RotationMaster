import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotationPreviewComponent } from './rotation-preview.component';

describe('RotationPreviewComponent', () => {
  let component: RotationPreviewComponent;
  let fixture: ComponentFixture<RotationPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RotationPreviewComponent]
    });
    fixture = TestBed.createComponent(RotationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
