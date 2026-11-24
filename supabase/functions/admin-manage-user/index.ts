// Edge Function: admin-manage-user — Admin mengubah (action "update": name, role) atau menghapus (action "delete") akun.
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
    if (String(me?.role).toLowerCase() !== "admin") return json({ success: false, error: "Hanya Admin yang boleh mengelola akun." }, 403);

    const { action, user_id, name, role } = await req.json();
    if (!user_id) return json({ success: false, error: "user_id wajib diisi." }, 400);
    const self = user_id === u.user.id;

    if (action === "delete") {
      if (self) return json({ success: false, error: "Akun Anda sendiri tidak dapat dihapus." }, 400);
      await admin.from("profiles").delete().eq("user_id", user_id);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true });
    }
    if (action === "update") {
      const patch: Record<string, string> = {};
      if (name) patch.nama = String(name).trim();
      if (role) {
        if (self) return json({ success: false, error: "Peran akun Anda sendiri tidak dapat diubah." }, 400);
        patch.role = String(role).toLowerCase() === "admin" ? "admin" : "petugas";
      }
      if (!Object.keys(patch).length) return json({ success: false, error: "Tidak ada perubahan." }, 400);
      const { error } = await admin.from("profiles").update(patch).eq("user_id", user_id);
      if (error) return json({ success: false, error: error.message }, 400);
      if (patch.nama) await admin.auth.admin.updateUserById(user_id, { user_metadata: { name: patch.nama } });
      return json({ success: true });
    }
    return json({ success: false, error: "Aksi tidak dikenal." }, 400);
  } catch (e) { return json({ success: false, error: String((e as Error).message || e) }, 500); }
});
