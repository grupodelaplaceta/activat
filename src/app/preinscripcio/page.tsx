'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {jsPDF} from 'jspdf';
import ReactMarkdown from 'react-markdown';

type F=Record<string,any>;
type LegalDocument={id:string,title:string,text:string};
const legalFallback:LegalDocument[]=[
 {id:'normes',title:'Normes de funcionament',text:'# Normes de funcionament\n\nLa participació en les activitats implica respectar els horaris, les indicacions de l’equip responsable, les normes de convivència i les instruccions de l’AFA i del centre. La família comunicarà qualsevol incidència, absència, al·lèrgia o necessitat rellevant. La plaça queda condicionada a la disponibilitat i a la correcta formalització de la inscripció.'},
 {id:'pagaments',title:'Política de pagaments',text:'# Política de pagaments\n\nLes quotes es gestionen mensualment. Cada quota té el seu import, data límit, estat i rebut individual. El pagament s’ha de fer pel mitjà comunicat per l’AFA dins del termini indicat. Les baixes, devolucions i incidències de pagament es tramitaran amb Secretaria segons les condicions de l’activitat.'},
 {id:'termes',title:'Termes i condicions',text:'# Termes i condicions\n\nL’ús d’ACTIVA’T i la sol·licitud d’una activitat requereixen facilitar dades certes i acceptar les condicions de participació. L’AFA pot gestionar grups, places, comunicacions, pagaments i incidències relacionades amb el servei. La plaça no queda confirmada fins que Secretaria en valida l’adjudicació.'},
 {id:'privacitat',title:'Política de privacitat',text:'# Política de privacitat\n\nL’AFA Escola Sant Salvador tracta les dades per gestionar preinscripcions, matrícules, places, quotes, comunicacions i incidències. La persona interessada pot exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a contacte@afaescolasantsalvador.org. L’autorització d’imatge és específica i voluntària.'}
];
const AFA_LOGO='https://i.postimg.cc/02cV2JFP/www-afaescolasantsalvador-org.png';
const ROBOTICA_PHOTO='https://i.postimg.cc/9RdLMHz3/Captura-de-pantalla-2026-07-23-154054.png';
const ACTIVITIES:any={
  'Robòtica':{schedule:'Dimecres · 16:00–17:30 (berenar 16:00–16:45)', nonMember:20, member:15, second:0, third:0, extra:5, extraLabel:'Quota extraordinària al primer mes / preinscripció · Llibre'},
  'Acollida Matinal':{schedule:'Tots els dies · 08:00–09:15', nonMember:30, member:30, second:5, third:8.5, extra:0, extraLabel:''}
};
function activityConfig(name:string){return ACTIVITIES[name]||ACTIVITIES['Robòtica']}

function money(n:number){return `${Number(n||0).toFixed(2).replace('.',',')} €`}
function wrapText(doc:jsPDF,text:string,x:number,y:number,max:number,line=5){const lines=doc.splitTextToSize(String(text||'—'),max);doc.text(lines,x,y);return y+lines.length*line}

