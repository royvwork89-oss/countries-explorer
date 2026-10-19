import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FavoritesRepository } from './core/favorites/favorites.repository';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: FavoritesRepository, useValue: { load: () => [], save: () => undefined } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('moves focus to the main content from the skip link without navigating', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLAnchorElement>('.skip-link')?.click();
    expect(document.activeElement?.id).toBe('main');
  });

  it('should render the header brand and the main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('Countries Explorer');
    expect(compiled.querySelector('main#main')).not.toBeNull();
  });
});
