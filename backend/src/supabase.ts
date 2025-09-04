 import { createClient } from '@supabase/supabase-js';
 
 const SUPABASE_URL = process.env.SUPABASE_URL!;
 const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
 
 export const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
 
 export async function getUserFromAuthHeader(authHeader?: string) {
   if (!authHeader?.startsWith('Bearer ')) return null;
   const token = authHeader.slice('Bearer '.length);
   const { data, error } = await sbAdmin.auth.getUser(token);
   if (error || !data?.user) return null;
   return data.user;
 }