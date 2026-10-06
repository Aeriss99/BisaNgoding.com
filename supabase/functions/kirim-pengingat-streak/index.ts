import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { tanggalJakarta, perluPengingat, templatPengingat } from "../_shared/aturan.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const urlSitus = Deno.env.get("URL_SITUS") || "https://bisangoding.com";
  const batasHarian = parseInt(Deno.env.get("BATAS_HARIAN") || "400");
  const gmailUser = Deno.env.get("GMAIL_USER")!;
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;
  const funcUrl = `${supabaseUrl}/functions/v1/berhenti-langganan`;

  const hariIni = tanggalJakarta(new Date());

  const { data: users, error } = await supabase
    .from("pengaturan_notifikasi")
    .select("user_id, email, nama, token_berhenti")
    .eq("streak", true);

  if (error || !users) {
    console.error("Query pengaturan_notifikasi error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Query error" }), { status: 500 });
  }

  const progresMap = new Map();
  const allUserIds = users.map((u: any) => u.user_id);
  
  for (let i = 0; i < allUserIds.length; i += 200) {
    const chunk = allUserIds.slice(i, i + 200);
    const { data: progData, error: progErr } = await supabase
      .from("progres")
      .select("user_id, data")
      .in("user_id", chunk);
      
    if (progErr) {
      console.error("Query progres error:", progErr);
      return new Response(JSON.stringify({ error: progErr.message }), { status: 500 });
    }
    
    if (progData) {
      for (const p of progData) {
        progresMap.set(p.user_id, p.data);
      }
    }
  }

  const yangButuh = users.filter((u: any) => {
    const progData = progresMap.get(u.user_id);
    if (!progData) return false;
    u.progData = progData;
    return perluPengingat(progData, hariIni);
  });

  const { data: logSudah } = await supabase
    .from("log_email")
    .select("user_id")
    .eq("jenis", "streak")
    .eq("kunci", hariIni);
    
  const sudahSet = new Set((logSudah || []).map((l: any) => l.user_id));
  const target = yangButuh.filter((u: any) => !sudahSet.has(u.user_id)).slice(0, batasHarian);

  if (target.length === 0) {
    return new Response(JSON.stringify({ dipilih: yangButuh.length, terkirim: 0, gagal: 0 }));
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
    const progData = u.progData;
    const urlBerhenti = `${funcUrl}?token=${u.token_berhenti}&jenis=streak`;
    const t = templatPengingat(u.nama, progData.streak, urlSitus, urlBerhenti);

    try {
      await client.send({
        from: `BisaNgoding <${gmailUser}>`,
        to: u.email,
        subject: t.subjek,
        content: t.teks,
        html: t.html,
        headers: {
          "List-Unsubscribe": `<${urlBerhenti}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Reply-To": gmailUser
        }
      });
      
      await supabase.from("log_email").insert({
        user_id: u.user_id,
        jenis: "streak",
        kunci: hariIni
      });
      
      terkirim++;
    } catch (e) {
      console.error(`Gagal kirim ke ${u.user_id}:`, e);
      gagal++;
    }
    
    await sleep(2000); // Jedaa kecil
  }


  } finally {
    await client.close();
  }

  return new Response(JSON.stringify({ dipilih: yangButuh.length, terkirim, gagal }));
});
