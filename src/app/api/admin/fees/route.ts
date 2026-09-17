import {NextRequest,NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';

function auth(req:NextRequest){return req.headers.get('x-activat-admin-secret')===process.env.ACTIVAT_ADMIN_SECRET}

export async function PATCH(req:NextRequest){
 if(!auth(req)) return NextResponse.json({error:'No autoritzat.'},{status:401});
 const body=await req.json();
 const id=String(body.id||'');
 if(!id) return NextResponse.json({error:'Falta l’identificador de la quota.'},{status:400});
 const patch:any={};
 if(body.amount!==undefined) patch.amount=Math.max(0,Number(body.amount));
 if(body.discount!==undefined) patch.discount=Math.max(0,Number(body.discount));
 if(body.total!==undefined) patch.total=Math.max(0,Number(body.total));
 if(body.status!==undefined) patch.status=body.status==='Nula'?'Nula':body.status;
 if(body.status==='Nula'){patch.amount=0;patch.discount=0;patch.total=0;patch.paid_at=null;}
 if(body.status==='pagada') patch.paid_at=new Date().toISOString();
 try{const sb=adminSupabase();const {data,error}=await sb.from('monthly_fees').update(patch).eq('id',id).select('*').single();if(error)throw error;return NextResponse.json(data)}catch{return NextResponse.json({error:'No s’ha pogut actualitzar la quota.'},{status:500})}
}
