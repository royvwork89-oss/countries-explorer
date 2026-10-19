export interface Language {
  code: string;
  name: string;
}

export interface Country {
  id: string;
  alpha2: string | null;
  name: string;
  nameEn: string;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  area: number | null;
  languages: Language[];
  borders: string[];
  flagUrl: string | null;
}
