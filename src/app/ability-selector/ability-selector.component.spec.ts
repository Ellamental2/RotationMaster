import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbilitySelectorComponent } from './ability-selector.component';

describe('AbilitySelectorComponent', () => {
  let component: AbilitySelectorComponent;
  let fixture: ComponentFixture<AbilitySelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbilitySelectorComponent]
    });
    fixture = TestBed.createComponent(AbilitySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
