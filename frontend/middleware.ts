import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  // Importante: usar la misma Response para que el helper
  // pueda setear/refrescar las cookies de sesión
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Esto refresca la sesión si hace falta y adjunta cookies al response
  await supabase.auth.getSession();

  return res;
}

// Excluye estáticos y assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
