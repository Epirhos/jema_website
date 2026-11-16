import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Showcase from './components/Showcase.jsx'
import Features from './components/Features.jsx'
import Download from './components/Download.jsx'
import Pricing from './components/Pricing.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Legal, { LEGAL_PAGES } from './components/Legal.jsx'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const isLegal = Boolean(LEGAL_PAGES[hash])

  // En revenant d'une page légale vers une ancre (#features…), la section
  // n'existe qu'après le rendu : on y défile une fois la page d'accueil montée.
  useEffect(() => {
    if (isLegal) {
      window.scrollTo(0, 0)
      return
    }
    if (hash && hash !== '#top') document.querySelector(hash)?.scrollIntoView()
    else if (hash === '#top') window.scrollTo(0, 0)
  }, [hash, isLegal])

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <Navbar />
      <main>
        {isLegal ? (
          <Legal hash={hash} />
        ) : (
          <>
            <Hero />
            <Showcase />
            <Features />
            <Download />
            {/* Section licence — masquée tant que la logique de monétisation n'est
                pas arrêtée. Les composants existent et se branchent en un flag. */}
            <Pricing enabled={false} />
            <Contact />
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
