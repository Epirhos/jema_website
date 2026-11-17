#!/usr/bin/env node
/**
 * Fabrique docs/manuel/Manuel-site-Jema.pdf depuis docs/manuel/manuel.html.
 * Utilise le navigateur déjà installé (Microsoft Edge, sinon Google Chrome) :
 * aucun navigateur à télécharger.
 *
 * Usage : npm run manuel
 */
import { chromium } from 'playwright-core'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'docs/manuel/manuel.html')
const out = resolve(root, 'docs/manuel/Manuel-site-Jema.pdf')

let browser
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel }); break } catch { /* essai suivant */ }
}
if (!browser) {
  console.error('Ni Microsoft Edge ni Google Chrome trouvé : installez l\'un des deux.')
  process.exit(1)
}

const page = await browser.newPage()
await page.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;padding:0 17mm;font:7.5pt Inter,Arial,sans-serif;color:#635d54;display:flex;justify-content:space-between">
    <span>Site Jema · Manuel technique</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
})
await browser.close()
console.log(`PDF écrit : ${out}`)
