import './globals.css';
import Link from 'next/link';

export const metadata={
  title:'ACTIVA’T · Secretaria Virtual · AFA Escola Sant Salvador',
  description:"Activitats, places i gestions de l'AFA, en un sol lloc."
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <>
    <header className="top">
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="brandLogo"><span>A</span><span>F</span><span>A</span></span>
          <span className="brandText"><strong>ACTIVA’T</strong><small>Secretaria Virtual · AFA Escola Sant Salvador</small></span>
        </Link>
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
      <div>Informació · Documents · Privacitat</div>
    </footer>
  </>
}
