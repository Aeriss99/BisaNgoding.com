import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { tanggalJakarta, perluPengingat, templatPengingat } from "../_shared/aturan.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
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
    .select("user_id, email, nama, token_berhenti, auth_users:user_id(progres(data))")
    .eq("streak", true);

  if (error || !users) {
    return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
  }

  const yangButuh = users.filter((u: any) => {
    const progresArr = u.auth_users?.progres;
    if (!progresArr || progresArr.length === 0) return false;
    const progData = progresArr[0].data;
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

  const client = new SmtpClient();
  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 465,
    username: gmailUser,
    password: gmailPassword,
  });

  let terkirim = 0;
  let gagal = 0;

  for (const u of target) {
    const progresArr = u.auth_users?.progres;
    const progData = progresArr[0].data;
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
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
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
    
    await sleep(200); // Jedaa kecil
  }

  await client.close();

  return new Response(JSON.stringify({ dipilih: yangButuh.length, terkirim, gagal }));
});
