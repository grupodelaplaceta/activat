import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const documents=[
  {id:'normes',title:'Normes de funcionament',file:'NORMES DE FUNCIONAMENT.MD'},
  {id:'pagaments',title:'Política de pagaments',file:'POLITICA PAGAMENTS.MD'},
  {id:'termes',title:'Termes i condicions',file:'TERMES I CONDICIONS.MD'},
  {id:'privacitat',title:'Política de privacitat',file:'POLITIQUES PRIVADESA ACTIVAT.MD'}
];

async function readDocument(file:string){
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

  return 'Aquest document no està disponible temporalment.';
}

export async function GET(){
  const result=await Promise.all(documents.map(async document=>({
    id: document.id,
    title: document.title,
    text: await readDocument(document.file)
  })));
  return NextResponse.json({documents: result, version:'setembre de 2026'});
}
