
 "use client";
 import { useEffect, useState } from "react";
 import Link from "next/link";
 import { supabase } from "@/lib/supabase/client";

 export function Navbar() {
   const [email, setEmail] = useState<string | null>(null);

   useEffect(() => {
     supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
     });
   }, []);

   return (
     <nav className="w-full h-14 border-b flex items-center px-4 justify-between">
       <div className="font-semibold">IAgent Marketing</div>
       <div className="flex items-center gap-2">
         {email ? (
           <>
             <Link href="/dashboard" className="rounded-lg px-3 py-1.5 border hover:bg-neutral-50">
               Dashboard
             </Link>
             <span className="text-sm text-neutral-600">{email}</span>
             <button
               onClick={async () => {
                 await supabase.auth.signOut();
                 window.location.href = "/login";
               }}
               className="rounded-lg px-3 py-1.5 bg-neutral-900 text-white hover:opacity-90"
             >
               Salir
             </button>
           </>
         ) : (
           <>
            <a href="/login" className="rounded-lg px-3 py-1.5 border hover:bg-neutral-50">
               Iniciar sesión
             </a>
             <a href="/register" className="rounded-lg px-3 py-1.5 bg-blue-600 text-white hover:opacity-90">
               Crear cuenta
             </a>
           </>
        )}
       </div>
     </nav>
   );
 }
