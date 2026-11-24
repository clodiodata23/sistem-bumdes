/* Manajemen Pengguna — daftar berbentuk kartu, edit/hapus lewat jendela rapi (bukan kotak bawaan browser). */
(function(){
  const form=document.getElementById('bumdesCreateUserForm'); if(!form)return;
  const nav=document.getElementById('nav-manajemen-pengguna');
  const submit=document.getElementById('createUserSubmit');
  const result=document.getElementById('createUserResult');
  const list=document.getElementById('managedUsersList');
  const count=document.getElementById('usersCount');
  const listResult=document.getElementById('managedUsersResult');
  const search=document.getElementById('umSearch');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isAdmin=()=>String(window.bumdesCurrentRole||'').toLowerCase()==='admin';
  const toast=(m,t)=>{if(window.uxToast)window.uxToast(m,t);};
  const roleOf=u=>String(u.role||'petugas').toLowerCase()==='admin'?'admin':'petugas';
  const initials=n=>{const p=String(n||'?').trim().split(/\s+/).filter(Boolean);return((p[0]||'?')[0]+(p[1]?p[1][0]:'')).toUpperCase();};
  const svg=d=>'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const ICON_EDIT=svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>');
  const ICON_DEL=svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/>');
  let USERS=[];

  function syncAdminAccess(){
    if(nav)nav.style.display=isAdmin()?'':'none';
    const pg=document.getElementById('page-manajemen-pengguna');
    if(!isAdmin()&&pg&&pg.classList.contains('active'))pg.classList.remove('active');
  }
  window.syncBumdesUserManagementAccess=syncAdminAccess;
  const app=document.getElementById('bumdesMainApp');
  if(app)new MutationObserver(syncAdminAccess).observe(app,{attributes:true,subtree:true,attributeFilter:['class','style']});
  document.addEventListener('click',e=>{
    if(e.target.closest('#nav-manajemen-pengguna')&&!isAdmin()){e.preventDefault();alert('Menu ini hanya dapat diakses Admin.');}
  });

  async function sessionToken(){
    const {data,error}=await window.supabaseClient.auth.getSession();
    if(error||!data?.session?.access_token)throw new Error('Sesi login tidak ditemukan. Silakan login ulang sebagai Admin.');
    return data.session.access_token;
  }
  async function manage(action,user_id,extra={}){
    const token=await sessionToken();
    const {data,error}=await window.supabaseClient.functions.invoke('admin-manage-user',{body:{action,user_id,...extra},headers:{Authorization:'Bearer '+token}});
    if(error){let msg=error.message||'Permintaan gagal.';try{if(error.context?.json){const b=await error.context.json();msg=b.error||b.message||msg;}}catch(_){}throw new Error(msg);}
    if(!data?.success)throw new Error(data?.error||'Fungsi tidak mengembalikan status berhasil.');
    return data;
  }

  /* --- daftar --- */
  function render(){
    const q=(search?search.value:'').trim().toLowerCase();
    const rows=USERS.filter(u=>!q||String(u.nama||'').toLowerCase().includes(q));
    const adm=USERS.filter(u=>roleOf(u)==='admin').length;
    count.textContent=USERS.length+' pengguna · '+adm+' Admin · '+(USERS.length-adm)+' Petugas';
    if(!rows.length){list.innerHTML='<div class="um-empty">'+(USERS.length?'Tidak ada pengguna yang cocok.':'Belum ada pengguna.')+'</div>';return;}
    const me=window.bumdesCurrentUser&&window.bumdesCurrentUser.id;
    list.innerHTML=rows.map(u=>{
      const r=roleOf(u),self=!!me&&String(u.user_id)===String(me);
      return '<div class="um-user"><div class="um-av um-av-'+r+'" aria-hidden="true">'+esc(initials(u.nama))+'</div>'+
        '<div class="um-info"><div class="um-name">'+esc(u.nama||'—')+(self?'<span class="um-you">Anda</span>':'')+'</div>'+
        '<span class="um-role um-role-'+r+'">'+(r==='admin'?'Admin':'Petugas')+'</span></div>'+
        '<div class="um-actions"><button type="button" class="um-btn" data-edit-user="'+esc(u.user_id)+'">'+ICON_EDIT+'<span>Edit</span></button>'+
        (self?'':'<button type="button" class="um-btn um-btn-del" data-delete-user="'+esc(u.user_id)+'">'+ICON_DEL+'<span>Hapus</span></button>')+'</div></div>';
    }).join('');
  }
  async function loadUsers(){
    if(!isAdmin())return;
    count.textContent='Memuat daftar pengguna…';
    list.innerHTML='<div class="um-empty">Memuat…</div>';
    try{
      const {data,error}=await window.supabaseClient.from('profiles').select('user_id,nama,role').order('nama',{ascending:true});
      if(error)throw error;
      USERS=data||[];render();
    }catch(err){
      count.textContent='Daftar pengguna gagal dimuat.';
      list.innerHTML='<div class="um-empty">'+esc(err.message||'Terjadi kesalahan.')+'</div>';
    }
  }

  /* --- jendela edit / hapus --- */
  function modal(o){
    const wrap=document.createElement('div');wrap.className='um-modal';
    wrap.innerHTML='<div class="um-backdrop"></div><div class="um-sheet" role="dialog" aria-modal="true" aria-label="'+esc(o.title)+'"><h3>'+esc(o.title)+'</h3>'+
      '<div class="um-body">'+o.html+'</div><div class="um-err result" role="alert"></div>'+
      '<div class="um-foot"><button type="button" class="um-btn" data-x>Batal</button><button type="button" class="um-btn '+(o.danger?'um-btn-solid-del':'um-btn-ok')+'" data-ok>'+esc(o.ok)+'</button></div></div>';
    document.body.appendChild(wrap);
    const onKey=e=>{if(e.key==='Escape')close();};
    const close=()=>{wrap.remove();document.removeEventListener('keydown',onKey);};
    document.addEventListener('keydown',onKey);
    wrap.querySelector('.um-backdrop').onclick=close;wrap.querySelector('[data-x]').onclick=close;
    const ok=wrap.querySelector('[data-ok]'),err=wrap.querySelector('.um-err'),label=ok.textContent;
    ok.onclick=async()=>{
      err.className='um-err result';err.textContent='';ok.disabled=true;ok.textContent='Memproses…';
      try{await o.onOk(wrap);close();}
      catch(e){err.textContent=e.message||'Terjadi kesalahan.';err.className='um-err result error';ok.disabled=false;ok.textContent=label;}
    };
    const first=wrap.querySelector('input');(first||ok).focus();
    return wrap;
  }
  function editUser(u){
    const me=window.bumdesCurrentUser&&window.bumdesCurrentUser.id,self=!!me&&String(u.user_id)===String(me);
    let role=roleOf(u);
    const w=modal({title:'Edit Pengguna',ok:'Simpan',
      html:'<label class="um-lbl">Nama pengguna<input id="umEditName" type="text" maxlength="100" value="'+esc(u.nama||'')+'"></label>'+
        '<div class="um-lbl">Peran<div class="um-seg">'+
        '<button type="button" data-role="petugas"'+(role==='petugas'?' class="on"':'')+(self?' disabled':'')+'>Petugas</button>'+
        '<button type="button" data-role="admin"'+(role==='admin'?' class="on"':'')+(self?' disabled':'')+'>Admin</button></div>'+
        (self?'<small class="um-note">Peran akun Anda sendiri tidak bisa diubah di sini.</small>':'')+'</div>',
      onOk:async root=>{
        const name=root.querySelector('#umEditName').value.trim();
        if(!name)throw new Error('Nama tidak boleh kosong.');
        await manage('update',u.user_id,{name,role});
        toast('Data pengguna berhasil diperbarui.','ok');
        listResult.textContent='';await loadUsers();
      }});
    w.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{
      if(b.disabled)return;role=b.dataset.role;
      w.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('on',x===b));
    }));
  }
  function deleteUser(u){
    modal({title:'Hapus Akun',ok:'Hapus akun',danger:true,
      html:'<p class="um-p">Hapus akun <b>'+esc(u.nama||'pengguna')+'</b>? Tindakan ini tidak dapat dibatalkan.</p>',
      onOk:async()=>{await manage('delete',u.user_id);toast('Akun berhasil dihapus.','ok');listResult.textContent='';await loadUsers();}});
  }
  list.addEventListener('click',e=>{
    const ed=e.target.closest('[data-edit-user]'),de=e.target.closest('[data-delete-user]');
    if(!ed&&!de)return;
    const id=(ed||de).dataset[ed?'editUser':'deleteUser'];
    const u=USERS.find(x=>String(x.user_id)===String(id));
    if(!u){toast('Data pengguna tidak ditemukan. Muat ulang daftar.','err');return;}
    if(ed)editUser(u);else deleteUser(u);
  });
  document.getElementById('reloadUsersBtn')?.addEventListener('click',loadUsers);
  if(search)search.addEventListener('input',render);

  /* --- buat akun --- */
  const eye=document.getElementById('umTogglePass'),pass=document.getElementById('newUserPassword');
  if(eye&&pass)eye.addEventListener('click',()=>{const show=pass.type==='password';pass.type=show?'text':'password';eye.textContent=show?'Sembunyikan':'Lihat';});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fail=m=>{result.textContent=m;result.className='result error';};
    if(!isAdmin()){fail('Akses ditolak. Hanya Admin yang dapat membuat akun.');return;}
    const email=document.getElementById('newUserEmail').value.trim().toLowerCase(),password=pass.value,
      name=document.getElementById('newUserName').value.trim(),role=document.getElementById('newUserRole').value;
    if(password.length<8){fail('Kata sandi minimal 8 karakter.');return;}
    submit.disabled=true;submit.textContent='Membuat akun…';result.textContent='';result.className='';
    try{
      const token=await sessionToken();
      const {data,error}=await window.supabaseClient.functions.invoke('admin-create-user',{body:{email,password,name,role},headers:{Authorization:'Bearer '+token}});
      if(error){let detail=error.message||'Gagal membuat akun.';try{if(error.context?.json){const b=await error.context.json();detail=b.error||b.message||detail;}}catch(_){}throw new Error(detail);}
      if(!data?.success)throw new Error(data?.error||'Fungsi tidak mengembalikan konfirmasi berhasil.');
      result.textContent='✓ Akun berhasil dibuat ('+email+' · '+role+').';result.className='result success';
      form.reset();if(pass){pass.type='password';if(eye)eye.textContent='Lihat';}
      await loadUsers();
    }catch(err){fail('Gagal membuat akun: '+(err.message||'Periksa sesi dan konfigurasi Edge Function.'));}
    finally{submit.disabled=false;submit.textContent='＋ Buat Akun';syncAdminAccess();}
  });

  syncAdminAccess();
  nav?.addEventListener('click',()=>setTimeout(loadUsers,100));
})();
