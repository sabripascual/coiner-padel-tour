"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

/**
 * Mantiene el header, el menú y las páginas precargadas en sintonía con la sesión.
 * Si la sesión del navegador no coincide con lo que mostró el servidor
 * (ingresó/salió en otra pestaña, sesión restaurada, etc.) recarga los datos.
 */
export default function AuthSync({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") && !!session !== loggedIn) {
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [loggedIn, router]);
  return null;
}
