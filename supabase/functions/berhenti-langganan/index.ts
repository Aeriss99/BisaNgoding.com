import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const jenis = url.searchParams.get("jenis") || "semua";
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const urlSitus = Deno.env.get("URL_SITUS") || "https://bisangoding.com";

  if (!token) {
    return new Response("Token tidak valid", { status: 400 });
  }

  const { data: user } = await supabase
    .from("pengaturan_notifikasi")
    .select("user_id")
    .eq("token_berhenti", token)
    .single();

  if (!user) {
    return new Response("Token tidak valid atau kadaluarsa", { status: 400 });
  }

  const pembaruan: any = {};
  if (jenis === "streak" || jenis === "semua") pembaruan.streak = false;
  if (jenis === "modul_baru" || jenis === "semua") pembaruan.modul_baru = false;

  await supabase
    .from("pengaturan_notifikasi")
    .update(pembaruan)
    .eq("user_id", user.user_id);

  const isPost = req.method === "POST" || (req.headers.get("List-Unsubscribe-Post") !== null);
  
  if (isPost) {
    return new Response("OK", { status: 200 });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Berhenti Langganan</title>
  <style>
    body { font-family: sans-serif; background: #fbf7ee; color: #111; padding: 40px 20px; text-align: center; }
    .box { background: white; border: 2px solid #111; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto; box-shadow: 4px 4px 0 #111; }
    h1 { margin-top: 0; }
    a { display: inline-block; padding: 10px 20px; background: #ffd93d; color: #111; text-decoration: none; font-weight: bold; border-radius: 8px; border: 2px solid #111; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Berhasil</h1>
    <p>Kamu tidak akan menerima email <b>${jenis === 'semua' ? 'dari kami' : jenis.replace('_', ' ')}</b> lagi.</p>
    <a href="${urlSitus}">Kembali ke situs</a>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
});
