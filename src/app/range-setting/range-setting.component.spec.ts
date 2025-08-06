import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RangeSettingComponent } from './range-setting.component';

describe('RangeSettingComponent', () => {
  let component: RangeSettingComponent;
  let fixture: ComponentFixture<RangeSettingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RangeSettingComponent]
    });
    fixture = TestBed.createComponent(RangeSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
