const json=(res,s,b)=>res.status(s).json(b);
export default async function handler(req,res){
 if(req.method!=='GET') return json(res,405,{ok:false});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,owner=process.env.EVOS_OWNER_ID;
 if(!url||!key||!owner) return json(res,500,{ok:false,error:'setup'});
 const h={apikey:key,Authorization:`Bearer ${key}`,Prefer:'count=exact'};
 const count=async table=>{const r=await fetch(`${url}/rest/v1/${table}?owner_id=eq.${owner}&select=id`,{headers:{...h,Range:'0-0'}});return Number((r.headers.get('content-range')||'/0').split('/')[1])||0};
 try{const [clients,bookings,payments]=await Promise.all([count('clients'),count('bookings'),count('payments')]);return json(res,200,{ok:true,clients,bookings,payments});}catch(e){return json(res,500,{ok:false,error:e.message})}
}
