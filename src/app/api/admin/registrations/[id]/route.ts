import {NextRequest,NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(req.headers.get('x-activat-admin-secret')!==process.env.ACTIVAT_ADMIN_SECRET)return NextResponse.json({error:'No autoritzat.'},{status:401});
  const {id}=await params; const body=await req.json();
  const allowed=['student_name','birth_date','allergies','nese','nese_detail','representative_name','dni','phone','email','address','city','postal_code','authorized_people','emergency_contacts','payment_method','signature_data','rules_accepted','outing_accepted','data_info_accepted','emergency_accepted','image_consent','course','group_name','is_member','registered_children_count','child_order','member_discount_amount','sibling_discount_amount','discount_amount','discount_label','status','special_tariff_enabled','special_tariff_amount','special_tariff_label','payment_date','mark_paid'];
  const patch:any={}; for(const k of allowed) if(body[k]!==undefined) patch[k]=body[k];
  if(patch.is_member!==undefined) patch.is_member=Boolean(patch.is_member);
  if(patch.registered_children_count!==undefined) patch.registered_children_count=Math.max(1,Number(patch.registered_children_count));
  if(patch.child_order!==undefined) patch.child_order=Math.max(1,Number(patch.child_order));
  if(patch.discount_amount!==undefined) patch.discount_amount=Math.max(0,Number(patch.discount_amount));
  if(patch.special_tariff_enabled!==undefined) patch.special_tariff_enabled=Boolean(patch.special_tariff_enabled);
  if(patch.special_tariff_amount!==undefined) patch.special_tariff_amount=patch.special_tariff_amount===null?null:Math.max(0,Number(patch.special_tariff_amount));
  const markPaid=Boolean(patch.mark_paid);
  if(markPaid){patch.payment_date=body.payment_date||new Date().toISOString().slice(0,10);patch.status='Pendent d’assignació de plaça';delete patch.mark_paid;}
  if(patch.status==='Pendent d’assignació de plaça' && patch.payment_date===undefined) patch.payment_date=new Date().toISOString().slice(0,10);
  try{
    const sb=adminSupabase();
    const {data:current,error:readError}=await sb.from('registrations').select('*').eq('id',id).single();
    if(readError) throw readError;
    const merged={...current,...patch};
    const automatic=Math.max(0,Number(merged.base_amount||0)-Number(merged.member_discount_amount||0)-Number(merged.sibling_discount_amount||0))+Number(merged.complements_amount||0);
    patch.total_amount=merged.special_tariff_enabled&&merged.special_tariff_amount!==null&&merged.special_tariff_amount!==undefined?Math.max(0,Number(merged.special_tariff_amount)):automatic;
    patch.discount_amount=Math.max(0,Number(merged.member_discount_amount||0)+Number(merged.sibling_discount_amount||0));
    if(markPaid) patch.paid_amount=patch.total_amount;
    const {data,error}=await sb.from('registrations').update(patch).eq('id',id).select('*').single();if(error)throw error;return NextResponse.json(data)
  }catch{return NextResponse.json({error:'No s’ha pogut actualitzar l’expedient.'},{status:500})}
}
