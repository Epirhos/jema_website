/**
 * Cloudflare Pages Function : /securite/rapport
 *
 * Reçoit les rapports de la politique de sécurité du navigateur (CSP, voir
 * scripts/garde.mjs qui écrit dist/_headers) : un navigateur l'appelle quand une
 * page de jema.software tente de charger un script, un formulaire ou une connexion
 * non autorisés. C'est le signe d'une tentative d'injection ou d'un site modifié.
 *
 * Le bruit est filtré : extensions de navigateur, traducteurs et outils
 * installés chez le visiteur provoquent aussi des rapports, sans danger.
 */
import { alerter } from '../../src/server/alerte.js'

// Bruit : ce qui vient d'une extension installée chez le visiteur.
const BRUIT = /^(chrome|moz|safari|safari-web|ms-browser)-extension:/i
const MAX_OCTETS = 8 * 1024

export async function onRequestPost({ request, env, waitUntil }) {
  const texte = (await request.text()).slice(0, MAX_OCTETS)
  let rapports = []
  try {
    const json = JSON.parse(texte)
    // Ancien format (report-uri) : { "csp-report": {...} } ; nouveau (report-to) : [ { body: {...} } ]
    rapports = Array.isArray(json) ? json.map((r) => r.body || {}) : [json['csp-report'] || {}]
  } catch {
    return new Response(null, { status: 204 })
  }

  for (const r of rapports.slice(0, 5)) {
    const bloque = String(r['blocked-uri'] || r.blockedURL || '')
    const source = String(r['source-file'] || r.sourceFile || '')
    const page = String(r['document-uri'] || r.documentURL || '')
    const directive = String(r['violated-directive'] || r.effectiveDirective || '')
    if (BRUIT.test(bloque) || BRUIT.test(source)) continue
    if (!/^https:\/\/(jema\.software|www\.jema\.software|[\w-]+\.jema\.pages\.dev)\//.test(page)) continue
    waitUntil(
      alerter(env, 'Contenu bloqué sur le site', `Page : ${page}\nBloqué : ${bloque || '(non précisé)'}\nRègle : ${directive}\nSource : ${source || '(non précisée)'}`)
    )
  }
  return new Response(null, { status: 204 })
}
