import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Signon } from './signon';

describe('Signon', () => {
  let component: Signon;
  let fixture: ComponentFixture<Signon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Signon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
