import './globals.css';
import Link from 'next/link';
import {AFA_LOGO} from '@/lib/demo';

export const metadata={
  title:'ACTIVA’T · Secretaria Virtual · AFA Escola Sant Salvador',
  description:"Activitats, places i gestions de l'AFA, en un sol lloc.",
  icons:{icon:'https://i.postimg.cc/02cV2JFP/www-afaescolasantsalvador-org.png',apple:'https://i.postimg.cc/02cV2JFP/www-afaescolasantsalvador-org.png'}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <>
    <header className="top">
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="brandLogo"><img src={AFA_LOGO} alt="AFA Escola Sant Salvador" /></span>
          <span className="brandText"><strong>ACTIVA’T</strong><small>Secretaria Virtual · AFA Escola Sant Salvador</small></span>
        </Link>
        <input className="navToggle" type="checkbox" id="nav-toggle" />
        <label className="navMenuButton" htmlFor="nav-toggle" aria-label="Obrir el menú"><span></span><span></span><span></span></label>
        <div className="navlinks">
          <Link href="/activitats">Activitats</Link>
          <Link href="/consulta">Consultar gestió</Link>
          <Link className="navCta" href="/gestio">Secretaria <span>↗</span></Link>
        </div>
      </nav>
    </header>
    {children}
    <footer className="footer">
      <div><strong>ACTIVA’T</strong><span> · Secretaria Virtual de l’AFA Escola Sant Salvador</span></div>
      <div><Link href="/legal">Normes · Pagaments · Termes · Privacitat</Link></div>
    </footer>
  </>
}
