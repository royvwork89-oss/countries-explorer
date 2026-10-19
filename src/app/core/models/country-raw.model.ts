export interface CountryRawLanguage {
  iso639_1?: string | null;
  iso639_2?: string | null;
  name?: string | null;
  nativeName?: string | null;
}

export interface CountryRaw {
  alpha2Code?: string | null;
  alpha3Code?: string | null;
  name?: string | null;
  capital?: string | null;
  region?: string | null;
  subregion?: string | null;
  population?: number | null;
  area?: number | null;
  languages?: CountryRawLanguage[] | null;
  translations?: Record<string, string | null | undefined> | null;
  borders?: string[] | null;
}
