import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const documents=[
  {id:'normes',title:'Normes de funcionament',file:'NORMES DE FUNCIONAMENT.MD',fallback:'# Normes de funcionament\n\nLa participació en les activitats implica respectar els horaris, les indicacions de l’equip responsable, les normes de convivència i les instruccions de l’AFA i del centre. La família comunicarà qualsevol incidència, absència, al·lèrgia o necessitat rellevant. La plaça queda condicionada a la disponibilitat i a la correcta formalització de la inscripció.'},
  {id:'pagaments',title:'Política de pagaments',file:'POLITICA PAGAMENTS.MD',fallback:'# Política de pagaments\n\nLes quotes es gestionen mensualment. Cada quota té el seu import, data límit, estat i rebut individual. El pagament s’ha de fer pel mitjà comunicat per l’AFA dins del termini indicat. Les baixes, devolucions i incidències de pagament es tramitaran amb Secretaria segons les condicions de l’activitat.'},
  {id:'termes',title:'Termes i condicions',file:'TERMES I CONDICIONS.MD',fallback:'# Termes i condicions\n\nL’ús d’ACTIVA’T i la sol·licitud d’una activitat requereixen facilitar dades certes i acceptar les condicions de participació. L’AFA pot gestionar grups, places, comunicacions, pagaments i incidències relacionades amb el servei. La plaça no queda confirmada fins que Secretaria en valida l’adjudicació.'},
  {id:'privacitat',title:'Política de privacitat',file:'POLITIQUES PRIVADESA ACTIVAT.MD',fallback:'# Política de privacitat\n\nL’AFA Escola Sant Salvador tracta les dades per gestionar preinscripcions, matrícules, places, quotes, comunicacions i incidències. La persona interessada pot exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a contacte@afaescolasantsalvador.org. L’autorització d’imatge és específica i voluntària.'}
];

async function readDocument(file:string,fallback:string){
  const candidates=[
    path.join(process.cwd(), file),
    path.join(process.cwd(), 'public', file),
    path.join(process.cwd(), 'src', file),
    path.join(process.cwd(), 'docs', file)
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8');
    } catch {
      // intenta el següent candidat
    }
  }

  return fallback;
}

export async function GET(){
  const result=await Promise.all(documents.map(async document=>({
    id: document.id,
    title: document.title,
    text: await readDocument(document.file,document.fallback)
  })));
  return NextResponse.json({documents: result, version:'setembre de 2026'});
}
