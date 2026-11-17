/**
 * État des téléchargements, piloté depuis l'admin (Réglages → Téléchargements).
 * Fermés : tous les boutons Télécharger sont remplacés par un encart qui
 * explique pourquoi, donne la date de reprise et propose « Me prévenir ».
 * Les adresses /telecharger/<système> (functions/telecharger/[os].js) suivent
 * le même réglage : un lien partagé ailleurs ne télécharge plus rien non plus.
 */
import site from '../data/site.json'
import { dateFr } from './format.js'

const d = site.downloads || {}

export const downloadsOpen = d.open !== false

/** « 12 décembre 2026 », ou '' si aucune date n'est prévue. */
export const resumeDate = (() => {
  if (!d.until) return ''
  const date = new Date(`${d.until}T12:00:00`)
  return Number.isNaN(date.valueOf()) ? '' : dateFr(date)
})()

export const pauseTitle = d.title || 'Les téléchargements reprennent bientôt.'
export const pauseReason = d.reason || ''

/** Lien « Me prévenir » : un e-mail prérempli vers l'adresse de contact. */
export const notifyHref = `mailto:${site.contactEmail}?subject=${encodeURIComponent('Prévenez-moi à la reprise des téléchargements de Jema')}&body=${encodeURIComponent("Bonjour,\n\nJ'aimerais recevoir un message quand Jema sera de nouveau téléchargeable.\n\nMerci !")}`

