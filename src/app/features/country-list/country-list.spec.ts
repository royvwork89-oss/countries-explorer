import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { CountriesDataSource } from '../../core/data/countries-data-source';
import { CountryRaw } from '../../core/models/country-raw.model';
import { CountryList } from './country-list';

class FakeDataSource extends CountriesDataSource {
  private readonly response: Observable<CountryRaw[]>;

  constructor(response: Observable<CountryRaw[]>) {
    super();
    this.response = response;
  }

  override load(): Observable<CountryRaw[]> {
    return this.response;
  }
}

function raws(count: number): CountryRaw[] {
  return Array.from({ length: count }, (_, index) => {
    const n = String(index).padStart(3, '0');
    return {
      alpha3Code: `C${n}`,
      alpha2Code: 'XX',
      name: `Pais ${n}`,
      capital: `Capital ${n}`,
      region: 'Americas',
      subregion: 'Central America',
      population: 1000 + index,
      area: 500 + index,
    };
  });
}

async function render(response: Observable<CountryRaw[]>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: CountryList }]),
      { provide: CountriesDataSource, useValue: new FakeDataSource(response) },
    ],
  });
  const fixture = TestBed.createComponent(CountryList);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

describe('CountryList', () => {
  it('shows a loading message while the data is loading', async () => {
    const { root } = await render(NEVER);
    expect(root.textContent).toContain('Cargando países');
  });

  it('shows an error with a retry button when loading fails', async () => {
    const { root } = await render(throwError(() => new Error('red')));
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    expect(root.querySelector('button')?.textContent).toContain('Reintentar');
  });

  it('renders the first page and reveals more with "Mostrar más"', async () => {
    const { fixture, root } = await render(of(raws(60)));
    expect(root.querySelectorAll('ul.grid li')).toHaveLength(48);

    const more = root.querySelector<HTMLButtonElement>('button.more');
    expect(more?.textContent).toContain('12 restantes');
    more?.click();
    await fixture.whenStable();

    expect(root.querySelectorAll('ul.grid li')).toHaveLength(60);
    expect(root.querySelector('button.more')).toBeNull();
  });

  it('filters by name or capital and explains when nothing matches', async () => {
    const { fixture, root } = await render(of(raws(10)));
    const input = root.querySelector<HTMLInputElement>('#country-search')!;

    input.value = 'pais 003';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(root.querySelectorAll('ul.grid li')).toHaveLength(1);

    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(root.querySelectorAll('ul.grid li')).toHaveLength(0);
    expect(root.textContent).toContain('No hay países que coincidan');
  });
});
