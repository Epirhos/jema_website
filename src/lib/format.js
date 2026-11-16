const long = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
export const dateFr = (d) => long.format(d)
/** Slug d'une version : « 4.0.0 » → « 4-0-0 ». */
export const versionSlug = (v) => String(v).replace(/^v/, '').replace(/\./g, '-')
