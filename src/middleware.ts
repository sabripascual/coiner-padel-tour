import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAX_AGE = 400 * 24 * 60 * 60; // 400 días (máximo que permiten los navegadores)
const isAuthCookie = (name: string) => name.startsWith("sb-") && name.includes("-auth-token");

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const written = new Set<string>();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => {
            written.add(name);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  // Refresca la sesión si venció; verifica el JWT localmente cuando es posible.
  const { data } = await supabase.auth.getClaims();

  // Safari (iPhone) borra a los 7 días las cookies escritas desde el navegador.
  // Si la sesión es válida, la volvemos a escribir desde el servidor en cada visita
  // para que dure 400 días y el jugador no tenga que ingresar de nuevo.
  if (data?.claims) {
    const secure = request.nextUrl.protocol === "https:";
    for (const c of request.cookies.getAll()) {
      if (isAuthCookie(c.name) && !written.has(c.name)) {
        response.cookies.set(c.name, c.value, { path: "/", sameSite: "lax", httpOnly: false, secure, maxAge: MAX_AGE });
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|.*\\.(?:png|webp|svg|jpg|ico)$).*)"],
};
