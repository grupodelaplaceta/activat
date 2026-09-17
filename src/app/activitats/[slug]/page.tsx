import Link from 'next/link';
import {demoActivities} from '@/lib/demo';

const BANNER_VIDEO='https://www.youtube.com/embed/_6yDqoU7yWk?autoplay=1&mute=1&controls=0&loop=1&playlist=_6yDqoU7yWk&playsinline=1&modestbranding=1&rel=0&disablekb=1&enablejsapi=1';

export default async function Fitxa({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const a=demoActivities.find(x=>x.slug===slug)||demoActivities[0];
  const pct=Math.min(100,Math.round(a.occupied/a.capacity*100));
  const highDemand=pct>=80;
  const isRob=a.name.toLowerCase().includes('rob');
  const memberSave=Math.max(0,a.price-a.memberPrice);
  const hasSibling=Number(a.secondChildDiscount||0)>0;
  const hasThird=Number(a.thirdChildDiscount||0)>0;
  return <main className="container detailPage">
    <section className="brandBanner detailBanner">
      <iframe src={BANNER_VIDEO} title="Vídeo de l'AFA Escola Sant Salvador" allow="autoplay; encrypted-media" aria-hidden="true" />
      <div className="brandBannerContent detailBannerContent">
        <div className="detailBannerTop"><span className="bannerBadge">ACTIVA’T · Curs 2026–2027</span><span className="bannerBadge">AFA Escola Sant Salvador</span></div>
        <h1>{a.name}</h1>
        <p>{a.description}</p>
        <div className="detailBannerFacts"><span>⌚ {a.schedule}</span><span>👥 {a.courses}</span><span>{a.capacity} places totals</span>{highDemand&&<span className="demandFact">🔥 Alta demanda</span>}</div>
      </div>
    </section>

    <div className="detailLayout detailLayoutPro">
      <div>
        <section className="card detailMainCard">
          {a.image && <div className="detailPhoto"><img src={a.image} alt={`Activitat de ${a.name}`} /><span className="photoTag">{a.name}</span></div>}
          {!a.image && <div className="detailVisualEmpty"><span>ACTIVA’T</span><b>{a.name}</b></div>}

          <div className="detailIntro">
            <div><span className="eyebrow">Organització</span><h2>{a.organizer}</h2></div>
            <img className="detailOrganizerLogo" src={a.organizerLogo} alt={a.organizer}/>
          </div>

          <div className="section detailSection">
            <span className="eyebrow">Sobre l’activitat</span>
            <h2>{isRob?'Aprendre fent, crear i experimentar.':'Un servei pensat per començar el dia amb tranquil·litat.'}</h2>
            <p className="muted">{a.description} Consulta en aquesta fitxa l’horari, les places, les condicions econòmiques i el funcionament de la preinscripció.</p>
          </div>

          <div className="detailInfoGrid">
            <div className="infoTile"><span>HORARI</span><strong>{a.schedule}</strong></div>
            <div className="infoTile"><span>CURSOS</span><strong>{a.courses}</strong></div>
            <div className="infoTile"><span>PLACES</span><strong>{a.capacity} places totals</strong><small>{highDemand?'🔥 Alta demanda':'Places obertes'}</small></div>
            <div className="infoTile"><span>ORGANITZA</span><strong>{a.organizer}</strong></div>
          </div>

          {isRob && <div className="detailHighlight"><div className="highlightIcon">☕</div><div><b>Berenar inclòs en l’horari</b><p>De 16:00 a 16:45 es reserva l’espai per al berenar abans de continuar l’activitat.</p></div></div>}

          <div className="section detailSection">
            <span className="eyebrow">Condicions econòmiques</span>
            <h2>Tarifes del curs</h2>
            <div className="priceRows">
              <div><span>Quota general</span><strong>{a.price.toFixed(2).replace('.',',')} €</strong></div>
              <div><span>Quota socis AFA</span><strong>{a.memberPrice.toFixed(2).replace('.',',')} €</strong></div>
              {hasSibling && <div><span>Descompte segon germà</span><strong>−{a.secondChildDiscount.toFixed(2).replace('.',',')} €</strong></div>}
              {hasThird && <div><span>Descompte tercer germà</span><strong>−{a.thirdChildDiscount.toFixed(2).replace('.',',')} €</strong></div>}
              <div><span>Quota extraordinària primer mes</span><strong>{a.extraFirstMonth?`+${a.extraFirstMonth.toFixed(2).replace('.',',')} €`:'Cap'}</strong></div>
            </div>
            {memberSave>0 && <p className="help">Els descomptes de soci/a i germans s’apliquen segons la situació indicada a la preinscripció i poden ser revisats per Secretaria.</p>}
          </div>

          <div className="section detailSection">
            <span className="eyebrow">Pagaments</span>
            <h2>Quan s’ha de pagar?</h2>
            <p className="muted">El pagament es realitza una setmana abans de cada període. Per exemple, la quota d’octubre es paga l’últim dimarts de setembre. La primera quota correspon al mes següent al de l’emissió de la inscripció.</p>
            <div className="notice paymentNotice"><b>Pagament presencial</b><span>Cal fer el pagament immediatament a l’AFA els dimarts de 14:45 a 16:00 h.</span></div>
          </div>

          <div className="section detailSection">
            <span className="eyebrow">Places</span>
            <h2>Situació actual</h2>
            <div className="capacityHead"><span>{a.capacity} places totals</span><b>{highDemand?'🔥 Alta demanda':'Places obertes'}</b></div>
            <div className="bar detailBar"><i style={{width:`${pct}%`}}/></div>
            <p className="muted small">La disponibilitat pot canviar mentre es processen les preinscripcions i els pagaments.</p>
          </div>

          <div className="section detailSection">
            <span className="eyebrow">Abans de preinscriure’t</span>
            <h2>Documentació i normativa</h2>
            <div className="docGrid"><div className="docItem"><b>Informació de l’activitat</b><span>Horaris, places i condicions.</span></div><div className="docItem"><b>Normativa de l’AFA</b><span>Normes i autoritzacions del servei.</span></div><div className="docItem"><b>Protecció de dades</b><span>Informació bàsica i drets.</span></div></div>
          </div>
        </section>
      </div>

      <aside className="card sideCard detailSideCard">
        <span className="eyebrow">Preinscripció</span>
        <div className="sideAvailability"><strong>{a.capacity}</strong><span>places<br/>totals</span></div>{highDemand&&<div className="demandNotice">🔥 Alta demanda</div>}
        <div className="bar"><i style={{width:`${pct}%`}}/></div>
        <div className="sidePrice"><small>Des de</small><strong>{a.price.toFixed(2).replace('.',',')} €</strong><span>Quota general</span></div>
        <div className="sidePriceAlt"><b>{a.memberPrice.toFixed(2).replace('.',',')} €</b><span>per a socis AFA</span></div>
        <div className="sideFacts"><div><span>Horari</span><b>{a.schedule}</b></div><div><span>Cursos</span><b>{a.courses}</b></div></div>
        <Link className="btn primary" style={{width:'100%',marginTop:15}} href={`/preinscripcio?activitat=${encodeURIComponent(a.name)}`}>Preinscriure’m →</Link>
        <Link className="btn secondary" style={{width:'100%',marginTop:8}} href="/activitats">← Tornar a activitats</Link>
        <p className="muted small sideNoAccount">No cal crear cap compte.</p>
      </aside>
    </div>
  </main>
}
