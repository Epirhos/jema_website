# Suivi d'architecture — site jema.software

Document vivant : il décrit l'architecture **en vigueur** et garde la trace des
décisions. À mettre à jour à chaque évolution de structure, de sécurité ou de
service tiers (une ligne datée dans le journal ci-dessous). Les procédures pas à
pas sont dans le manuel (`docs/manuel/`), les consignes de l'éditeur dans
l'admin (`/admin/aide`).

Dernière mise à jour : 21/11/2026 (lancement en production).

## 1. Vue d'ensemble

```
 Éditeur ── /admin (Sveltia CMS) ──┐
                                   ├─ commit ─► GitHub Epirhos/jema_website ─► Cloudflare Pages
 Développeur ── git push (bulle) ──┘              │                              │ npm run build
                                                  │                              │  ├ garde source
                                                  │                              │  ├ astro build
                                                  │                              │  └ garde dist → _headers (CSP)
                                                  ▼                              ▼
                                        Sentinelle (Actions)          jema.software (statique)
                                        à chaque envoi + 6 h            + functions/
                                                                         ├ /telecharger/<os> ─► GitHub Releases
                                                                         └ /securite/rapport ─► alerte ntfy
 Visiteur ─► jema.software ─► Umami Cloud (audience, sans cookie)
                          └─► api.github.com (numéro de version affiché)
```

| Brique | Rôle | Emplacement |
|---|---|---|
| Astro 7, sortie statique (Node 24, `.node-version`) | Pages, contenus Markdown, images WebP | `src/`, `astro.config.mjs` |
| React 19 | Barre de navigation uniquement | `src/components/Navbar.jsx` |
| Tailwind 4 (plugin Vite) + CSS | Mise en forme, identité | `src/styles/global.css` |
| Sveltia CMS 0.256.1 (unpkg + SRI) | Administration sans code, écrit dans GitHub | `public/admin/` |
| Cloudflare Pages | Construction, hébergement, HTTPS, aperçus par branche | projet `jema` |
| Pages Functions | Téléchargements, rapports de sécurité | `functions/` |
| Umami Cloud | Mesure d'audience sans cookie | `src/components/astro/Analytics.astro` |
| GitHub Releases | Fichiers d'installation, publiés par la CI de l'app | `Epirhos/jema-releases` |
| Garde de construction | Bloque la publication d'un site détourné, écrit la CSP | `scripts/garde.mjs` |
| Sentinelle | Surveille le dépôt et le site, ouvre des tickets | `.github/workflows/sentinelle.yml` |
| ntfy.sh | Alertes push sur téléphone (secret `ALERTE_NTFY`) | `src/server/alerte.js` |

## 2. Données et sources de vérité

