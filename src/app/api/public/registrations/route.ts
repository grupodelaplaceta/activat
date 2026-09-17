import {NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';

function makeCode(){
  return `AFA-${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).slice(2,5).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;
}
function normalizeDocument(value:string){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function normalizeActivity(value:string){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}

export async function GET(req:Request){
  const url=new URL(req.url);
  const dni=normalizeDocument(url.searchParams.get('dni')||'');
  const activity=String(url.searchParams.get('activity')||'').trim();
  if(!dni||!activity)return NextResponse.json({children:0,nextChildOrder:1});
  try{
    if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({children:0,nextChildOrder:1});
    const sb=adminSupabase();
    const {data:activities}=await sb.from('activities').select('id,name,slug').eq('active',true);
    const matched=(activities||[]).find((item:any)=>normalizeActivity(item.name)===normalizeActivity(activity)||item.slug===activity.toLowerCase().replace(/\s+/g,'-'));
    const {data:rows,error}=await sb.from('registrations').select('id,dni,child_order,student_name,activity_id,activity_name');
    if(error)throw error;
    const sameActivity=(rows||[]).filter((row:any)=>normalizeDocument(row.dni)===dni&&(matched?row.activity_id===matched.id||normalizeActivity(row.activity_name)===normalizeActivity(matched.name):normalizeActivity(row.activity_name)===normalizeActivity(activity)));
    return NextResponse.json({children:sameActivity.length,nextChildOrder:sameActivity.length+1,students:sameActivity.map((row:any)=>row.student_name)});
  }catch(error){
    console.warn('family child lookup failed',error);
    return NextResponse.json({children:0,nextChildOrder:1});
  }
}

export async function POST(req:Request){
  const f=await req.json();
  if(!f.alumne||!f.tutor||!f.email||!f.activitat){
    return NextResponse.json({error:'Falten dades obligatòries.'},{status:400});
  }

  const total=Math.max(0,Number(f.quota||0)-Number(f.descompte||0))+Number(f.complements||0);
  const record={
    code:makeCode(),
    status:'pendent de pagament',
    course:f.curs,
    group_name:f.grup,
    activity_name:f.activitat,
    student_name:f.alumne,
    birth_date:f.naixement||null,
    allergies:f.alergies||'',
    nese:f.nese,
    nese_detail:f.neseDetall||'',
    representative_name:f.tutor,
    dni:f.dni||'',
    phone:f.telefon||'',
    email:f.email,
    address:f.adreca||'',
    city:f.municipi||'',
    postal_code:f.cp||'',
    authorized_people:Array.isArray(f.authorized_people)?f.authorized_people:[],
    emergency_contacts:Array.isArray(f.emergency_contacts)?f.emergency_contacts:[],
    signature_data:f.signature_data||'',
    legal_acceptances:f.legal_acceptances||{},
    rules_accepted:Boolean(f.rules_accepted),
    outing_accepted:Boolean(f.outing_accepted),
    data_info_accepted:Boolean(f.data_info_accepted),
    emergency_accepted:Boolean(f.emergency_accepted),
    image_consent:f.imatge==='si',
    base_amount:Number(f.quota||0),
    discount_amount:Number(f.descompte||0),
    complements_amount:Number(f.complements||0),
    total_amount:total,
    paid_amount:0,
    payment_method:f.mitja||'',
    is_member:Boolean(f.isMember),
    registered_children_count:Math.max(1,Number(f.childrenCount||1)),
    child_order:Math.max(1,Number(f.childOrder||1)),
    member_discount_amount:Boolean(f.isMember)?Number(f.memberDiscount||0):0,
    sibling_discount_amount:Math.max(0,Number(f.childOrder||1))===2?Number(f.secondDiscount||0):(Math.max(0,Number(f.childOrder||1))>=3?Number(f.thirdDiscount||0):0),
    discount_label:f.discountLabel||'',
    created_at:new Date().toISOString(),
  } as any;

  try{
    if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY){
      return NextResponse.json({error:'Falten NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY a la configuració del servidor.'},{status:500});
    }
    const sb=adminSupabase();
    const {data:activities,error:activityError}=await sb.from('activities').select('id,name,slug').eq('active',true);
    if(activityError) console.warn('activity lookup failed during registration',activityError);
    const matchedActivity=(activities||[]).find((activity:any)=>
      activity.name===f.activitat || activity.slug===String(f.activitat).toLowerCase().replace(/\s+/g,'-')
    );
    if(matchedActivity){
      record.activity_id = matchedActivity.id;
      record.activity_name = matchedActivity.name;
    }

    const normalizedDni=normalizeDocument(f.dni);
    if(normalizedDni){
      const {data:familyRows,error:familyError}=await sb.from('registrations').select('id,dni,student_name,child_order,activity_id,activity_name');
      if(familyError)throw familyError;
      const sameActivity=(familyRows||[]).filter((row:any)=>
        normalizeDocument(row.dni)===normalizedDni&&((record.activity_id&&row.activity_id===record.activity_id)||normalizeActivity(row.activity_name)===normalizeActivity(record.activity_name))
      );
      const nextChildOrder=sameActivity.length+1;
      const siblingDiscount=nextChildOrder===2?Number(f.secondDiscount||0):nextChildOrder>=3?Number(f.thirdDiscount||0):0;
      record.child_order=nextChildOrder;
      record.registered_children_count=Math.max(Number(f.childrenCount||1),nextChildOrder);
      record.sibling_discount_amount=siblingDiscount;
      record.discount_amount=Number(record.member_discount_amount||0)+siblingDiscount;
      record.total_amount=Math.max(0,record.base_amount-record.discount_amount)+record.complements_amount;
      record.discount_label=[record.member_discount_amount?'Soci/a':'',siblingDiscount?'Germans':''].filter(Boolean).join(' · ');
    }

    const {data:created,error}=await sb.from('registrations').insert(record).select('id,code,total_amount').single();
    if(error)throw error;
    return NextResponse.json({code:created.code,total:created.total_amount});
  }catch(error){
    console.error('public registration insert failed',error);
    const details=error&&typeof error==='object'&&'message' in error?String((error as {message:string}).message):'';
    const code=error&&typeof error==='object'&&'code' in error?String((error as {code:string}).code):'';
    return NextResponse.json({
      error:'No s’ha pogut desar la preinscripció. Revisa la connexió amb Supabase i que el schema estigui aplicat.',
      code:code||undefined,
      details:details||undefined,
    },{status:500});
  }
}
