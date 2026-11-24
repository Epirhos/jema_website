/**
 * Cloudflare Pages Function : POST jema.software/contact
 *
 * Reçoit le formulaire de contact de l'accueil et l'envoie par e-mail à l'éditeur,
 * via Brevo (Sendinblue SAS, France, serveurs dans l'Union européenne).
 * « Répondre » dans la boîte de réception écrit directement au visiteur (Reply-To).
 *
 * RGPD : rien n'est conservé par le site. Le message n'existe que dans l'e-mail
 * reçu (et, brièvement, dans les journaux d'envoi de Brevo, sous-traitant). Aucun
 * cookie, aucune donnée transmise à Umami. Voir la politique de confidentialité.
 *
 * Réglages (Cloudflare → Workers & Pages → jema → Settings → Variables and Secrets) :
 *   BREVO_API_KEY  (Secret)  clé API Brevo (SMTP & API → API Keys)
 *   CONTACT_FROM   (Texte)   expéditeur vérifié dans Brevo, ex. contact@jema.software
 * Sans ces réglages, le formulaire répond « indisponible » et propose l'adresse e-mail.
 *
 * SÉCURITÉ :
 *  - le destinataire est écrit en dur (DESTINATAIRE), comme le dépôt des téléchargements :
 *    un accès volé à l'admin ne peut pas détourner les messages (vérifié par scripts/garde.mjs) ;
 *  - seules les pages du site peuvent envoyer (en-tête Origin) ;
 *  - anti-robots sans cookie ni service tiers : champ piège invisible, délai minimal
 *    de saisie, 5 envois par heure et par connexion (adresse IP hachée, gardée 1 h en cache) ;
 *  - tailles bornées ; le texte part en texte brut (aucun HTML interprété).
 */
import { alerter } from '../src/server/alerte.js'

const DESTINATAIRE = 'editor.jema@gmail.com'
const SUJETS = { bug: 'Un bug', idee: 'Une idée', question: 'Une question', presse: 'Presse ou partenariat', autre: 'Autre' }
const MAX = { nom: 80, email: 254, message: 5000 }
const MIN_MESSAGE = 10
const DELAI_MIN_MS = 3000
const ENVOIS_PAR_HEURE = 5
const EMAIL = /^[^\s@<>()",;:]{1,64}@[^\s@<>()",;:]+\.[a-z]{2,}$/i
const ORIGINE = /^https:\/\/(jema\.software|www\.jema\.software|[\w-]+\.jema\.pages\.dev)$/

/** Réponse JSON pour le script de la page, redirection pour un navigateur sans JavaScript. */
function repondre(request, ok, erreur = '') {
  const json = (request.headers.get('Accept') || '').includes('application/json')
  if (json) {
    return new Response(JSON.stringify({ ok, erreur }), {
      status: ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    })
  }
  const origin = new URL(request.url).origin
  return new Response(null, { status: 303, headers: { Location: `${origin}/contact/${ok ? 'merci' : 'echec'}`, 'Cache-Control': 'no-store' } })
}

/** Ligne propre : sans retour à la ligne ni caractère de contrôle (en-têtes d'e-mail). */
const ligne = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
/** Texte multiligne : garde les retours à la ligne, retire les autres caractères de contrôle. */
const texte = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max)

async function hacher(valeur) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valeur))
  return [...new Uint8Array(octets)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

/** Compte les envois de la dernière heure pour cette connexion (cache Cloudflare, rien d'écrit ailleurs). */
async function tropDEnvois(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || ''
    if (!ip) return false
    const cache = caches.default
    const cle = new Request(`https://contact.jema.invalid/${await hacher('jema-contact:' + ip)}`)
    const deja = Number((await (await cache.match(cle))?.text()) || 0)
    if (deja >= ENVOIS_PAR_HEURE) return true
    await cache.put(cle, new Response(String(deja + 1), { headers: { 'Cache-Control': 'max-age=3600' } }))
  } catch { /* sans cache, on laisse passer : la limite de Cloudflare (règle de débit) reste en place */ }
  return false
}

async function lire(request) {
  const type = request.headers.get('Content-Type') || ''
  if (type.includes('application/json')) return await request.json()
  const f = await request.formData()
  return Object.fromEntries(f.entries())
}

export async function onRequestPost({ request, env, waitUntil }) {
  const origine = request.headers.get('Origin') || ''
  if (!ORIGINE.test(origine)) return repondre(request, false, 'origine')
  if (Number(request.headers.get('Content-Length') || 0) > 16 * 1024) return repondre(request, false, 'trop-long')

  let d
  try { d = await lire(request) } catch { return repondre(request, false, 'illisible') }

  // Robot : le champ piège est rempli, ou le formulaire est envoyé trop vite après l'affichage.
  // On répond « envoyé » pour ne rien lui apprendre, sans rien envoyer.
  // « t » est rempli par le script de la page : sans JavaScript, seul le piège s'applique.
  const affiche = Number(d.t || 0)
  if (ligne(d.site_web, 200) || (affiche && Date.now() - affiche < DELAI_MIN_MS)) return repondre(request, true)

  const nom = ligne(d.nom, MAX.nom)
  const email = ligne(d.email, MAX.email)
  const sujet = SUJETS[d.sujet] ? d.sujet : 'autre'
  const message = texte(d.message, MAX.message)
  if (!EMAIL.test(email)) return repondre(request, false, 'email')
  if (message.length < MIN_MESSAGE) return repondre(request, false, 'message')

  if (await tropDEnvois(request)) return repondre(request, false, 'limite')

  const cle = env?.BREVO_API_KEY
  const expediteur = ligne(env?.CONTACT_FROM, MAX.email)
  if (!cle || !EMAIL.test(expediteur)) {
    waitUntil(alerter(env, 'Formulaire de contact non configuré', 'BREVO_API_KEY ou CONTACT_FROM manquant : un message n\'a pas pu être envoyé.'))
    return repondre(request, false, 'indisponible')
  }

  const corps = [
    `De : ${nom || '(nom non précisé)'} <${email}>`,
    `Sujet : ${SUJETS[sujet]}`,
    `Page : ${ligne(request.headers.get('Referer'), 200) || '(inconnue)'}`,
    '',
    message,
    '',
    '—',
    'Envoyé depuis le formulaire de jema.software. Répondre à ce mail écrit directement à la personne.'
  ].join('\n')

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Site Jema', email: expediteur },
        to: [{ email: DESTINATAIRE, name: 'Jema' }],
        replyTo: nom ? { email, name: nom } : { email },
        subject: `[Site Jema] ${SUJETS[sujet]}${nom ? ` · ${nom}` : ''}`,
        textContent: corps,
        tags: ['contact-site']
      })
    })
    if (!res.ok) throw new Error(`Brevo ${res.status} ${(await res.text()).slice(0, 300)}`)
  } catch (e) {
    waitUntil(alerter(env, 'Formulaire de contact en panne', String(e?.message || e)))
    return repondre(request, false, 'envoi')
  }
  return repondre(request, true)
}

// Toute autre méthode : retour au formulaire.
export async function onRequest({ request }) {
  return new Response(null, { status: 303, headers: { Location: `${new URL(request.url).origin}/#contact` } })
}
