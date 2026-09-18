import {jsPDF} from 'jspdf';

let outfitFontData: string | null = null;

function toBase64(buffer: ArrayBuffer){
  let binary='';
  const bytes=new Uint8Array(buffer);
  const chunk=0x8000;
  for(let index=0;index<bytes.length;index+=chunk){
    binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));
  }
  return btoa(binary);
}

export async function useOutfit(doc:jsPDF){
  try{
    if(!outfitFontData){
      const response=await fetch('/fonts/Outfit-Variable.ttf');
      if(!response.ok)throw new Error(`Outfit font request failed: ${response.status}`);
      outfitFontData=toBase64(await response.arrayBuffer());
    }
    doc.addFileToVFS('Outfit-Variable.ttf',outfitFontData);
    doc.addFont('Outfit-Variable.ttf','Outfit','normal');
    doc.addFont('Outfit-Variable.ttf','Outfit','bold');
    doc.addFont('Outfit-Variable.ttf','Outfit','black');
    doc.setFont('Outfit','normal');
    return true;
  }catch(error){
    console.warn('Outfit PDF font could not be loaded',error);
    doc.setFont('helvetica','normal');
    return false;
  }
}
