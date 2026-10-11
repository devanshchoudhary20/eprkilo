export const RETRIEVED = '2026-10-11'
export const ARITHMETIC_LINE = 'eprkilo does arithmetic on your export; it does not tell you what you owe or whether you must register.'
export const CITEO_THRESHOLD_UNITS = 10_000

export const GERMANY_URL = 'https://www.verpackungsregister.org/en/system-participation-data-reporting/data-reporting'
export const FRANCE_URL = 'https://ecd-bo.citeo.com/ecd2/medias/citeo/public/fr/guide-du-tarif-des-emballages-menagers-2026.pdf'
export const SPAIN_URL = 'https://www.miteco.gob.es/content/dam/miteco/es/calidad-y-evaluacion-ambiental/sgecocir/envases/registro-productores-de-producto/251203_FAQ_envases_def-4.pdf'

export type Quote = { text: string; translation?: string }

export const GERMANY_FIELDS: Array<[string, string]> = [
  ['Glass', 'Glass'],
  ['Paper/cardboard', 'Paper/paperboard/cardboard'],
  ['Steel', 'Ferrous metals'],
  ['Aluminium', 'Aluminium'],
  ['Plastic', 'Plastics'],
  ['Composite', 'Other composite packaging'],
  ['Wood, Other', 'Other materials'],
  ['(none)', 'Beverage carton, always 0'],
]

export const SPAIN_FIELDS: Array<[string, string]> = [
  ['Paper/cardboard', 'papel-cartón'],
  ['Plastic', 'plástico'],
  ['Steel', 'acero'],
  ['Aluminium', 'aluminio'],
  ['Wood', 'madera'],
  ['Composite', 'brik/compuesto'],
  ['Other', 'otros'],
  ['Glass', 'Ecovidrio, not the MITECO form'],
]

export const GERMANY_QUOTES: Quote[] = [
  { text: 'Registration alone is not enough for certain types of packaging.' },
  { text: 'Enter the packaging volumes in kilogrammes to the third decimal point.' },
  {
    text: 'A simplified reporting requirement applies to producers who made available less than 10 tonnes of packaging subject to system participation in Germany for the first time in the previous calendar year: instead of submitting every data report made to the system operator to the LUCID Packaging Register, these producers may submit a year-end volume report bundling all their packaging volume information to the ZSVR by 1 June of the following calendar year.',
  },
  { text: 'Whenever a company reports packaging volumes to its system operator, the exact same report must also be filed with the LUCID Packaging Register.' },
]

// The translation leaves out the euro amount so the only fee figure on the page is inside the Citeo quote.
export const FRANCE_SMALL: Quote = {
  text: 'Vous mettez < 10 000 emballages sur le marché et < 5 tonnes de papiers : vous payez le forfait de 110 €.',
  translation: 'You put fewer than 10,000 packages on the market and fewer than 5 tonnes of paper: you pay the flat fee (the amount is in the quote above).',
}

export const FRANCE_LARGE: Quote = {
  text: 'VOUS METTEZ EN MARCHÉ ENTRE 10 000 et 500 000 UVC PAR AN',
  translation: 'You put between 10,000 and 500,000 sales units (UVC) on the market per year.',
}

export const SPAIN_QUOTES: Quote[] = [
  {
    text: 'los productores de producto que introduzcan en el mercado menos de 15 toneladas de envases al año proporcionarán dicha información de forma simplificada.',
    translation: 'producers who place less than 15 tonnes of packaging on the market per year will provide this information in a simplified form.',
  },
  {
    text: 'Cuando se trate de poca cantidad puesta en el mercado (menos de 15 t), la única consideración a tener en cuenta es que tendrá que realizar una declaración simplificada en lugar de la habitual, pero debe registrarse y cumplir con las correspondientes obligaciones de información anual.',
    translation: 'When the quantity placed on the market is small (under 15 t), the only thing to keep in mind is that you will have to make a simplified declaration instead of the usual one, but you must register and meet the corresponding annual reporting obligations.',
  },
]
