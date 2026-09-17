import fs from 'node:fs';
import path from 'node:path';

const documents=[
  ['Normes de funcionament','NORMES DE FUNCIONAMENT.MD'],
  ['Política de pagaments','POLITICA PAGAMENTS.MD'],
  ['Termes i condicions','TERMES I CONDICIONS.MD'],
  ['Política de privacitat','POLITIQUES PRIVADESA ACTIVAT.MD']
] as const;

function readDocument(file:string){try{return fs.readFileSync(path.join(process.cwd(),file),'utf8')}catch{return 'Aquest document no està disponible temporalment.'}}

export default function Legal(){return <main className="container legalPage"><section className="hero"><span className="eyebrow">Informació pública · ACTIVA’T</span><h1>Normes, pagaments i privacitat</h1><p>Consulta els textos complets que formen part del procés de preinscripció i matrícula de l’AFA Escola Sant Salvador.</p></section><div className="legalDocumentGrid">{documents.map(([title,file])=><article className="card legalDocument" key={file}><div className="legalDocumentHeader"><span className="legalDocumentIcon">▤</span><div><h2>{title}</h2><small>Document oficial · curs 2026–2027</small></div></div><pre>{readDocument(file)}</pre></article>)}</div></main>}
