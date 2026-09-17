import {NextRequest,NextResponse} from 'next/server';
import {adminSupabase} from '@/lib/supabase';
import {demoRegistrations,demoActivities} from '@/lib/demo';

export async function GET(req:NextRequest){
  if(req.headers.get('x-activat-admin-secret')!==process.env.ACTIVAT_ADMIN_SECRET)return NextResponse.json({error:'Clau interna incorrecta.'},{status:401});
  try{
    const sb=adminSupabase();
    const {data:rows,error}=await sb.from('registrations').select('*').order('payment_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
    if(error)throw error;

    const registrations=(rows||[]).map((record:any)=>({
      ...record,
      fees: [],
      activity_id: record.activity_id || null,
    }));

    const ids=registrations.map((r:any)=>r.id);
    const {data:enrollments}=ids.length?await sb.from('enrollments').select('id,registration_id').in('registration_id',ids):{data:[]};
    const enrollmentIds=(enrollments||[]).map((e:any)=>e.id);
    const {data:fees}=enrollmentIds.length?await sb.from('monthly_fees').select('*').in('enrollment_id',enrollmentIds):{data:[]};
    registrations.forEach((r:any)=>{
      const enrollment=(enrollments||[]).find((e:any)=>e.registration_id===r.id);
      r.fees=(fees||[]).filter((f:any)=>f.enrollment_id===enrollment?.id);
    });

    const {data:acts}=await sb.from('activities').select('*').order('name');
    const sourceActivities=(acts&&acts.length>0)?acts:demoActivities;
    const activities=sourceActivities.map((activity:any)=>{
      const occupied=registrations.filter((record:any)=>
        (record.activity_id===activity.id || record.activity_name===activity.name) &&
        ['admesa','matriculada'].includes(String(record.status||'').toLowerCase())
      ).length;
      return {
        ...activity,
        occupied,
        effective_capacity: activity.capacity_override ?? activity.capacity,
        available: Math.max(0, Number(activity.capacity_override ?? activity.capacity ?? 0) - occupied),
      };
    });

    return NextResponse.json({
      kpis:{
        'Preinscripcions':registrations.length,
        'Actives':registrations.filter(r=>r.status!=='eliminada').length,
        'Places ocupades':registrations.filter(r=>['admesa','matriculada'].includes(String(r.status||'').toLowerCase())).length,
        'Pagat':registrations.reduce((s,r)=>s+Number(r.paid_amount||0),0).toFixed(2)+' €',
        'Pendent':registrations.reduce((s,r)=>s+Math.max(0,Number(r.total_amount||0)-Number(r.paid_amount||0)),0).toFixed(2)+' €',
        'Places lliures':activities.reduce((sum,activity:any)=>sum + Math.max(0, Number(activity.effective_capacity || 0) - Number(activity.occupied || 0)), 0),
      },
      registrations,
      activities,
    });
  }catch{
    return NextResponse.json({
      kpis:{
        'Preinscripcions':demoRegistrations.length,
        'Actives':demoRegistrations.filter(r=>r.status!=='eliminada').length,
        'Places ocupades':demoRegistrations.filter(r=>['admesa','matriculada'].includes(r.status)).length,
        'Pagat':demoRegistrations.reduce((s,r)=>s+Number(r.paid_amount||0),0).toFixed(2)+' €',
        'Pendent':demoRegistrations.reduce((s,r)=>s+Math.max(0,Number(r.total_amount||0)-Number(r.paid_amount||0)),0).toFixed(2)+' €',
        'Places lliures':demoActivities.reduce((s,a)=>s + Math.max(0, Number(a.capacity || 0) - Number(a.occupied || 0)),0),
      },
      registrations:demoRegistrations,
      activities:demoActivities.map(a=>({...a,effective_capacity:a.capacity,available:Math.max(0,a.capacity-a.occupied)})),
    });
  }
}
