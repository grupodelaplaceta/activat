import {NextRequest,NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(req.headers.get('x-activat-admin-secret')!==process.env.ACTIVAT_ADMIN_SECRET)return NextResponse.json({error:'No autoritzat.'},{status:401});
  const {id}=await params; const body=await req.json();
  const action=String(body.action||'');
  const allowed=['student_name','birth_date','allergies','nese','nese_detail','representative_name','dni','phone','email','address','city','postal_code','authorized_people','emergency_contacts','payment_method','paid_amount','signature_data','legal_acceptances','start_month','rules_accepted','outing_accepted','data_info_accepted','emergency_accepted','image_consent','course','group_name','is_member','registered_children_count','child_order','member_discount_amount','sibling_discount_amount','discount_amount','discount_label','status','special_tariff_enabled','special_tariff_amount','special_tariff_label','payment_date','mark_paid','place'];
  const patch:any={};
  for(const k of allowed) if(body[k]!==undefined) patch[k]=body[k];

  if(patch.is_member!==undefined) patch.is_member=Boolean(patch.is_member);
  if(patch.registered_children_count!==undefined) patch.registered_children_count=Math.max(1,Number(patch.registered_children_count));
  if(patch.child_order!==undefined) patch.child_order=Math.max(1,Number(patch.child_order));
  if(patch.discount_amount!==undefined) patch.discount_amount=Math.max(0,Number(patch.discount_amount));
  if(patch.paid_amount!==undefined) patch.paid_amount=Math.max(0,Number(patch.paid_amount));
  if(patch.special_tariff_enabled!==undefined) patch.special_tariff_enabled=Boolean(patch.special_tariff_enabled);
  if(patch.special_tariff_amount!==undefined) patch.special_tariff_amount=patch.special_tariff_amount===null?null:Math.max(0,Number(patch.special_tariff_amount));

  const markPaid=Boolean(patch.mark_paid);
  if(markPaid){
    patch.payment_date = body.payment_date || new Date().toISOString().slice(0,10);
    patch.status = 'Pendent d’assignació de plaça';
    delete patch.mark_paid;
  }

  try{
    const sb=adminSupabase();
    const {data:current,error:readError}=await sb.from('registrations').select('*').eq('id',id).single();
    if(readError) throw readError;

    const merged={...current,...patch};
    if(action==='assign_place'||action==='waitlist'||action==='matriculate'){
      const activityId=merged.activity_id;
      const {data:activities,error:activitiesError}=await sb.from('activities').select('id,name,capacity,capacity_override,vacancies_open');
      if(activitiesError) throw activitiesError;
      const normalize=(value:string)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
      const activity=(activities||[]).find((candidate:any)=>activityId?candidate.id===activityId:normalize(candidate.name)===normalize(merged.activity_name));
      if(!activity) return NextResponse.json({error:`No s’ha trobat l’activitat “${merged.activity_name}”. Revisa el nom de l’activitat a Supabase.`},{status:409});
      if((action==='assign_place'||action==='matriculate')&&['admesa','matriculada'].includes(String(current.status||'').toLowerCase())&&current.place){
        return NextResponse.json({...current,fees:body.fees||[]});
      }
      if(action==='waitlist'&&String(current.status||'').toLowerCase()==='llista d’espera'&&!current.place){
        return NextResponse.json({...current,fees:body.fees||[]});
      }
      const byId=await sb.from('registrations').select('id,place,status').eq('activity_id',activity.id).in('status',['admesa','matriculada']).neq('id',id);
      const byName=await sb.from('registrations').select('id,place,status').eq('activity_name',activity.name).in('status',['admesa','matriculada']).neq('id',id);
      if(byId.error) throw byId.error;
      if(byName.error) throw byName.error;
      const occupiedRows=Array.from(new Map([...(byId.data||[]),...(byName.data||[])].map((row:any)=>[row.id,row])).values());
      const capacity=Number(activity.capacity_override??activity.capacity??0);
      if(action==='waitlist'){
        patch.status='llista d’espera';
        patch.place=null;
      }else{
        if(capacity>0&&occupiedRows.length>=capacity) return NextResponse.json({error:`No hi ha places disponibles per ${activity.name} (${capacity} places). L’expedient s’ha de posar a la llista d’espera.`},{status:409});
        const used=new Set(occupiedRows.map((row:any)=>Number(row.place)).filter((place:number)=>Number.isInteger(place)&&place>0));
        let place=1; while(used.has(place)) place+=1;
        patch.place=place;
        patch.status=action==='matriculate'?'matriculada':'admesa';
      }
      patch.activity_id=activity.id;
    }
    const automatic=Math.max(0,Number(merged.base_amount||0)-Number(merged.member_discount_amount||0)-Number(merged.sibling_discount_amount||0))+Number(merged.complements_amount||0);
    const calculatedTotal = merged.special_tariff_enabled && merged.special_tariff_amount !== null && merged.special_tariff_amount !== undefined
      ? Math.max(0, Number(merged.special_tariff_amount))
      : automatic;

    patch.total_amount = calculatedTotal;
    patch.discount_amount = Math.max(0, Number(merged.member_discount_amount || 0) + Number(merged.sibling_discount_amount || 0));

    if(markPaid) patch.paid_amount = patch.total_amount;
    if(patch.paid_amount!==undefined && patch.paid_amount>0 && patch.payment_date===undefined){
      patch.payment_date = new Date().toISOString().slice(0,10);
      patch.status = 'Pendent d’assignació de plaça';
    }
    if((!merged.start_month || !String(merged.start_month).trim()) && (markPaid || Number(patch.paid_amount || 0) > 0)){
      patch.start_month = (patch.payment_date || new Date().toISOString()).slice(0,7);
    }
    if(patch.status==='Pendent d’assignació de plaça' && patch.payment_date===undefined){
      patch.payment_date = new Date().toISOString().slice(0,10);
    }

    const {data,error}=await sb.from('registrations').update(patch).eq('id',id).select('*').single();
    if(error)throw error;

    if(action==='assign_place'||action==='waitlist'||action==='matriculate'){
      const enrollmentStatus=action==='matriculate'?'activa':action==='waitlist'?'llista d’espera':'pendent';
      const enrollmentPatch={activity_id:data.activity_id,status:enrollmentStatus,enrolled_at:action==='matriculate'?new Date().toISOString():null};
      const existingEnrollment=await sb.from('enrollments').select('id').eq('registration_id',id).maybeSingle();
      if(existingEnrollment.error) throw existingEnrollment.error;
      const enrollment=existingEnrollment.data
        ? (await sb.from('enrollments').update(enrollmentPatch).eq('id',existingEnrollment.data.id).select('id').single()).data
        : (await sb.from('enrollments').insert({registration_id:id,...enrollmentPatch}).select('id').single()).data;
      if(!enrollment) throw new Error('No s’ha pogut crear la matrícula.');
      const {error:movementError}=await sb.from('place_movements').insert({activity_id:data.activity_id,registration_id:id,movement_type:action,from_status:current.status,to_status:data.status,quantity:action==='waitlist'?0:1,reason:body.reason||null});
      if(movementError) throw movementError;
      if(Array.isArray(body.fees)&&enrollment) body.enrollment_id=enrollment.id;
    }

    if(Array.isArray(body.fees)){
      let {data:enrollment,error:enrollmentError}=await sb.from('enrollments').select('id').eq('registration_id',id).maybeSingle();
      if(enrollmentError)throw enrollmentError;
      if(!enrollment){
        const created=await sb.from('enrollments').insert({registration_id:id,status:'pendent'}).select('id').single();
        if(created.error)throw created.error;
        enrollment=created.data;
      }
      for(const fee of body.fees){
        if(!fee.month)continue;
        const {error:feeError}=await sb.from('monthly_fees').upsert({
          enrollment_id: enrollment.id,
          month: String(fee.month).slice(0,10),
          amount: Math.max(0, Number(fee.amount || 0)),
          discount: Math.max(0, Number(fee.discount || 0)),
          total: Math.max(0, Number(fee.total || 0)),
          due_date: fee.due_date || null,
          status: fee.status === 'Nula' ? 'Nula' : fee.status || 'pendent',
          paid_at: fee.status === 'pagada' ? (fee.paid_at || new Date().toISOString()) : null,
        }, {onConflict:'enrollment_id,month'});
        if(feeError) throw feeError;
      }
    }

    return NextResponse.json({...data, fees: body.fees || []});
  }catch(error){
    console.error('admin registration update failed', error);
    const details = error && typeof error === 'object' && 'message' in error ? String((error as {message:string}).message) : '';
    return NextResponse.json({
      error:'No s’ha pogut actualitzar l’expedient. Revisa que Supabase tingui aplicades les últimes migracions.',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    }, {status:500});
  }
}

