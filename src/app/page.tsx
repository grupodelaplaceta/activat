import Link from 'next/link';
import {demoActivities, AFA_LOGO} from '@/lib/demo';

const BANNER_VIDEO='https://www.youtube.com/embed/_6yDqoU7yWk?autoplay=1&mute=1&controls=0&loop=1&playlist=_6yDqoU7yWk&playsinline=1&modestbranding=1&rel=0';

export default function Home(){
  return <main className="container homeCommercial">
    <section className="brandBanner homeVideoBanner">
      <iframe src={BANNER_VIDEO} title="Vídeo de l'AFA Escola Sant Salvador" allow="autoplay; encrypted-media" aria-hidden="true" />
      <div className="brandBannerContent"><span className="eyebrow">AFA Escola Sant Salvador</span><h1>Una escola activa també fora de l’aula.</h1><p>Activitats pensades per compartir, descobrir i créixer plegats.</p><Link className="btn primary" href="/activitats">Explorar activitats →</Link></div>
    </section>
    <section className="commercialHero">
      <div className="commercialHeroCopy">
        <div className="afaLockup"><img src={AFA_LOGO} alt="AFA Escola Sant Salvador" /><div><span>AFA Escola Sant Salvador</span><small>Activitats extraescolars · Curs 2026–2027</small></div></div>
        <span className="eyebrow">ACTIVA’T · Secretaria Virtual</span>
        <h1>Activitats per créixer, aprendre i gaudir.</h1>
        <p>Descobreix les activitats de l’AFA, consulta les places disponibles i fes la preinscripció de manera fàcil i segura.</p>
        <div className="row"><Link className="btn primary bigBtn" href="/activitats">Veure activitats disponibles →</Link><Link className="btn secondary bigBtn" href="/consulta">Consultar una gestió</Link></div>
        <div className="commercialTrust"><span>✓ Places actualitzades</span><span>✓ Informació clara</span><span>✓ Sense crear compte</span></div>
      </div>
      <div className="commercialHeroVisual">
        <div className="visualGlow" />
        <div className="visualCard mainVisual"><img src={demoActivities[0].image} alt="Activitat de Robòtica de l'AFA Escola Sant Salvador" /><div className="visualCaption"><b>Robòtica</b><span>Aprendre fent · 1r, 2n i 3r de Primària</span></div></div>
        <div className="floatingBadge"><b>{demoActivities.reduce((n,a)=>n+(a.capacity-a.occupied),0)}</b><span>places disponibles</span></div>
      </div>
    </section>

    <section className="section activitiesHome">
      <div className="sectionTitle row space"><div><span className="eyebrow">Oferta 2026–2027</span><h2>Tria la teva activitat</h2><p>Consulta la fitxa completa i preinscriu l’alumne/a.</p></div><Link href="/activitats" className="btn secondary">Veure totes →</Link></div>
      <div className="grid activityHomeGrid">{demoActivities.map(a=>{
        const free=a.capacity-a.occupied; const pct=Math.round(a.occupied/a.capacity*100);
        return <article className="card activityCard commercialActivity" key={a.id}>
          <div className="activityCover commercialCover" style={a.image?{backgroundImage:`url(${a.image})`}:undefined}>
            {!a.image && <div className="coverIllustration">◌</div>}
            <span className="coverStatus">{free} places lliures</span>
          </div>
          <div className="activityBody">
            <div className="organizer"><img src={a.organizerLogo} alt="" /><span>Organitzat per <b>{a.organizer}</b></span></div>
            <h2>{a.name}</h2><p className="muted">{a.description}</p>
            <div className="meta"><span>⌚ {a.schedule}</span><span>👥 {a.courses}</span></div>
            <div className="capacity"><div className="capacityHead"><span>{a.occupied}/{a.capacity} places ocupades</span><b>{free} disponibles</b></div><div className="bar"><i style={{width:`${pct}%`}}/></div></div>
            <div className="row space activityFooter"><div><strong>{a.price.toFixed(2).replace('.',',')} €</strong><small> / període</small></div><Link className="btn primary" href={`/activitats/${a.slug}`}>Veure activitat →</Link></div>
          </div>
        </article>
      })}</div>
    </section>

    <section className="commercialInfo">
      <div><span className="eyebrow">ACTIVA’T</span><h2>Tot preparat per fer la preinscripció.</h2><p>No cal crear cap compte. Tria una activitat, completa les dades i rebràs un codi per consultar la teva gestió.</p></div>
      <Link className="btn primary bigBtn" href="/activitats">Començar →</Link>
    </section>
  </main>
}
