(function(){
  const gate = document.getElementById('bumdesLoginGate');
  const form = document.getElementById('bumdesLoginForm');
  const button = document.getElementById('bumdesLoginButton');
  const message = document.getElementById('bumdesLoginMessage');
  const app = document.getElementById('bumdesMainApp');
  const userBar = document.getElementById('bumdesUserBar');
  const userBadge = document.getElementById('bumdesUserBadge');
  const logoutButton = document.getElementById('bumdesLogoutButton');
  const passwordInput = document.getElementById('bumdesLoginPassword');
  const passwordToggle = document.getElementById('bumdesPasswordToggle');
  passwordToggle.addEventListener('click', function(){
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    passwordToggle.textContent = showPassword ? 'Sembunyi' : 'Lihat';
    passwordToggle.setAttribute('aria-label', showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    passwordToggle.setAttribute('aria-pressed', String(showPassword));
  });
  let initialized = false;
  let dashboardPrefetch = false;
  if (!window.supabaseClient || !window.supabaseClient.auth) {
    showLogin('Koneksi Supabase belum siap. Muat ulang halaman dan periksa koneksi internet/CDN Supabase.');
    console.error('Supabase client tidak tersedia pada window.supabaseClient.');
    return;
  }

  function showLogin(text){
    gate.hidden = false;
    if(app) app.setAttribute('aria-hidden','true');
    message.textContent = text || '';
  }
  function showApp(user, role, nama){
    gate.hidden = true;
    if (typeof window.enterBumdesApp === 'function') window.enterBumdesApp();
    if(app) app.removeAttribute('aria-hidden');
    window.bumdesCurrentUser = user;
    window.bumdesCurrentRole = role;
    window.bumdesCurrentName = nama || user.email || "Pengguna";
    if(userBar) userBar.style.display = 'flex';
    if(userBadge) userBadge.textContent = (role === 'admin' ? '● ADMIN' : '● PETUGAS') + ' · ' + (user.email || 'Pengguna');
    // Reset massal dibatasi untuk Admin. Hak akses database tetap wajib diatur melalui RLS.
    document.querySelectorAll('.nav-reset').forEach(el => { el.style.display = role === 'admin' ? '' : 'none'; });
    if(typeof window.syncBumdesUserManagementAccess === 'function') window.syncBumdesUserManagementAccess();
    if(!initialized){
      initialized = true;
      if(typeof cekKoneksi === 'function') cekKoneksi();
      if(!dashboardPrefetch && typeof loadDashboard === 'function') loadDashboard();
      dashboardPrefetch = false;
    }
  }
  async function validateSession(session){
    if(!session || !session.user){ showLogin('Silakan masuk menggunakan akun terdaftar.'); return; }
    try {
      const {data, error} = await window.supabaseClient.from('profiles').select('nama,role').eq('user_id',session.user.id).maybeSingle();
      if(error) throw error;
      if(!data || !['admin','petugas'].includes(String(data.role || '').toLowerCase())){
        await window.supabaseClient.auth.signOut();
        showLogin('Akun belum memiliki role Admin atau Petugas. Minta Admin mengatur role akun di Supabase.');
        return;
      }
      showApp(session.user, String(data.role).toLowerCase(), data.nama || session.user.email || 'Pengguna');
    } catch(err){
      console.error('Validasi profil login:', err);
      showLogin('Belum dapat memeriksa role akun. Pastikan tabel profiles dan kebijakan RLS sudah disiapkan di Supabase.');
    }
  }
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    button.disabled = true; button.textContent = 'Memeriksa akun…'; message.textContent = '';
    try {
      const email = document.getElementById('bumdesLoginEmail').value.trim();
      const password = document.getElementById('bumdesLoginPassword').value;
      const {data, error} = await window.supabaseClient.auth.signInWithPassword({email, password});
      if(error) throw error;
      await validateSession(data.session);
    } catch(err){
      message.textContent = err.message && /invalid login credentials/i.test(err.message) ? 'Email atau kata sandi tidak sesuai.' : (err.message || 'Login gagal. Periksa koneksi dan konfigurasi Supabase.');
    } finally { button.disabled = false; button.textContent = 'Masuk'; }
  });
  logoutButton.addEventListener('click', async function(){
    logoutButton.disabled = true;
    const {error} = await window.supabaseClient.auth.signOut();
    logoutButton.disabled = false;
    if(error){ alert('Gagal keluar: ' + error.message); return; }
    initialized = false; window.bumdesCurrentUser = null; window.bumdesCurrentRole = null; window.bumdesCurrentName = null;
    if(userBar) userBar.style.display = 'none';
    showLogin('Anda sudah keluar dari aplikasi.');
  });
  document.addEventListener('DOMContentLoaded', async function(){
    showLogin('Memeriksa sesi login…');
    const {data, error} = await window.supabaseClient.auth.getSession();
    if(error){ showLogin('Gagal memeriksa sesi: ' + error.message); return; }
    // Data dashboard mulai diambil SAMBIL memeriksa role (hak akses data tetap dijaga RLS Supabase).
    if(data.session && typeof loadDashboard === 'function'){ dashboardPrefetch = true; loadDashboard(); }
    await validateSession(data.session);
    if(!initialized) dashboardPrefetch = false;
  });
  window.supabaseClient.auth.onAuthStateChange(function(event, session){
    if(event === 'SIGNED_OUT'){ initialized = false; showLogin('Silakan masuk kembali.'); }
  });
})();
