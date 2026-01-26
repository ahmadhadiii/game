import countriesJson from '../data/country_codes_and_names.json';

export type Country = {
  code: string;
  name: string;
};

const countriesMap = countriesJson as Record<string, string>;

export const countriesArray: Country[] = Object.entries(countriesMap).map(
  ([code, name]) => ({
    code: code.toUpperCase(),
    name,
  }),
);
