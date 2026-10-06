import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { modulBaru, templatModulBaru } from "../_shared/aturan.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const modulList = payload.modul || [];
  if (modulList.length === 0) {
    return new Response(JSON.stringify({ pesan: "Tidak ada modul baru" }));
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: dbModul } = await supabase.from("modul_diumumkan").select("module_id");
  const sudahSemua = (dbModul || []).map((m: any) => m.module_id);
  
  if (sudahSemua.length === 0) {
    // Peluncuran pertama, jangan kirim email
    const idUntukMasuk = modulList.map((m: any) => ({ module_id: m.id }));
    await supabase.from("modul_diumumkan").insert(idUntukMasuk);
    return new Response(JSON.stringify({ pesan: "Peluncuran pertama, tidak kirim email." }));
  }

  const ygBaru = modulBaru(modulList, sudahSemua);
  if (ygBaru.length === 0) {
    return new Response(JSON.stringify({ pesan: "Modul sudah pernah diumumkan semua." }));
  }

  const kunciLog = ygBaru.map(m => m.id).sort().join(",");

  const urlSitus = Deno.env.get("URL_SITUS") || "https://bisangoding.com";
  const batasHarian = parseInt(Deno.env.get("BATAS_HARIAN") || "400");
  const gmailUser = Deno.env.get("GMAIL_USER")!;
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;
  const funcUrl = `${supabaseUrl}/functions/v1/berhenti-langganan`;

  const { data: users, error } = await supabase
    .from("pengaturan_notifikasi")
    .select("user_id, email, nama, token_berhenti")
    .eq("modul_baru", true);

  if (error || !users) {
    console.error("Query error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Query error" }), { status: 500 });
  }

  const { data: logSudah } = await supabase
    .from("log_email")
    .select("user_id")
    .eq("jenis", "modul_baru")
    .eq("kunci", kunciLog);
    
  const sudahSet = new Set((logSudah || []).map((l: any) => l.user_id));
  const target = users.filter((u: any) => !sudahSet.has(u.user_id)).slice(0, batasHarian);

  if (target.length === 0) {
    // tandai modul diumumkan
    const idUntukMasuk = ygBaru.map((m: any) => ({ module_id: m.id }));
    await supabase.from("modul_diumumkan").insert(idUntukMasuk).select();
    return new Response(JSON.stringify({ dipilih: users.length, terkirim: 0, gagal: 0, selesai: true }));
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPassword }
    }
  });

  let terkirim = 0;
  let gagal = 0;
  try {


  for (const u of target) {
    const urlBerhenti = `${funcUrl}?token=${u.token_berhenti}&jenis=modul_baru`;
    const t = templatModulBaru(u.nama, ygBaru, urlSitus, urlBerhenti);

    try {
      await client.send({
        from: `BisaNgoding <${gmailUser}>`,
        to: u.email,
        subject: t.subjek,
        content: t.teks,
        html: t.html,
        headers: {
          "List-Unsubscribe": `<${urlBerhenti}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      });
      
      await supabase.from("log_email").insert({
        user_id: u.user_id,
        jenis: "modul_baru",
        kunci: kunciLog
      });
      
      terkirim++;
    } catch (e) {
      console.error(`Gagal kirim ke ${u.user_id}:`, e);
      gagal++;
    }
    
    await sleep(200);
  }


  } finally {
    await client.close();
  }

  return new Response(JSON.stringify({ dipilih: users.length, terkirim, gagal }));
});
