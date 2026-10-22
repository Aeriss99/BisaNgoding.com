import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { saringAkunTidakAktif, type AkunEvaluasi } from "../_shared/tidakAktif.ts";

function buatProgresKosong(resetAt: string) {
  const today = resetAt.split('T')[0];
  return {
    completedLessons: [],
    passedChecks: [],
    moduleStatus: { dasar: 'unlocked' },
    quizScores: {},
    xp: 0,
    streak: 0,
    lastActiveDate: today,
    maxSeenDate: today,
    version: 1,
    resetAt,
  };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Ambil daftar admin
  const { data: adminsData } = await supabase
    .from("admins")
    .select("email");
  const daftarAdmin = new Set<string>(
    (adminsData || []).map((a: any) => (a.email || "").toLowerCase().trim())
  );

  // 2. Ambil semua akun dari auth.admin
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (userError || !userData?.users) {
    console.error("Gagal mengambil users:", userError);
    return new Response(JSON.stringify({ error: userError?.message || "User error" }), { status: 500 });
  }

  const users = userData.users;
  const userIds = users.map((u) => u.id);

  // 3. Ambil data progres
  const progresMap = new Map<string, { diperbarui?: string }>();
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200);
    const { data: progList } = await supabase
      .from("progres")
      .select("user_id, diperbarui")
      .in("user_id", chunk);
    if (progList) {
      for (const p of progList) {
        progresMap.set(p.user_id, p);
      }
    }
  }

  // 4. Ambil data blokir_akun terakhir
  const blokirMap = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200);
    const { data: blokirList } = await supabase
      .from("blokir_akun")
      .select("user_id, sampai")
      .in("user_id", chunk)
      .order("sampai", { ascending: false });
    if (blokirList) {
      for (const b of blokirList) {
        if (!blokirMap.has(b.user_id)) {
          blokirMap.set(b.user_id, b.sampai);
        }
      }
    }
  }

  // 5. Susun daftar evaluasi
  const evalList: AkunEvaluasi[] = users.map((u) => {
    const p = progresMap.get(u.id);
    const sampai = blokirMap.get(u.id);
    return {
      id: u.id,
      email: u.email || "",
      diperbarui: p?.diperbarui || null,
      last_sign_in_at: u.last_sign_in_at || null,
      banned_until: (u as any).banned_until || null,
      terakhir_blokir_sampai: sampai || null,
    };
  });

  // 6. Saring akun tidak aktif > 7 hari
  const terpilih = saringAkunTidakAktif(evalList, daftarAdmin, now);

  const durasiBlokirMs = 120 * 60 * 60 * 1000; // 5 hari = 120 jam
  const blokirSampaiISO = new Date(now.getTime() + durasiBlokirMs).toISOString();

  for (const akun of terpilih) {
    try {
      // a. Reset progres
      await supabase.from("progres").upsert({
        user_id: akun.id,
        data: buatProgresKosong(nowISO),
        diperbarui: nowISO,
      });

      // b. Blokir 5 hari (120 jam)
      await supabase.auth.admin.updateUserById(akun.id, {
        ban_duration: "120h",
      });

      // c. Catat di blokir_akun
      await supabase.from("blokir_akun").insert({
        user_id: akun.id,
        mulai: nowISO,
        sampai: blokirSampaiISO,
        alasan: "tidak aktif 7 hari",
      });
    } catch (err) {
      console.error(`Gagal memproses blokir/reset akun ${akun.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ diproses: terpilih.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
