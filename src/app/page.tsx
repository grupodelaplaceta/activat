import Link from 'next/link';
import {demoActivities} from '@/lib/demo';

export default function Home(){return <main className="container">
  <section className="brandBanner">
    <iframe src="https://www.youtube.com/embed/_6yDqoU7yWk?autoplay=1&mute=1&controls=0&loop=1&playlist=_6yDqoU7yWk&playsinline=1&modestbranding=1&rel=0&disablekb=1&enablejsapi=1" title="AFA Escola Sant Salvador" allow="autoplay; encrypted-media; picture-in-picture" />
    <div className="brandBannerContent">
      <span className="bannerBadge">AFA Escola Sant Salvador · Curs 2026–2027</span>
      <h1>Tot el que necessites per gestionar les activitats de l’AFA.</h1>
      <p>Preinscripcions, places, matrícules i seguiment de gestions, en una secretaria virtual clara i senzilla.</p>
      <div className="row"><Link className="btn primary" href="/activitats">Veure activitats →</Link><Link className="btn secondary" href="/consulta">Consultar una gestió</Link></div>
    </div>
  </section>

  <section className="section">
    <div className="sectionTitle"><span className="eyebrow">Com funciona</span><h2>Una secretaria pensada per a les famílies</h2><p>No cal crear un compte. Cada gestió té el seu propi codi de seguiment.</p></div>
    <div className="grid">
      <article className="card feature"><div className="featureIcon">01</div><h3>Tria l’activitat</h3><p className="muted">Consulta horaris, cursos, preus, places i documentació abans de començar.</p></article>
      <article className="card feature"><div className="featureIcon">02</div><h3>Fes la preinscripció</h3><p className="muted">Omple les dades de l’alumne/a i del representant legal en un únic tràmit.</p></article>
      <article className="card feature"><div className="featureIcon">03</div><h3>Segueix el tràmit</h3><p className="muted">Guarda el codi i consulta posteriorment l’estat de la plaça i la gestió.</p></article>
    </div>
  </section>

  <section className="section">
    <div className="sectionTitle row space"><div><span className="eyebrow">Oferta actual</span><h2>Activitats i serveis</h2></div><Link href="/activitats" className="btn secondary">Veure totes →</Link></div>
    <div className="grid">{demoActivities.map(a=><article className="card activityCard" key={a.id}><div className="activityCover"><span className="coverMark">{a.name.includes('Rob')?'✦':'◌'}</span></div><div className="activityBody"><span className="pill purple">{a.active?'Preinscripció oberta':'Informació'}</span><h2>{a.name}</h2><p className="muted">{a.description}</p><div className="meta"><span>⌚ {a.schedule}</span><span>👥 {a.courses}</span></div><div className="capacity"><div className="capacityHead"><span>Ocupació</span><b>{a.capacity-a.occupied} places lliures</b></div><div className="bar"><i style={{width:`${Math.round(a.occupied/a.capacity*100)}%`}}/></div></div><div className="row space"><strong>{a.price.toFixed(2).replace('.',',')} €</strong><Link className="btn primary" href={`/activitats/${a.slug}`}>Veure activitat</Link></div></div></article>)}</div>
  </section>
</main>}
