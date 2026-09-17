import {adminSupabase} from '@/lib/supabase';
import {demoActivities} from '@/lib/demo';

export async function getActivities(){
  try{
    const sb=adminSupabase();
    const {data,error}=await sb.from('activities').select('*').eq('active',true).order('name');
    if(error)throw error;
    if(data?.length){
      const {data:registrations}=await sb.from('registrations').select('activity_id,status');
      return data.map((activity:any)=>{
        const fallback:any=demoActivities.find(item=>item.slug===activity.slug||item.name===activity.name)||{};
        const occupied=(registrations||[]).filter((registration:any)=>registration.activity_id===activity.id&&['admesa','matriculada'].includes(registration.status)).length;
        return {...fallback,...activity,capacity:activity.capacity_override??activity.capacity,occupied:registrations?occupied:Number(activity.occupied||fallback.occupied||0),image:activity.image||fallback.image||'',organizer:activity.organizer||fallback.organizer||'AFA Escola Sant Salvador',organizerLogo:fallback.organizerLogo};
      });
    }
  }catch{}
  return demoActivities;
}
