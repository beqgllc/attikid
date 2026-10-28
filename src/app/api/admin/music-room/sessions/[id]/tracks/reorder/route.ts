import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

const fail=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const {supabase}=await requireAdmin();
    const {id:sessionId}=await params;
    let body:unknown;
    try{body=await request.json();}catch{return fail("Expected JSON.",400);}
    const ids=body&&typeof body==="object"?(body as {track_ids?:unknown}).track_ids:null;
    if(!Array.isArray(ids)||ids.some(id=>typeof id!=="string")||new Set(ids).size!==ids.length)return fail("track_ids must be an array of unique track IDs.",400);
    const {data,error}=await supabase.from("listening_session_tracks").select("id").eq("session_id",sessionId);
    if(error)return fail("Could not inspect session tracks.",500);
    const actual=new Set((data??[]).map(row=>row.id));
    if(actual.size!==ids.length||ids.some(id=>!actual.has(id)))return fail("The order must include every current track exactly once.",409);
    for(let index=0;index<ids.length;index++){
      const {error:updateError}=await supabase.from("listening_session_tracks").update({position:index}).eq("id",ids[index]).eq("session_id",sessionId);
      if(updateError)return fail("Could not save track order.",500);
    }
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"private,no-store"}});
  }catch{return fail("Administrator access required.",403);}
}
