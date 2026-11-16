import { ArrowLeft } from 'lucide-react'

/**
 * Pages légales du SITE (distinctes de celles de l'application, qui sont livrées
 * avec le logiciel). Affichées via une ancre (#mentions-legales, #confidentialite)
 * en attendant la migration vers un site multi-pages.
 */
const CONTACT_EMAIL = 'editor.jema@gmail.com'
const UPDATED = '16 novembre 2026'

function H2({ children }) {
  return (
    <h2 className="mt-8 font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h2>
  )
}

function Mentions() {
  return (
    <>
      <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Mentions légales
      </h1>
      <H2>Éditeur du site</H2>
      <p>
        Dahirou Nounsi, dit Epirhos, personne physique.
        <br />
        Contact : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        Conformément à l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l'économie numérique, l'éditeur, qui publie ce site à titre non professionnel, a communiqué ses
        coordonnées à l'hébergeur.
      </p>
      <H2>Directeur de la publication</H2>
      <p>Dahirou Nounsi (Epirhos).</p>
      <H2>Hébergement</H2>
      <p>
        Le site est hébergé par GitHub, Inc. (service GitHub Pages), 88 Colin P. Kelly Jr. Street, San
        Francisco, CA 94107, États-Unis. Les fichiers d'installation de Jema sont également hébergés par
        GitHub, Inc.
      </p>
      <H2>Propriété intellectuelle</H2>
      <p>
        Le logiciel Jema, son nom, son logo, sa mascotte et les contenus de ce site sont la propriété de
        Dahirou Nounsi (Epirhos). Toute reproduction non autorisée est interdite.
      </p>
      <p className="mt-3">
        Les textes écrits avec Jema appartiennent exclusivement à leurs auteurs. Jema ne revendique aucun droit
        sur les manuscrits, ne les lit pas et ne les utilise pas.
      </p>
      <H2>Données personnelles</H2>
      <p>
        Voir la <a className="underline" href="#confidentialite">politique de confidentialité du site</a>.
      </p>
    </>
  )
}

function Confidentialite() {
  return (
    <>
      <h1 className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Politique de confidentialité du site
      </h1>
      <p className="mt-4">
        Cette page concerne le site de présentation de Jema. L'application installée sur votre ordinateur a sa
        propre politique, livrée avec le logiciel : vos manuscrits ne quittent jamais votre machine.
      </p>
      <H2>En bref</H2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Ce site ne dépose aucun cookie publicitaire ou de mesure d'audience.</li>
        <li>Il ne vous demande aucun compte et ne collecte aucune donnée via un formulaire.</li>
        <li>Les polices de caractères sont hébergées sur le site lui-même : aucune requête vers Google.</li>
      </ul>
      <H2>Connexions techniques</H2>
      <p>
        Comme tout site web, l'hébergeur (GitHub, Inc., États-Unis) reçoit votre adresse IP et les informations
        techniques habituelles d'une requête, pour afficher les pages. Pour vous proposer la dernière version
        de Jema, votre navigateur interroge aussi l'API de GitHub. Ces données sont traitées par GitHub selon
        sa propre politique de confidentialité.
      </p>
      <H2>Stockage local</H2>
      <p>
        Le thème d'affichage que vous choisissez (Clair, Sombre, Éditorial) est mémorisé dans votre navigateur
        (stockage local). Il n'est jamais transmis et sert uniquement à votre confort ; vous pouvez l'effacer à
        tout moment depuis les réglages de votre navigateur.
      </p>
      <H2>Nous écrire</H2>
      <p>
        Si vous nous écrivez par courriel, nous utilisons votre adresse et votre message uniquement pour vous
        répondre et améliorer Jema.
      </p>
      <H2>Vos droits</H2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
        portabilité sur les données vous concernant. Pour les exercer :{' '}
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Vous pouvez aussi adresser
        une réclamation à la CNIL (www.cnil.fr).
      </p>
    </>
  )
}

export const LEGAL_PAGES = {
  '#mentions-legales': Mentions,
  '#confidentialite': Confidentialite
}

export default function Legal({ hash }) {
  const Page = LEGAL_PAGES[hash]
  if (!Page) return null
  return (
    <section className="px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
      <article
        className="glass mx-auto max-w-3xl rounded-3xl p-7 text-sm leading-relaxed sm:p-10 sm:text-base"
        style={{ color: 'var(--text-secondary)' }}
      >
        <a href="#top" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent-color)' }}>
          <ArrowLeft size={15} /> Retour à l'accueil
        </a>
        <Page />
        <p className="mt-10 text-xs" style={{ color: 'var(--text-muted)' }}>
          Dernière mise à jour : {UPDATED}
        </p>
      </article>
    </section>
  )
}
