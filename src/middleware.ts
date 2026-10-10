import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PAGES_LIBRES = ["/admin/connexion"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (liste) => {
          liste.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          liste.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  // Rafraîchit la session (obligatoire avec @supabase/ssr)
  const { data } = await supabase.auth.getUser();

  const chemin = req.nextUrl.pathname;
  if (chemin.startsWith("/admin") && !PAGES_LIBRES.includes(chemin) && !data.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
