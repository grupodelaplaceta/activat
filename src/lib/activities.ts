import {adminSupabase} from '@/lib/supabase';
import {demoActivities} from '@/lib/demo';
import {DEFINITIVE_ACTIVITIES} from '@/lib/activity-config';

export async function getActivities(){
  try{
    const sb=adminSupabase();
    const {data,error}=await sb.from('activities').select('*').eq('active',true).order('name');
    if(error)throw error;
    if(data?.length){
      const {data:registrations}=await sb.from('registrations').select('activity_id,status');
      const definitiveNames=new Set(Object.keys(DEFINITIVE_ACTIVITIES));
      const mapped=data.filter((activity:any)=>definitiveNames.has(activity.name)).map((activity:any)=>{
        const fallback:any=demoActivities.find(item=>item.slug===activity.slug||item.name===activity.name)||{};
        const occupied=(registrations||[]).filter((registration:any)=>registration.activity_id===activity.id&&['admesa','matriculada'].includes(registration.status)).length;
        return {...fallback,...activity,capacity:activity.capacity_override??activity.capacity,occupied:registrations?occupied:Number(activity.occupied||fallback.occupied||0),image:activity.image||fallback.image||'',organizer:activity.organizer||fallback.organizer||'AFA Escola Sant Salvador',organizerLogo:fallback.organizerLogo};
      });
      const missing=demoActivities.filter((activity:any)=>definitiveNames.has(activity.name)&&!mapped.some((item:any)=>item.name===activity.name));
      return [...mapped,...missing].sort((a:any,b:any)=>a.name.localeCompare(b.name));
    }
  }catch{}
  return demoActivities;
}
