/** true saat berjalan dengan `npm run dev`. Progres hanya di browser, tidak ke Supabase. */
export function apakahModeLokal(): boolean {
  return import.meta.env.DEV === true;
}
