import {NextRequest,NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(req.headers.get('x-activat-admin-secret')!==process.env.ACTIVAT_ADMIN_SECRET)return NextResponse.json({error:'No autoritzat.'},{status:401});
  const {id}=await params; const body=await req.json();
  const allowed=['is_member','registered_children_count','child_order','member_discount_amount','sibling_discount_amount','discount_amount','discount_label','status'];
  const patch:any={}; for(const k of allowed) if(body[k]!==undefined) patch[k]=body[k];
  if(patch.is_member!==undefined) patch.is_member=Boolean(patch.is_member);
  if(patch.registered_children_count!==undefined) patch.registered_children_count=Math.max(1,Number(patch.registered_children_count));
  if(patch.child_order!==undefined) patch.child_order=Math.max(1,Number(patch.child_order));
  if(patch.discount_amount!==undefined) patch.discount_amount=Math.max(0,Number(patch.discount_amount));
  try{const sb=adminSupabase();const {data,error}=await sb.from('registrations').update(patch).eq('id',id).select('*').single();if(error)throw error;return NextResponse.json(data)}catch{return NextResponse.json({error:'No s’ha pogut actualitzar l’expedient.'},{status:500})}
}