| Donnée | Source unique | Éditée par |
|---|---|---|
| Adresse du site | `src/data/site.json` → `siteUrl` | code (verrouillée dans l'admin) |
| Dépôt des versions | écrit en dur dans `functions/telecharger/[os].js` (`DEPOT`) | code |
| E-mail de contact | `site.json` → `contactEmail` | code (verrouillée) |
| Ouverture / pause des téléchargements | `src/data/downloads.json` | admin |
| Bandeau | `src/data/banner.json` | admin |
| Versions, journal, pages | `src/content/{versions,journal,pages}/` | admin |
| Mode d'emploi | `src/content/guide/` ← copié de `jema-editor_v2` | `npm run sync:guide` |
| Valeurs attendues (sécurité) | `ATTENDU` dans `scripts/garde.mjs` **et** `env` de `sentinelle.yml` | code (les deux ensemble) |

## 3. Branches et déploiement

- `main` : production, `jema.software`. L'admin y publie directement (`config.yml` → `branch: main`).
- `bulle` : test, `bulle.jema.pages.dev`. Se remet à jour avec `git merge origin/main` avant tout travail.
- `main` est protégée : ni réécriture (force push) ni suppression.
- Retour arrière : Cloudflare → Deployments → Rollback (immédiat).

## 4. Sécurité (résumé, détail : manuel chapitre 21)

- **Téléchargements** : aucune adresse de fichier dans les pages ; seule la fonction redirige, vers `github.com/Epirhos/jema-releases/releases/download/` uniquement.
- **Contenus** : la garde refuse scripts, cadres, formulaires, `javascript:`, exécutables externes, e-mails autres que le contact.
- **Navigateur** : CSP stricte à empreintes (sha256) des scripts intégrés ; seuls le site et Umami peuvent exécuter du code ; HSTS, nosniff, Referrer-Policy, Permissions-Policy, anti-cadre ; rapports vers `/securite/rapport`.
- **Admin** : script Sveltia avec empreinte SRI ; jeton GitHub limité au droit *Contents* sur ce seul dépôt, qui ne peut pas modifier `.github/workflows` (la sentinelle reste hors d'atteinte).
- **Comptes** : double authentification sur GitHub, Cloudflare, Name.com, Umami, Gmail.
- **Domaine** : Name.com, verrou de transfert, DNSSEC actif. **Expire le 19/11/2027.**
- **Contact sécurité** : `public/.well-known/security.txt` (RFC 9116), `Expires` à renouveler chaque année.

## 5. Données personnelles (RGPD)

Registre des traitements : manuel, chapitre 17. Principes retenus :
aucun cookie ; mesure d'audience anonyme qui respecte « Ne pas suivre » et Global Privacy Control
(navigateur **et** fonction de téléchargement) ; aucune adresse IP transmise à Umami par la fonction ;
polices hébergées sur le site ; aucun formulaire qui collecte des données (contact par la messagerie du visiteur).
Tout nouvel outil tiers impose de mettre à jour : registre, politique de confidentialité, CSP (`garde.mjs`) et ce journal.

## 6. Journal des décisions

| N° | Date | Décision | Pourquoi |
|---|---|---|---|
| D-01 | 11/2026 | Astro statique à la place de l'ancien site React/Vite | Pages légères, contenus Markdown, aucun serveur à entretenir. |
| D-02 | 11/2026 | Sveltia CMS avec jeton GitHub | Admin sans code et sans serveur ; les contenus restent dans Git (historique, retour arrière). |
| D-03 | 11/2026 | Cloudflare Pages au lieu de GitHub Pages | Fonctions (téléchargements), en-têtes de sécurité, aperçus par branche, offre gratuite suffisante. Les exécutables restent construits par GitHub Actions dans le dépôt de l'app (pas de coût Cloudflare). |
| D-04 | 11/2026 | Umami Cloud, sans cookie | Statistiques utiles sans bannière de consentement. |
| D-05 | 16/11/2026 | Pause des téléchargements pilotée depuis l'admin (`downloads.json`) | Garder le site en ligne pendant une réécriture tout en expliquant pourquoi on ne peut pas télécharger. |
| D-06 | 17/11/2026 | Admin habillé à l'identité du site + mode d'emploi intégré + manuel PDF | Maintenance possible sans aide extérieure. |
| D-07 | 18/11/2026 | Téléchargements uniquement via `/telecharger/<os>`, dépôt écrit en dur | Un accès volé à l'admin ne doit pas pouvoir faire télécharger un autre fichier. |
| D-08 | 18/11/2026 | Garde de construction + CSP à empreintes générée après la construction | Bloquer avant publication tout contenu qui injecte du code ou détourne les visiteurs. |
| D-09 | 18/11/2026 | Sentinelle GitHub Actions + alertes ntfy | Être prévenu ; placée dans `.github/workflows`, hors de portée du jeton de l'admin. |
| D-10 | 21/11/2026 | Domaine `jema.software` (et non `jema.app`) ; `siteUrl` devient la seule source de l'adresse (la variable `SITE_URL` est ignorée) | Domaine réellement enregistré ; éviter qu'un réglage Cloudflare oublié produise des liens canoniques vers un autre domaine. |
| D-11 | 21/11/2026 | Rester sur Astro 5 au lancement, migration Astro 7 planifiée | `npm audit` signale des failles corrigées seulement en Astro 7 (2 versions majeures) ; elles visent le serveur de développement et des fonctions serveur (server islands) inutilisées par un site statique. Risque accepté jusqu'à la migration, à faire sur `bulle`. |
| D-12 | 21/11/2026 | Bot Fight Mode désactivé ; limitation de débit sur `/telecharger/*` | Bot Fight Mode bloquerait la sentinelle et peut déposer un cookie ; Cloudflare absorbe déjà les attaques par saturation. |
| D-13 | 21/11/2026 | Respect de « Ne pas suivre » / GPC aussi côté serveur ; `security.txt` | Conformité RGPD de bout en bout ; norme de signalement des failles. |
| D-14 | 24/11/2026 | Migration Astro 7, React 19, Tailwind 4 (clôt D-11) ; `compressHTML: true` ; retrait de `BASE_PATH` et du plugin `rehype-base` ; Node 24 épinglé | `npm audit` : 0 faille. Astro 7 supprime par défaut l'espace entre une ligne de texte et la balise suivante (« corrections.Vous ») : `true` garde le rendu d'Astro 5. Le nouveau moteur Markdown (Sätteri) n'accepte plus les plugins rehype ; ce plugin ne servait qu'à l'hébergement en sous-dossier (GitHub Pages, abandonné en D-03). Vérifié : texte des 37 pages identique, captures identiques au pixel près (hors mascotte animée), aucune violation CSP. |
| D-15 | 24/11/2026 | Contenu aligné sur l'app 4.1 : captures réelles (`jema-editor_v2/.docs/captures-site`) dans la visite et en tête des fiches du guide ; Nouveautés 4.1.0 en **brouillon** | Les anciennes captures montraient Phi-3.5. Une fiche = une capture (spécification U13 de l'app). La fiche 4.1.0 ne s'affiche qu'une fois la version publiée sur `jema-releases` (passer `brouillon` à faux dans l'admin). Captures écartées : faits établis et incohérences du chat, prises avant la correction de leur affichage (« 01_Chapitre 1.json »). |
| D-16 | 24/11/2026 | Contact : on garde le simple e-mail (le formulaire ouvre la messagerie du visiteur vers `editor.jema@gmail.com`). Formulaire envoyé par un service (Brevo) essayé puis retiré | Choix de l'éditeur : pas de compte de plus pour l'instant, et pas encore d'adresse `@jema.software`. Aucune donnée collectée par le site. À reconsidérer avec « Me prévenir ». |
| D-17 | 24/11/2026 | macOS : deux liens, `/telecharger/mac` (puce Apple, `-arm64.dmg`) et `/telecharger/mac-intel` (`-x64.dmg`) ; repli sur un `.dmg` universel pour les versions antérieures à 4.1.2 | L'app publie un .dmg par processeur depuis la 4.1.2 ; la fonction prenait le premier .dmg trouvé, et un Mac Intel aurait pu recevoir la version pour puce Apple. Le navigateur ne révèle pas le processeur : l'accueil propose la puce Apple et renvoie les Mac Intel vers la section Télécharger. |
| D-18 | 24/11/2026 | Référencement : titre « Jema, logiciel d'écriture avec IA… », données structurées schema.org sur l'accueil (WebSite, SoftwareApplication, éditeur), image d'aperçu `public/og.png` (1200×630) et icône `public/icon-512.png` ; numéro de version mémorisé 10 min au plus dans l'onglet | Être trouvé sur « jema », « jema software », « logiciel d'écriture jema ». Aucune note ni avis inventés (interdit par Google et trompeur). `og.png` est à refaire quand l'interface change. Déclaration du domaine dans Google Search Console et Bing Webmaster Tools : à faire par l'éditeur. |

## 7. Évolutions prévues

- Vrai formulaire de contact et « Me prévenir » (fonction Cloudflare ou service européen) : mettra à jour le registre RGPD.
- Connexion à l'admin par bouton GitHub (relais `sveltia-cms-auth`).
- Signature numérique des exécutables Windows et macOS (garantie d'origine pour les utilisateurs).
