import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const documents=[
  {id:'normes',title:'Normes de funcionament',file:'NORMES DE FUNCIONAMENT.MD'},
  {id:'pagaments',title:'Política de pagaments',file:'POLITICA PAGAMENTS.MD'},
  {id:'termes',title:'Termes i condicions',file:'TERMES I CONDICIONS.MD'},
  {id:'privacitat',title:'Política de privacitat',file:'POLITIQUES PRIVADESA ACTIVAT.MD'}
];

export async function GET(){const result=await Promise.all(documents.map(async document=>({id:document.id,title:document.title,text:await fs.readFile(path.join(process.cwd(),document.file),'utf8')})));return NextResponse.json({documents:result,version:'setembre de 2026'});}
