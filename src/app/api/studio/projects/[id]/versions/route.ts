import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
const fail=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});

async function auth(){
  const supabase=await createClient();
  const {data,error}=await supabase.auth.getClaims();
  const userId=data?.claims?.sub;
  return error||typeof userId!=="string"?null:{supabase,userId};
}

export async function GET(_request:NextRequest,context:Context){
  const session=await auth();
  if(!session)return fail("Sign in to view cloud checkpoints.",401);
  const {id}=await context.params;
  const {data,error}=await session.supabase.from("studio_draft_versions")
    .select("id,project_id,user_id,snapshot,version_note,created_at")
    .eq("project_id",id).eq("user_id",session.userId).order("created_at",{ascending:false}).limit(50);
  if(error)return fail("Could not load cloud checkpoints.",500);
  return NextResponse.json({versions:data??[]},{headers:{"Cache-Control":"private,no-store"}});
}

export async function POST(request:NextRequest,context:Context){
  const session=await auth();
  if(!session)return fail("Sign in to create cloud checkpoints.",401);
  const {id}=await context.params;
  let body:unknown;
  try{body=await request.json();}catch{return fail("Expected JSON.",400);}
  if(!body||typeof body!=="object")return fail("Invalid checkpoint payload.",400);
  const input=body as Record<string,unknown>;
  const snapshot=input.snapshot;
  const version_note=typeof input.version_note==="string"?input.version_note.trim().slice(0,200):null;
  if(!snapshot||typeof snapshot!=="object"||JSON.stringify(snapshot).length>500_000)return fail("A valid checkpoint under 500 KB is required.",400);
  const {data,error}=await session.supabase.from("studio_draft_versions")
    .insert({project_id:id,user_id:session.userId,snapshot,version_note})
    .select("id,project_id,snapshot,version_note,created_at").single();
  if(error)return fail("Could not create cloud checkpoint. Verify the project belongs to your account.",400);
  return NextResponse.json({version:data},{status:201,headers:{"Cache-Control":"private,no-store"}});
}
