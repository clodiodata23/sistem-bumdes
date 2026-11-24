// Edge Function: admin-create-user — Admin membuat akun baru (email, password, nama, peran).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(url, service);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ success: false, error: "Sesi tidak valid. Silakan login ulang." }, 401);
    const { data: me } = await admin.from("profiles").select("role").eq("user_id", u.user.id).maybeSingle();
    if (String(me?.role).toLowerCase() !== "admin") return json({ success: false, error: "Hanya Admin yang boleh membuat akun." }, 403);

    const { email, password, name, role } = await req.json();
    const peran = String(role).toLowerCase() === "admin" ? "admin" : "petugas";
    if (!email || !password || !name) return json({ success: false, error: "Email, kata sandi, dan nama wajib diisi." }, 400);
    if (String(password).length < 8) return json({ success: false, error: "Kata sandi minimal 8 karakter." }, 400);

    const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (error || !created?.user) return json({ success: false, error: error?.message || "Gagal membuat akun." }, 400);
    const { error: pe } = await admin.from("profiles").insert({ user_id: created.user.id, nama: name, role: peran });
    if (pe) { await admin.auth.admin.deleteUser(created.user.id); return json({ success: false, error: "Profil gagal dibuat: " + pe.message }, 400); }
    return json({ success: true, user: { id: created.user.id, email, nama: name, role: peran } });
  } catch (e) { return json({ success: false, error: String((e as Error).message || e) }, 500); }
});