export default function Preinscripcio(){
 const [sent,setSent]=useState<any>(null);const [submitError,setSubmitError]=useState('');const [submitting,setSubmitting]=useState(false);
 const [familyChildren,setFamilyChildren]=useState<string[]>([]);
 const [legalDocs,setLegalDocs]=useState<LegalDocument[]>(legalFallback);const [legalOpen,setLegalOpen]=useState(false);const [legalAccepted,setLegalAccepted]=useState<Record<string,boolean>>({});
 const signatureCanvas=useRef<HTMLCanvasElement>(null);const drawing=useRef(false);
 const [f,setF]=useState<F>({activitat:'Robòtica',curs:'',grup:'',alumne:'',naixement:'',alergies:'',nese:'no',neseDetall:'',autoritzats:'',emergencia:'',tutor:'',dni:'',telefon:'',email:'',adreca:'',municipi:'Tarragona',cp:'',quota:'20',complements:'5',diners:'0',mitja:'Efectiu',isMember:false,childrenCount:'1',childOrder:'1',memberDiscount:'5',secondDiscount:'0',thirdDiscount:'0',imatge:'no'});
 useEffect(()=>{fetch('/api/public/legal').then(response=>response.ok?response.json():null).then(json=>{const documents=(json?.documents||[]).filter((document:LegalDocument)=>document.text&&document.text.length>40);if(documents.length===4)setLegalDocs(documents)}).catch(()=>undefined)},[]);
 useEffect(()=>{
  const dni=String(f.dni||'').replace(/[^a-z0-9]/gi,'');
  if(dni.length<5){setFamilyChildren([]);return}
  const controller=new AbortController();
  fetch(`/api/public/registrations?dni=${encodeURIComponent(f.dni)}&activity=${encodeURIComponent(f.activitat)}`,{signal:controller.signal}).then(response=>response.ok?response.json():null).then(json=>{
    if(!json)return;
    const students=Array.isArray(json.students)?json.students:[];
    setFamilyChildren(students);
    if(students.length)setF((current:any)=>({...current,childrenCount:String(Math.max(Number(current.childrenCount||1),json.nextChildOrder||1)),childOrder:String(json.nextChildOrder||1)}));
  }).catch(()=>undefined);
  return ()=>controller.abort();
 },[f.dni,f.activitat]);
 useEffect(()=>{const canvas=signatureCanvas.current;if(!canvas)return;const ratio=window.devicePixelRatio||1;canvas.width=canvas.clientWidth*ratio;canvas.height=canvas.clientHeight*ratio;const context=canvas.getContext('2d');if(context){context.scale(ratio,ratio);context.strokeStyle='#17131f';context.lineWidth=2;context.lineCap='round';}},[]);
 function signaturePoint(event:React.PointerEvent<HTMLCanvasElement>){const canvas=signatureCanvas.current;if(!canvas)return null;const rect=canvas.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top}}
 function startSignature(event:React.PointerEvent<HTMLCanvasElement>){const point=signaturePoint(event);if(!point)return;drawing.current=true;event.currentTarget.setPointerCapture(event.pointerId);const context=event.currentTarget.getContext('2d');context?.beginPath();context?.moveTo(point.x,point.y)}
 function drawSignature(event:React.PointerEvent<HTMLCanvasElement>){if(!drawing.current)return;const point=signaturePoint(event);if(!point)return;const context=event.currentTarget.getContext('2d');context?.lineTo(point.x,point.y);context?.stroke()}
 function finishSignature(){if(!drawing.current)return;drawing.current=false;const canvas=signatureCanvas.current;if(canvas)setF(current=>({...current,signatureData:canvas.toDataURL('image/png')}))}
 function clearSignature(){const canvas=signatureCanvas.current;const context=canvas?.getContext('2d');if(canvas&&context){context.clearRect(0,0,canvas.width,canvas.height);setF(current=>({...current,signatureData:''}))}}
 const set=(k:string)=>(e:any)=>setF((x)=>({...x,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
 const cfg=activityConfig(f.activitat);
 const effectiveQuota=useMemo(()=>Number(cfg.nonMember),[f.activitat]);
 const memberDiscount=useMemo(()=>f.isMember?Math.max(0,Number(cfg.nonMember)-Number(cfg.member)):0,[f.isMember,f.activitat]);
 const discount=useMemo(()=>memberDiscount+(Number(f.childOrder)===2?Number(cfg.second||0):0)+(Number(f.childOrder)>=3?Number(cfg.third||0):0),[memberDiscount,f.childOrder,f.activitat]);
 const total=useMemo(()=>Math.max(0,effectiveQuota-discount)+Number(f.complements||0),[effectiveQuota,discount,f.complements]);
 const handleActivity=(name:string)=>{const c=activityConfig(name);setF((x:any)=>({...x,activitat:name,quota:String(x.isMember?c.member:c.nonMember),complements:String(c.extra||0),memberDiscount:String(Math.max(0,c.nonMember-c.member)),secondDiscount:String(c.second||0),thirdDiscount:String(c.third||0),childOrder:'1'}))};
 const handleMember=(isMember:boolean)=>{const c=activityConfig(f.activitat);setF((x:any)=>({...x,isMember,quota:String(c.nonMember),memberDiscount:String(Math.max(0,c.nonMember-c.member))}))};
 const discountLabel=useMemo(()=>{const p=[];if(f.isMember&&Number(f.memberDiscount)>0)p.push('Soci/a');if(Number(f.childOrder)===2&&Number(f.secondDiscount)>0)p.push('2n fill/a');if(Number(f.childOrder)>=3&&Number(f.thirdDiscount)>0)p.push('3r fill/a');return p.length?p.join(' · '):'Sense descompte'},[f]);
 async function submit(e:any){e.preventDefault();setSubmitError('');const requiredLegal=legalDocs.length?legalDocs.every(document=>legalAccepted[document.id]):Boolean(f.normativa);if(!requiredLegal){setLegalOpen(true);setSubmitError('Cal llegir i acceptar els quatre textos legals per continuar.');return}setSubmitting(true);const payload={...f,quota:effectiveQuota,descompte:discount,total,discountLabel,authorized_people:f.autoritzats?f.autoritzats.split('\n').filter(Boolean).map((name:string)=>({name})):[],emergency_contacts:f.emergencia?f.emergencia.split('\n').filter(Boolean).map((name:string)=>({name})):[],rules_accepted:true,legal_acceptances:legalAccepted,outing_accepted:Boolean(f.emergenciaOk),data_info_accepted:true,emergency_accepted:Boolean(f.emergenciaOk),signature_data:f.firmaVirtual||''};const r=await fetch('/api/public/registrations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();setSubmitting(false);if(!r.ok){setSubmitError(j.error||'No s’ha pogut enviar el tràmit.');return}setSent({...j,total,discount,discountLabel});}
 async function logoData(){try{const r=await fetch(AFA_LOGO);const b=await r.blob();return await new Promise<string>(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result));fr.readAsDataURL(b)})}catch{return ''}}
 async function pdf(){
  if(!sent)return;
  const d=new jsPDF({unit:'mm',format:'a4'});
  const W=210; const M=16; const purple='#5B21B6'; const light='#F3EDFF'; const ink='#17131F'; const muted='#6F6879'; const line='#E7E1EE';

  function header(){
    d.setFillColor(255,255,255); d.rect(0,0,W,25,'F');
    if(logo){try{d.addImage(logo,'PNG',M,5,22,15)}catch{}}
    d.setTextColor(ink); d.setFont('helvetica','bold'); d.setFontSize(14); d.text('AFA Escola Sant Salvador',M+27,11);
    d.setFont('helvetica','normal'); d.setFontSize(7.5); d.setTextColor(muted); d.text('ACTIVA’T · Secretaria Virtual · Curs 2026–2027',M+27,16);
    d.setDrawColor(line); d.line(M,23,W-M,23);
  }
  function footer(){
    const pages=d.getNumberOfPages();
    for(let page=1;page<=pages;page++){
      d.setPage(page); d.setDrawColor(line); d.line(M,287,W-M,287); d.setTextColor(muted); d.setFontSize(7);
      d.text(`ACTIVA’T · Full de preinscripció · ${sent.code}`,M,292); d.text(`Pàgina ${page}/${pages}`,W-M,292,{align:'right'});
    }
  }
  function section(n:string,title:string,y:number){
    d.setFillColor(purple); d.roundedRect(M,y,8,8,2,2,'F');
    d.setTextColor(255,255,255); d.setFont('helvetica','bold'); d.setFontSize(9); d.text(n,M+4,y+5.5,{align:'center'});
    d.setTextColor(ink); d.setFontSize(12); d.text(title,M+13,y+5.7); d.setDrawColor(line); d.line(M,y+11,W-M,y+11);
    return y+17;
  }
  function field(label:string,value:string,x:number,y:number,w:number,h=13){
    d.setFillColor(249,248,251); d.roundedRect(x,y,w,h,2.5,2.5,'F');
    d.setTextColor(muted); d.setFont('helvetica','bold'); d.setFontSize(7.5); d.text(label.toUpperCase(),x+4,y+4.3);
    d.setTextColor(ink); d.setFont('helvetica','normal'); d.setFontSize(8.5);
    const lines=d.splitTextToSize(String(value||'—').slice(0,180),w-8);
    d.text(lines.slice(0,2),x+4,y+9);
  }

  const logo=await logoData();
  const activityImage=f.activitat==='Robòtica'?ROBOTICA_PHOTO:'/img/acollida.webp';
  const activityPhoto=await (async()=>{try{const response=await fetch(activityImage); const blob=await response.blob(); return await new Promise<string>((resolve)=>{const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.readAsDataURL(blob); });}catch{return ''}})();

  header();
  let y=34;
  d.setTextColor(purple); d.setFont('helvetica','bold'); d.setFontSize(8); d.text('ACTIVA’T · SECRETARIA VIRTUAL',M,y); y+=7;
  d.setTextColor(ink); d.setFontSize(20); d.text('FULL DE PREINSCRIPCIÓ D’ACTIVITAT',M,y); y+=8;
  d.setTextColor(muted); d.setFont('helvetica','normal'); d.setFontSize(9); d.text('AFA Escola Sant Salvador · Curs 2026–2027',M,y);
  d.setFillColor(light); d.roundedRect(136,32,58,22,4,4,'F'); d.setTextColor(muted); d.setFontSize(7); d.text('CODI',140,39); d.text('PREINSCRIPCIÓ',140,43); d.setTextColor(purple); d.setFont('helvetica','bold'); d.setFontSize(10); d.text(sent.code,140,50);

  if(activityPhoto){
    try{const img=d.getImageProperties(activityPhoto); const scale=Math.min(42/img.width,24/img.height); const w=img.width*scale; const h=img.height*scale; d.addImage(activityPhoto,'PNG',M+(42-w)/2,55+(24-h)/2,w,h);}catch{}
  }
  d.setTextColor(ink); d.setFont('helvetica','bold'); d.setFontSize(10); d.text(f.activitat,M+47,62); d.setFont('helvetica','normal'); d.setFontSize(8); d.setTextColor(muted); d.text('Organitza: AFA Escola Sant Salvador',M+47,67); d.text(cfg.schedule,M+47,71); d.text(`Quota: ${money(cfg.nonMember)} · Soci/a AFA: ${money(cfg.member)}`,M+47,75);

  y=84; y=section('1','DADES DE L’ACTIVITAT I DE L’ALUMNE/A',y); field('Activitat',f.activitat,M,y,86); field('Curs / grup',`${f.curs} · ${f.grup}`,108,y,86); y+=16; field('Nom i cognoms',f.alumne,M,y,86); field('Data de naixement',f.naixement,108,y,86); y+=16; field('Al·lèrgies',f.alergies||'—',M,y,86); field('NESE',f.nese==='si'?'Sí':'No',108,y,86); y+=16; field('Obs. NESE',f.neseDetall||'—',M,y,178); y+=18;
  y=section('2','DADES DEL REPRESENTANT LEGAL',y); field('Nom i cognoms',f.tutor,M,y,86); field('DNI',f.dni,108,y,86); y+=16; field('Telèfon',f.telefon,M,y,86); field('Correu',f.email,108,y,86); y+=16; field('Adreça',`${f.adreca || '—'}, ${f.cp || ''} ${f.municipi || ''}`.replace(/\s+,/g,','),M,y,178); y+=18;
  y=section('3','PERSONES AUTORITZADES I EMERGÈNCIES',y); field('Recollida',f.autoritzats||'No indicades',M,y,86,18); field('Emergència',f.emergencia||'No indicats',108,y,86,18); y+=26;
  y=section('4','CONDICIONS ECONÒMIQUES',y); field('Quota base',money(effectiveQuota),M,y,58); field('Descompte',`${money(discount)} · ${discountLabel}`,77,y,71); field(cfg.extra?'Primer mes · llibre':'Primer mes',cfg.extra?`+${money(f.complements)}`:'Sense suplement',151,y,39); y+=16; field('Pagament',f.mitja||'A confirmar',M,y,85); field('Calendari','Primera quota: octubre 2026',108,y,82); y+=17; d.setFillColor(light); d.roundedRect(M,y,178,16,3,3,'F'); d.setTextColor(purple); d.setFont('helvetica','bold'); d.setFontSize(8); d.text('IMPORT PRIMERA QUOTA',M+5,y+6); d.setFontSize(14); d.text(money(total),W-M-5,y+11,{align:'right'}); y+=22;

  y=section('5','DECLARACIONS I AUTORITZACIONS',y); d.setTextColor(ink); d.setFont('helvetica','normal'); d.setFontSize(8.1);
  const declarations=[
    'La persona signant declara que les dades facilitades són certes i que té capacitat per autoritzar la participació de l’alumne/a.',
    'Accepta les normes de funcionament de l’activitat, els horaris i les instruccions de l’organització.',
    'La informació d’imatge és separada i voluntària; no autoritzar-la no impedeix la participació.',
    'En cas d’incidència o urgència, l’AFA podrà contactar amb les persones indicades i adoptar les mesures raonables de protecció.'
  ];
  for(const text of declarations){
    const lines=d.splitTextToSize('• '+text,178);
    if(y+lines.length*4>280){ d.addPage(); header(); y=34; }
    d.text(lines,M,y); y += lines.length*4 + 2;
  }

  if(y>245){ d.addPage(); header(); y=34; }
  y=section('6','PROTECCIÓ DE DADES',y); d.setFontSize(7.5); const privacy='Responsable: AFA Escola Sant Salvador. Domicili: Av. de Sant Salvador, 13, 43130 Tarragona. Contacte: contacte@afaescolasantsalvador.org. Finalitats: gestionar la preinscripció, els grups, les comunicacions i les incidències relacionades amb l’activitat. Base jurídica: la gestió de la relació derivada de la sol·licitud i, quan correspongui, el consentiment. Drets: accés, rectificació, supressió, oposició, limitació i portabilitat, així com retirar el consentiment, mitjançant contacte@afaescolasantsalvador.org.';
  const privacyLines=d.splitTextToSize(privacy,178); d.text(privacyLines,M,y); y += privacyLines.length*3.7 + 8;

  if(y>248){ d.addPage(); header(); y=34; }
  y=section('7','AUTORITZACIÓ D’IMATGE',y); const imageText=`Jo, ${f.tutor}, com a mare/pare o representant legal de l’alumne/a ${f.alumne}, ${f.imatge==='si'?'AUTORITZO':'NO AUTORITZO'} la captació, reproducció i publicació d’imatges o vídeos de l’alumne/a per a les finalitats de difusió i comunicació de les activitats de l’AFA.`; const imageLines=d.splitTextToSize(imageText,178); d.text(imageLines,M,y); y += imageLines.length*4 + 8;

  if(y>248){ d.addPage(); header(); y=34; }
  y=section('8','SIGNATURES',y); field('Representant legal',f.tutor || '—',M,y,82,18); field('Lloc i data',`Tarragona, ${new Date().toLocaleDateString('ca-ES')}`,106,y,80,18); y += 22;
  if(f.signatureData){try{d.addImage(f.signatureData,'PNG',M,y,56,18)}catch{}}
  d.setTextColor(muted); d.setFont('helvetica','normal'); d.setFontSize(7); d.text('La firma virtual es conserva amb l’expedient. Aquest document també es pot imprimir.',M,y+22);

  footer();
  d.save(`${sent.code}-preinscripcio.pdf`);
 }
 if(sent)return <main className="container"><section className="hero"><span className="pill ok">✓ Tràmit registrat</span><h1>Preinscripció enviada</h1><p>La gestió ha quedat registrada. Guarda el codi <b>{sent.code}</b>; no cal iniciar sessió.</p></section><section className="card confirmationCard" style={{maxWidth:850}}><div className="row space"><div><span className="eyebrow">Codi de preinscripció</span><div className="codeBox">{sent.code}</div></div><span className="pill wait">En revisió</span></div><div className="detailGrid" style={{marginTop:22}}><div className="detailItem"><small>Alumne/a</small><b>{f.alumne}</b></div><div className="detailItem"><small>Activitat</small><b>{f.activitat}</b></div><div className="detailItem"><small>Condició</small><b>{f.isMember?'Soci/a':'No soci/a'} · {f.childOrder}r fill/a</b></div><div className="detailItem"><small>Import estimat</small><b>{money(sent.total)}</b></div></div><div className="section confirmationDocuments"><h3>Document</h3><p className="muted small">Descarrega el full oficial de preinscripció amb totes les dades, textos legals i la firma.</p><button className="btn primary" onClick={()=>pdf()}>↓ Descarregar PDF</button></div></section></main>;
 return <main className="container"><section className="hero"><span className="eyebrow">Nou tràmit · Curs 2026–2027</span><h1>Preinscripció en pocs passos</h1><p>Completa les dades de l’alumne/a i del representant. Secretaria podrà corregir qualsevol dada després.</p></section><section className="heroPanel formIntro"><div><b>Abans de començar</b><p>Necessitaràs les dades de contacte, les persones autoritzades i l’acceptació dels textos legals.</p></div><div className="formSteps"><span className="active">1 <small>Dades</small></span><i></i><span>2 <small>Contactes</small></span><i></i><span>3 <small>Confirmació</small></span></div></section><form className="card form formCard" onSubmit={submit} style={{marginTop:20}}>
   <div className="full"><span className="eyebrow">1 · Activitat i alumne/a</span></div>
   <div className="field"><label>Activitat</label><select value={f.activitat} onChange={e=>handleActivity(e.target.value)}><option>Robòtica</option><option>Acollida Matinal</option></select></div>
   <div className="field"><label>Curs / grup</label><input value={f.curs} onChange={set('curs')}/></div>
   <div className="field"><label>Nom i cognoms de l’alumne/a</label><input value={f.alumne} onChange={set('alumne')} required/></div>
   <div className="field"><label>Data de naixement</label><input type="date" value={f.naixement} onChange={set('naixement')}/></div>
   <div className="field"><label>Al·lèrgies / informació rellevant</label><input value={f.alergies} onChange={set('alergies')}/></div>
   <div className="field"><label>Condició NESE</label><select value={f.nese} onChange={set('nese')}><option value="no">No</option><option value="si">Sí</option></select></div>
   <div className="field full"><label>Observacions NESE</label><textarea value={f.neseDetall} onChange={set('neseDetall')} rows={2}/></div>
   <div className="full sectionBreak"><span className="eyebrow">2 · Representant legal</span></div>
  {([['tutor','Nom i cognoms'],['dni','DNI/NIE/passaport'],['telefon','Telèfon'],['email','Correu electrònic'],['adreca','Adreça'],['municipi','Municipi'],['cp','Codi postal']] as any[]).map(([k,l])=><div className="field" key={k}><label>{l}</label><input type={k==='email'?'email':'text'} value={f[k]} onChange={set(k)} required={['tutor','email'].includes(k)}/>{k==='dni'&&familyChildren.length>0&&<small className="notice" style={{display:'block',marginTop:6}}>Hem detectat {familyChildren.length} fill/s en aquesta activitat: {familyChildren.join(', ')}. Aquest serà el fill/a número {Number(f.childOrder)} i s’aplicarà el descompte corresponent.</small>}</div>)}
   <div className="full sectionBreak"><span className="eyebrow">3 · Soci/a i descomptes</span><p className="muted small">Aquestes dades es poden corregir posteriorment des de Secretaria si la família s’ha equivocat.</p></div>
   <div className="field"><label>Condició de soci/a</label><select value={f.isMember?'si':'no'} onChange={e=>handleMember(e.target.value==='si')}><option value="si">Soci/a AFA</option><option value="no">No soci/a</option></select></div>
   <div className="field"><label>Nombre de fills/es registrats/des</label><input type="number" min="1" value={f.childrenCount} onChange={set('childrenCount')}/></div>
   <div className="field"><label>Ordre del fill/a</label><select value={f.childOrder} onChange={set('childOrder')}><option value="1">1r fill/a</option><option value="2">2n fill/a</option><option value="3">3r fill/a o posterior</option></select></div>
  <div className="full discountBox"><div className="discountLine"><span>Quota i descomptes</span><b>Calculats automàticament</b></div><div className="discountLine"><span>Condició aplicada</span><b>{discountLabel}</b></div><div className="discountLine"><span>{cfg.extra?'Llibre de Robòtica · primera quota':'Calendari de quotes'}</span><b>{cfg.extra?`+${money(f.complements)}`:'Primera quota: octubre'}</b></div><div className="totalLine row space"><span>Import primera quota</span><span>{money(total)}</span></div><p className="muted small" style={{margin:'10px 0 0'}}>Les quotes mensuals comencen a l’octubre. El llibre només s’afegeix a la primera quota de Robòtica.</p></div>
  <div className="full sectionBreak"><span className="eyebrow">4 · Persones autoritzades i contactes</span></div><div className="field full"><label>Persones autoritzades per recollir</label><textarea value={f.autoritzats} onChange={set('autoritzats')} rows={3} placeholder="Nom · telèfon · relació"/></div><div className="field full"><label>Contactes d’emergència</label><textarea value={f.emergencia} onChange={set('emergencia')} rows={3} placeholder="Nom · telèfon · relació"/></div><div className="full sectionBreak"><span className="eyebrow">5 · Normativa i firma virtual</span><div className="notice" style={{marginTop:10}}>La preinscripció no implica l’adjudicació automàtica de plaça. La informació d’imatge és separada i voluntària.</div><details className="legalDetails"><summary>Llegir els textos legals complets</summary><h4>Protecció de dades</h4><p>El responsable és l’AFA Escola Sant Salvador, amb domicili a l’Av. de Sant Salvador, 13, 43130 Tarragona. Les dades es tracten per gestionar la preinscripció, l’activitat, els grups, els pagaments, les incidències i les comunicacions relacionades. La base jurídica és la gestió de la sol·licitud i, quan correspongui, el consentiment.</p><p>Les dades es conservaran mentre sigui necessària la gestió i durant els terminis legals aplicables. Pots exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a <b>contacte@afaescolasantsalvador.org</b>. També pots reclamar davant l’APDCAT.</p><h4>Normes de l’activitat</h4><p>La família es compromet a respectar els horaris, les indicacions de l’equip responsable i les normes de convivència. La plaça queda condicionada a la disponibilitat i al registre del pagament de la preinscripció. Les absències s’han de comunicar a l’AFA i no generen automàticament el retorn de quotes.</p><h4>Imatge</h4><p>L’autorització d’imatge és específica, voluntària i separada. No autoritzar-la no impedeix participar en l’activitat. L’AFA només utilitzarà les imatges autoritzades per a comunicació institucional i difusió de les seves activitats.</p></details></div>
  <label className="legalCheck full"><input type="checkbox" checked={Boolean(f.normativa)} onChange={e=>setF((x:any)=>({...x,normativa:e.target.checked}))}/><span><b>Accepto les normatives i els textos legals</b><small>He llegit el resum legal i confirmo que les dades són correctes.</small></span></label><label className="legalCheck full"><input type="checkbox" checked={Boolean(f.emergenciaOk)} onChange={e=>setF((x:any)=>({...x,emergenciaOk:e.target.checked}))}/><span><b>Autoritzo el contacte en cas d’emergència</b><small>Opcional: permet contactar amb les persones indicades si hi ha una incidència.</small></span></label><div className="field full"><label>Firma manuscrita del representant legal</label><div className="signaturePad"><canvas ref={signatureCanvas} onPointerDown={startSignature} onPointerMove={drawSignature} onPointerUp={finishSignature} onPointerCancel={finishSignature} aria-label="Espai per dibuixar la firma manuscrita"/><div className="signaturePadFooter"><small>Signa amb el dit o el ratolí</small><button type="button" className="btn secondary" onClick={clearSignature}>Esborrar</button></div></div><label style={{marginTop:10}}>Nom complet de la firma<input value={f.firmaVirtual||''} onChange={set('firmaVirtual')} placeholder="Escriu el teu nom complet" required/></label></div><div className="field full"><label>Autorització d’imatge</label><select value={f.imatge} onChange={set('imatge')}><option value="no">No autoritzo</option><option value="si">Sí, autoritzo</option></select></div>
  {submitError&&<div className="notice errorNotice full" role="alert">{submitError}</div>}<div className="full row space formSubmit"><span className="muted small">Rebràs un codi per consultar la gestió.</span><button className="btn primary" disabled={submitting}>{submitting?'Enviant…':'Enviar preinscripció →'}</button></div>
 </form>{legalOpen&&<div className="legalModalBackdrop" role="dialog" aria-modal="true" aria-label="Textos legals"><section className="legalModal"><div className="row space"><div><span className="eyebrow">Lectura obligatòria</span><h2>Textos legals de la inscripció</h2></div><button type="button" className="btn secondary" onClick={()=>setLegalOpen(false)}>Tancar</button></div><p className="muted small">Llegeix cada document complet. Pots acceptar-los individualment i continuar quan els quatre estiguin marcats.</p><div className="legalModalBody">{legalDocs.map(document=><article className="legalModalDocument" key={document.id}><div className="row space"><h3>{document.title}</h3><label className="legalModalAccept"><input type="checkbox" checked={Boolean(legalAccepted[document.id])} onChange={event=>setLegalAccepted(current=>({...current,[document.id]:event.target.checked}))}/> Accepto aquest text</label></div><div className="legalModalContent"><ReactMarkdown>{document.text}</ReactMarkdown></div></article>)}</div><button type="button" className="btn primary" disabled={!legalDocs.length||!legalDocs.every(document=>legalAccepted[document.id])} onClick={()=>{setF(current=>({...current,normativa:true}));setLegalOpen(false)}}>Acceptar els quatre textos i continuar</button></section></div>}</main>
}
