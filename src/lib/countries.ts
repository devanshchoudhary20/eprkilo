export type CountryClass =
  | { kind: 'eu'; iso: string; name: string }
  | { kind: 'outside' }
  | { kind: 'none' }
  | { kind: 'unrecognised'; name: string }

type EuCountry = { iso: string; name: string; variants: string[] }

export const EU_COUNTRIES: EuCountry[] = [
  { iso: 'AT', name: 'Austria', variants: ['Österreich', 'Oesterreich', 'Autriche', 'Austria'] },
  { iso: 'BE', name: 'Belgium', variants: ['België', 'Belgique', 'Belgien', 'Belgio', 'Bélgica'] },
  { iso: 'BG', name: 'Bulgaria', variants: ['България', 'Bulgarie', 'Bulgarien', 'Bulgaristan'] },
  { iso: 'HR', name: 'Croatia', variants: ['Hrvatska', 'Kroatien', 'Croatie', 'Croazia', 'Croacia'] },
  { iso: 'CY', name: 'Cyprus', variants: ['Κύπρος', 'Kypros', 'Chypre', 'Zypern', 'Cipro', 'Chipre', 'Kıbrıs'] },
  {
    iso: 'CZ',
    name: 'Czechia',
    variants: ['Czech Republic', 'Česko', 'Česká republika', 'Tschechien', 'Tchéquie', 'République tchèque', 'Repubblica Ceca', 'República Checa'],
  },
  { iso: 'DK', name: 'Denmark', variants: ['Danmark', 'Dänemark', 'Danemark', 'Danimarca', 'Dinamarca'] },
  { iso: 'EE', name: 'Estonia', variants: ['Eesti', 'Estland', 'Estonie', 'Estonie'] },
  { iso: 'FI', name: 'Finland', variants: ['Suomi', 'Finnland', 'Finlande', 'Finlandia'] },
  { iso: 'FR', name: 'France', variants: ['Frankreich', 'Francia', 'Frankrijk'] },
  { iso: 'DE', name: 'Germany', variants: ['Deutschland', 'Allemagne', 'Alemania', 'Germania', 'Duitsland'] },
  { iso: 'GR', name: 'Greece', variants: ['Ελλάδα', 'Hellas', 'Ellada', 'Griechenland', 'Grèce', 'Grecia'] },
  { iso: 'HU', name: 'Hungary', variants: ['Magyarország', 'Ungarn', 'Hongrie', 'Ungheria', 'Hungría'] },
  { iso: 'IE', name: 'Ireland', variants: ['Éire', 'Eire', 'Irland', 'Irlande', 'Irlanda', 'Republic of Ireland', 'Ierland'] },
  { iso: 'IT', name: 'Italy', variants: ['Italia', 'Italien', 'Italie', 'Italië'] },
  { iso: 'LV', name: 'Latvia', variants: ['Latvija', 'Lettland', 'Lettonie', 'Lettonia', 'Letonia'] },
  { iso: 'LT', name: 'Lithuania', variants: ['Lietuva', 'Litauen', 'Lituanie', 'Lituania'] },
  { iso: 'LU', name: 'Luxembourg', variants: ['Luxemburg', 'Lëtzebuerg', 'Lussemburgo', 'Luxemburgo'] },
  { iso: 'MT', name: 'Malta', variants: ['Malte'] },
  {
    iso: 'NL',
    name: 'Netherlands',
    variants: ['The Netherlands', 'Nederland', 'Holland', 'Niederlande', 'Pays-Bas', 'Países Bajos', 'Paesi Bassi'],
  },
  { iso: 'PL', name: 'Poland', variants: ['Polska', 'Polen', 'Pologne', 'Polonia'] },
  { iso: 'PT', name: 'Portugal', variants: ['Portugália'] },
  { iso: 'RO', name: 'Romania', variants: ['România', 'Rumänien', 'Roumanie', 'Rumania', 'Romania'] },
  { iso: 'SK', name: 'Slovakia', variants: ['Slovensko', 'Slowakei', 'Slovaquie', 'Slovak Republic', 'Slovacchia', 'Eslovaquia'] },
  { iso: 'SI', name: 'Slovenia', variants: ['Slovenija', 'Slowenien', 'Slovénie', 'Slovenia', 'Eslovenia'] },
  { iso: 'ES', name: 'Spain', variants: ['España', 'Spanien', 'Espagne', 'Spagna', 'Spanje'] },
  { iso: 'SE', name: 'Sweden', variants: ['Sverige', 'Schweden', 'Suède', 'Svezia', 'Suecia'] },
]

export const FLAGGED_ISOS = new Set(['DE', 'FR', 'ES'])

const NON_EU_NAMES = [
  'United States', 'United States of America', 'USA', 'US', 'United Kingdom', 'UK', 'Great Britain', 'England', 'Scotland', 'Wales',
  'Northern Ireland', 'Canada', 'Australia', 'New Zealand', 'Switzerland', 'Schweiz', 'Suisse', 'Svizzera', 'Suiza', 'Norway',
  'Norge', 'Norwegen', 'Norvège', 'Iceland', 'Island', 'Islande', 'Liechtenstein', 'Monaco', 'Andorra', 'San Marino', 'Vatican City',
  'Albania', 'Bosnia and Herzegovina', 'Kosovo', 'Montenegro', 'North Macedonia', 'Macedonia', 'Serbia', 'Moldova', 'Ukraine',
  'Belarus', 'Russia', 'Turkey', 'Türkiye', 'Georgia', 'Armenia', 'Azerbaijan', 'Israel', 'Japan', 'China', 'Hong Kong', 'Taiwan',
  'South Korea', 'Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'India', 'Pakistan',
  'Bangladesh', 'Sri Lanka', 'Nepal', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan',
  'Lebanon', 'Egypt', 'Morocco', 'Tunisia', 'Algeria', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Mexico', 'Brazil', 'Argentina',
  'Chile', 'Colombia', 'Peru', 'Uruguay', 'Costa Rica', 'Panama', 'Puerto Rico', 'Jamaica', 'Bahamas', 'Barbados', 'Dominican Republic',
  'Trinidad and Tobago', 'Bermuda', 'Cayman Islands', 'Guernsey', 'Jersey', 'Isle of Man', 'Gibraltar', 'Faroe Islands', 'Greenland',
  'Kazakhstan', 'Uzbekistan', 'Mongolia', 'Fiji', 'Mauritius', 'Cambodia', 'Brunei', 'Macau',
]

function normalise(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const EU_BY_NAME = new Map<string, EuCountry>()
EU_COUNTRIES.forEach((country) => {
  EU_BY_NAME.set(normalise(country.name), country)
  country.variants.forEach((variant) => EU_BY_NAME.set(normalise(variant), country))
})
const NON_EU_SET = new Set(NON_EU_NAMES.map(normalise))

export function classifyCountry(raw: string | undefined): CountryClass {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { kind: 'none' }
  const key = normalise(trimmed)
  const eu = EU_BY_NAME.get(key)
  if (eu) return { kind: 'eu', iso: eu.iso, name: eu.name }
  if (NON_EU_SET.has(key)) return { kind: 'outside' }
  return { kind: 'unrecognised', name: trimmed }
}
